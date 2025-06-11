import { useEffect, useState } from 'react'
import { stringify, parse } from 'flatted';

import 'rpg-awesome/css/rpg-awesome.min.css';

import Consortium from './components/consortium/Consortium'
import GameControls from './components/GameControls'
import { advanceTime, handleAction, togglePlayerAlive } from './game/core'
import { handleHunterAbility } from './game/Hunter'
import { canPlayerActTonight, defaultGameState, findPlayersNeighbours, isPlayerDrunk, isPlayerPoisoned } from './game/utils'

import roles, { Role } from './data/roles'
import { Status } from './data/statuses'

import './App.css'
import './globals.css'
import { PlayerType, PlayState, PlayStateType, Team } from './enums'
import pseudonyms from './data/pseudonyms';
import GridList from './components/common/GridList/GridList'
import CheckButton from './components/common/CheckButton/CheckButton'
import { Tooltip, TooltipClickContent, TooltipContent, TooltipHoverContent, TooltipTrigger } from './components/common/Tooltip/Tooltip'
import { Tab, Tabs } from './components/common/Tabs/Tabs'

import styles from './components/consortium/Consortium.module.scss';
import Log from './components/Log';
import IconButton from './components/common/IconButton/IconButton';
import { usePrompt } from './components/common/Prompt/Prompt';
import Soundboard from './components/SoundBoard';

export type GameState = {
    day: number;
    time: number;
    state: PlayStateType;
    turn?: number;
    turnOrder?: number[];
    advancementBlocked?: string;

    /* special state used to handle certain game cases */
    special?: {
        state: string;
        previous: PlayStateType;
    };

    players: Player[];

    /* voting */
    nominations: string[];
    nominators: string[];
    choppingBlock?: {
        playerName: string;
        votes: number;
    };

    /* extras */
    log: LogEvent[];
    logBuffer: LogEvent[];
    currentEvent?: LogEvent;
    popupEvent?: PopupEvent;
    bluffs?: Role[];

    lastNight: {
        lynched?: number;
    };
}

export type Settings = {
    useOriginalNames: boolean;
}

export type Player = {
    name: string; // this is the player's codename (mandatory)
    realName?: string; // this is the player's real name (optional)
    alive: boolean;
    role?: Role;
    oldRoles: Role[];
    statuses: Status[];
    ghostVotes: number;
    abilityUses: number;
    knowledge: LogEvent[];
}

export type LogEvent = {
    type: 'public' | 'private' | 'alert' | 'severe' | 'heading';
    message: string;
    extra?: string;
    indent?: number;
}

export type PopupEvent = {
    heading?: string;
    message?: JSX.Element | string;
    events?: LogEvent[];
    extra?: string;
    override?: {
        type: 'investigate' | 'welcome' | 'help';
        param?: string;
    };
}

function App() {

    const [gameState, setGameState] = useState<GameState>(loadGameState() || {
        ...defaultGameState(5, pseudonyms),
        popupEvent: {
            override: {
                type: 'welcome',
            }
        },
    });

    const [gameSettings, setGameSettings] = useState<Settings>({
        useOriginalNames: false,
    });

    const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

    const [villagerPool, setVillagerPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.VILLAGER ? index : null).filter(i => i !== null));
    const [outsiderPool, setOutsiderPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.OUTSIDER ? index : null).filter(i => i !== null));
    const [werewolfPool, setWerewolfPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.WEREWOLF ? index : null).filter(i => i !== null));
    const [minionPool, setMinionPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.MINION ? index : null).filter(i => i !== null));

    const [showLeftPanel, setShowLeftPanel] = useState<boolean>(false);
    const [showRightPanel, setShowRightPanel] = useState<boolean>(false);

    const { showPrompt, PromptDialog } = usePrompt();

    const isMobile = (typeof window !== 'undefined') && (window.innerWidth <= 767);

    const timeSymbol = getTimeSymbol();

    useEffect(() => {
        // temp
        setShowLeftPanel(false);
        setShowRightPanel(false);
    }, []);

    useEffect(() => {
        if (gameState) {
            const serialisedState = stringify(gameState);
            const currentStoredState = localStorage.getItem('gameState');

            if (currentStoredState !== serialisedState) {
                try {
                    localStorage.setItem('gameState', serialisedState);
                }
                catch (e) {
                    console.error('Error saving to local storage:', e);
                }
            }
        }
    }, [gameState]);

    useEffect(() => {
        if (currentPlayer !== null) {
            const player = gameState.players[currentPlayer];
            // EMPATH
            if (player.role?.name === 'Empath') {
                const neighbours = findPlayersNeighbours(gameState, currentPlayer);
                setSelectedPlayers(neighbours);

                // game log
                setGameState((prev) => {
                    const tempGameState = {...prev};
                    tempGameState.currentEvent = {
                        type: 'private',
                        message: `${player.name} learnt that x of ${neighbours.map(
                            (index) => tempGameState.players[index].name
                        ).join(', ')} are evil.`,
                    };
                    return tempGameState;
                });
            }
            // WASHERWOMAN, LIBRARIAN, INVESTIGATOR, NAIN
            else if (
                player.role?.name === 'Washerwoman'
                || player.role?.name === 'Librarian'
                || player.role?.name === 'Investigator'
                || player.role?.name === 'Nain'
            ) {
                if (player.role?.abilityUses === undefined || player.abilityUses < player.role?.abilityUses) {
                    setGameState((prev) => ({
                        ...prev,
                        popupEvent: {
                            override: {
                                type: 'investigate',
                                param: player.role?.name,
                            }
                        }
                    }));
                }
            }
            else {
                setSelectedPlayers([]);
            }
        }
        else {
            setSelectedPlayers([]);
        }
    }, [currentPlayer]);

    useEffect(() => {
        if (gameState.players.length > 0 && gameState.state === PlayState.PLAYING) {
            // check game-over conditions
            if (!gameState.players.find(player => player.role?.type === PlayerType.WEREWOLF && player.alive)) {
                // no Werewolves alive
                gameState.state = PlayState.VICTORY;
            }
            else {
                const remainingGoodPlayers = gameState.players.filter(player => player.role?.team === Team.GOOD && player.alive).length;

                const remainingVotes = gameState.players.reduce((acc, player) => acc + (player.alive ? 1 : player.ghostVotes), 0);
                const remainingEvilVotes = gameState.players
                    .filter(player => player.role?.team === Team.EVIL && player.alive)
                    .reduce((acc, player) => acc + (player.alive ? 1 : player.ghostVotes), 0);
                const voteMajority = Math.ceil(remainingVotes / 2);

                if (
                    remainingGoodPlayers === 0 // Werewolf nomination impossible
                    || remainingEvilVotes >= voteMajority // Werewolf lynch infeasible
                ) {
                    // Evil outnumber Good
                    gameState.state = PlayState.DEFEAT;
                }
            }
        }
    }, [gameState]);

    useEffect(() => {
        if (gameState.state === PlayState.DEFEAT) {
            gameOver('Werewolves');
        }
        else if (gameState.state === PlayState.VICTORY) {
            gameOver('Villagers');
        }
    }, [gameState.state]);

    useEffect(() => {
        if (currentPlayer) {
            const role = gameState.players[currentPlayer].role;
            if (role?.name === 'Seer') {
                setGameState((prev) => ({
                    ...prev,
                    advancementBlocked: selectedPlayers.length < 2 ? 'Seer must select two players!' : undefined,
                }));
            }
        }
    }, [currentPlayer, selectedPlayers, gameState.players]);

    function gameOver(winner: string) {
        const log: LogEvent[] = [
            { type: 'heading', message: 'Game Over!' },
            { type: 'severe', message: `The ${winner} have won!`, indent: 1 },
        ]
        setGameState((prev) => ({
            ...prev,
            popupEvent: {
                heading: `The ${winner} have won!`,
                events: log,
            },
            log: [
                ...prev.log,
                ...log,
            ],
            time: 1,
        }));
        setCurrentPlayer(null);
        setSelectedPlayers([]);
    }

    function loadGameState() {
        try {
            const cachedGameState = localStorage.getItem('gameState');
            if (cachedGameState) {
                return parse(cachedGameState);
            }
        }
        catch (e) {
            console.error('Error loading game state from local storage:', e);
        }
        return null;
    }

    // function handleSettingsChange(event: React.ChangeEvent<HTMLInputElement>) {
    //     const { id, value } = event.target;
    //     setGameSettings((prev) => ({
    //         ...prev,
    //         [id]: value,
    //     }))
    // }

    function resetGameState(keepNames = false) {
        if (keepNames) {
            setGameState((prev) => ({
                ...defaultGameState(prev.players.length, pseudonyms),
                players: prev.players.map(player => ({
                    ...player,
                    alive: true,
                    role: undefined,
                    statuses: [],
                    ghostVotes: 1,
                })),
            }));
        }
        else {
            setGameState(defaultGameState(gameState.players.length, pseudonyms));
        }
        setCurrentPlayer(null);
        setSelectedPlayers([]);
    }

    function getTimeSymbol() {
        switch (gameState.time) {
            case 0:
                if (currentPlayer === null) {
                    return 'ra ra-cog';
                }
                return 'ra ra-wolf-howl'
            case 1:
                return 'ra ra-sun'
            case 2:
                return 'ra ra-moon-sun'
            default:
                return ''
        }
    }

    function getTimeBlurb() {
        if (gameState.state === PlayState.DEFEAT) {
            return 'The Werewolves have won!';
        }
        else if (gameState.state === PlayState.VICTORY) {
            return 'The Villagers have won!';
        }

        switch (gameState.time) {
            case 0:
                if (currentPlayer === null) {
                    return 'Configure the game.';
                }
                return `It is ${gameState.turn ? gameState.turn + 1 : 1} o'clock (${gameState.players[currentPlayer].name}'s turn)`;
            case 1:
                return 'Disscussion';
            case 2:
                return 'Voting';
            default:
                return '';
        }
    }

    function roleSettingsPanel(roleType: string, rolePool: number[], setRolePool: React.Dispatch<React.SetStateAction<number[]>>, active: boolean = false) {

        const updateRolePool = (index: number) => {
            if (rolePool.includes(index)) {
                setRolePool(rolePool.filter(i => i !== index));
            } else {
                setRolePool([...rolePool, index]);
            }
        }

        let poolEnabled = true;
        if (roleType === PlayerType.MINION && gameState.players.length < 6) {
            poolEnabled = false;
        }

        return (
            <GridList columns={6}>
                {
                    roles.map((role, index) => {
                        if (role.type !== roleType) {
                            return;
                        }

                        const displayName = gameSettings.useOriginalNames ? (role.altName ?? role.name) : role.name;
                        const blockers: string[] = []; // reasons why this role is disabled

                        // check role pool
                        if (!poolEnabled) {
                            blockers.push('Not enough players');
                        }

                        // role pre-requires
                        const preReqsMet = role.prereqRoles === undefined || role.prereqRoles.every(
                            prereq => {
                                const poolToSearch = (() => {
                                    switch (prereq.value) {
                                        case PlayerType.VILLAGER:
                                            return villagerPool;
                                        case PlayerType.OUTSIDER:
                                            return outsiderPool;
                                        case PlayerType.WEREWOLF:
                                            return werewolfPool;
                                        case PlayerType.MINION:
                                            return minionPool;

                                        case Team.GOOD:
                                            return [...villagerPool, ...outsiderPool];
                                        case Team.EVIL:
                                            return [...werewolfPool, ...minionPool];

                                        default:
                                            return [];
                                    }
                                })();
                                const isPreRqMet = poolToSearch.length >= prereq.count;
                                if (!isPreRqMet) {
                                    blockers.push(`Requires ${prereq.count} ${prereq.value}`);
                                }
                                return isPreRqMet;
                            }
                        );
                        const valid = preReqsMet && poolEnabled;

                        if (!valid && rolePool.includes(index)) {
                            // remove this role from the pool if it's no longer valid
                            updateRolePool(index);
                        }

                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger>
                                    <CheckButton
                                        image={`/red-minaret/icons/${role.icon}.png`}
                                        altText={displayName}
                                        isChecked={rolePool.includes(index)}
                                        onChange={active ? () => updateRolePool(index) : () => {}}
                                        disabled={!valid}
                                        styles={{
                                            cursor: valid ? (active ? 'pointer' : 'help') : 'not-allowed',
                                        }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div
                                        style={{
                                            maxWidth: '400px',
                                        }}
                                    >
                                        <div><strong>{displayName}</strong></div>
                                        <div>{role.description}</div>
                                        { blockers.length > 0 &&
                                            <div className='error'>
                                                {
                                                    // explain why this role is disabled, if so
                                                    blockers.map((blocker, index) => (
                                                        <div key={index}>{blocker}</div>
                                                    ))
                                                }
                                            </div>
                                        }
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })
                }
            </GridList>
        );
    }

    function getNightInstruction() {
        if (currentPlayer === null) {
            return null;
        }

        const player = gameState.players[currentPlayer];
        const playerCanAct = canPlayerActTonight(player, gameState);

        let instruction = playerCanAct ? player.role?.night : 'There is nothing for this player to do, right now...';

        // DRUNK
        if (isPlayerDrunk(player)) {
            instruction = `${instruction} Remember, this player is the Drunk!`;
        }
        // POISONED
        else if (isPlayerPoisoned(player)) {
            instruction = `${instruction} Remember, this player has been poisoned!`;
        }

        return instruction;
    }

    function handleActionCall(index: number) {
        handleAction(index, currentPlayer, setCurrentPlayer, gameState, setGameState, selectedPlayers, setSelectedPlayers, showPrompt);
    }

    function handleSpecialAction(specialState: string) {
        switch (specialState) {
            case 'Hunter':
                handleHunterAbility(gameState, selectedPlayers, setGameState, setCurrentPlayer, setSelectedPlayers, showPrompt);
                break;
            case 'Artist':
                break;
            default:
                break;
        }
    }

    function togglePlayerAliveCall(name: string) {
        togglePlayerAlive(name, gameState, setGameState);
    }

    function shuffleCodeNames() {
        const tempGameState = {...gameState};
        const shuffledNames = [...pseudonyms].sort(() => Math.random() - 0.5);
        tempGameState.players.forEach((player, index) => {
            player.name = shuffledNames[index].name;
        });
        setGameState(tempGameState);
    }

    function addPlayer() {
        const tempGameState = {...gameState};
        const playerName = [...pseudonyms]
            .sort(() => Math.random() - 0.5)
            .find(pseudonym => !gameState.players.find(player => player.name === pseudonym.name))?.name
            ?? `Player ${gameState.players.length + 1}`;

        tempGameState.players.push({
            name: playerName, realName: `Player ${tempGameState.players.length + 1}`,
            alive: true, statuses: [], ghostVotes: 1, abilityUses: 0,
            knowledge: [], oldRoles: [],
        });
        setGameState(tempGameState);
    }

    function removePlayer(name: string) {
        const tempGameState = {...gameState};
        tempGameState.players = tempGameState.players.filter(player => player.name !== name);
        setGameState(tempGameState);
    }

    return (
        <div className='tempname'>

            {/* BACKGROUND IMAGE */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: -1,

                    backgroundImage: `url('/red-minaret/backgrounds/${gameState.time === 0 ? 'TajMahalNight' : 'TajMahalDay'}.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: `brightness(${gameState.time === 0 ? 20 : 30}%)`,
                    margin: 0,
                }}
            />

            {/* PROMPT */}
            { PromptDialog }

            {/* TOP-RIGHT */}
            <div className='dialogue-x'>
                <IconButton
                    icon={<i className='ra ra-book' />}
                    onClick={() => setGameState((prev) => ({...prev, popupEvent: { override: { type: 'help' } } }))}
                    label='How to Play'
                />

                { !isMobile || !showLeftPanel &&
                    <IconButton
                        icon={<i className='ra ra-cycle' />}
                        onClick={() => resetGameState()}
                        label='Reset'
                    />
                }

                {/* { isMobile && //!showRightPanel &&
                    <IconButton
                    icon={<i className='ra ra-scroll-unfurled' />}
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    label='Game Log'
                    />
                    } */}
            </div>

            {/* TOP-LEFT */}
            <div className='dialogue-y'>
                { isMobile && //!showLeftPanel &&
                    <IconButton
                        icon={<i className='ra ra-cog' />}
                        onClick={() => setShowLeftPanel(!showLeftPanel)}
                        label='Settings'
                    />
                }
            </div>

            {/* LEFT COLUMN */}
            <div className='verticalCentre'>
                <div className={`sidebar leftPanel ${showLeftPanel ? 'visible' : ''}`}>
                    { gameState.state === PlayState.SETUP ?
                        <div>
                            {/* TODO: make this its own component? */}
                            <h2>Configuration</h2>
                            <Tabs>
                                <Tab label='Roster'>
                                    <h3>{ gameSettings.useOriginalNames ? 'Townsfolk' : 'Villagers' }</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.VILLAGER, villagerPool, setVillagerPool, true)}
                                    </div>

                                    <h3>Outsiders</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.OUTSIDER, outsiderPool, setOutsiderPool, true)}
                                    </div>

                                    <h3>{ gameSettings.useOriginalNames ? 'Demons' : 'Werewolves' }</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.WEREWOLF, werewolfPool, setWerewolfPool, true)}
                                    </div>

                                    <h3>Minions</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.MINION, minionPool, setMinionPool, true)}
                                    </div>
                                </Tab>
                                <Tab label='Settings'>
                                    <ul>
                                        <li>
                                            <input type='checkbox'
                                                checked={gameSettings.useOriginalNames}
                                                onChange={() => setGameSettings((prev) => ({...prev, useOriginalNames: !prev.useOriginalNames}))}
                                            />
                                            Use original
                                            <Tooltip>
                                                <TooltipTrigger><i className='ra ra-help help' /></TooltipTrigger>
                                                <TooltipContent>Blood on the Clocktower</TooltipContent>
                                            </Tooltip>
                                            names
                                        </li>
                                    </ul>
                                </Tab>
                            </Tabs>
                        </div>
                        :
                        <div>
                            <h2><u>Roster</u></h2>

                            <h3>{ gameSettings.useOriginalNames ? 'Townsfolk' : 'Villagers' }</h3>
                            <div className='column'>
                                {roleSettingsPanel(PlayerType.VILLAGER, villagerPool, setVillagerPool)}
                            </div>

                            <h3>Outsiders</h3>
                            <div className='column'>
                                {roleSettingsPanel(PlayerType.OUTSIDER, outsiderPool, setOutsiderPool)}
                            </div>

                            <h3>{ gameSettings.useOriginalNames ? 'Demons' : 'Werewolves' }</h3>
                            <div className='column'>
                                {roleSettingsPanel(PlayerType.WEREWOLF, werewolfPool, setWerewolfPool)}
                            </div>

                            <h3>Minions</h3>
                            <div className='column'>
                                {roleSettingsPanel(PlayerType.MINION, minionPool, setMinionPool)}
                            </div>
                        </div>
                    }
                </div>
            </div>

            {/* CENTRAL COLUMN */}
            <div className={`centreColumn ${(showLeftPanel || showRightPanel) ? 'invisible' : ''}`}>
                {/* TOP BOX */}
                <div className='control-box column'
                    style={{
                        minWidth: '600px',
                        flex: '0 0 auto',
                    }}
                >
                    <h2>
                        <i className={timeSymbol} />
                        <span
                            style={{
                                margin: '10px',
                            }}
                        >
                            { gameState.state === PlayState.SETUP ? 'Setup' : `Day ${gameState.day}` }
                        </span>
                        <i className={timeSymbol} />
                    </h2>
                    <p>{getTimeBlurb()}</p>

                    <span>
                        <p>
                        { currentPlayer !== null &&
                            <span>{getNightInstruction()}</span>
                        }
                        </p>
                    </span>
                </div>

                {/* CENTRE CIRCLE */}
                <div
                    style={{
                        flex: '1 1 auto',
                        // height: '400px',
                        // width: '400px',
                        // minHeight: '400px',
                        // minWidth: '400px',
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <Consortium
                        gameState={gameState} setGameState={setGameState}
                        currentPlayer={currentPlayer} selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers}
                        settings={gameSettings}
                        handleAction={handleActionCall} togglePlayerAlive={togglePlayerAliveCall}
                        addPlayer={addPlayer} removePlayer={removePlayer}
                        setCurrentPlayer={setCurrentPlayer} handleSpecialAction={handleSpecialAction}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                        showPrompt={showPrompt}
                    />
                </div>

                {/* BOTTOM BOX */}
                <div className='control-box'
                    style={{
                        flex: '0 0 auto',
                    }}
                >
                    <IconButton
                        icon={<i className='ra ra-ocarina' />}
                        label={[
                            <TooltipHoverContent key='hover'>Soundboard</TooltipHoverContent>,
                            <TooltipClickContent key='click'><Soundboard /></TooltipClickContent>
                        ]}
                    />

                    <hr style={{
                        width: '1px',
                        height: '32px',
                        backgroundColor: '#505050',
                        margin: '0 10px',
                    }}/>

                    <GameControls
                        gameState={gameState} setGameState={setGameState} resetGameState={resetGameState}
                        gameSettings={gameSettings}
                        advanceTime={() => advanceTime(gameState, setGameState, currentPlayer, setCurrentPlayer, showPrompt)} setCurrentPlayer={setCurrentPlayer}
                        shuffleCodeNames={shuffleCodeNames}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className='verticalCentre'>
                <div className={`sidebar rightPanel ${showRightPanel ? 'visible' : ''}`}>
                    <div>
                        <h2>Players</h2>
                        <Tabs>
                            {gameState.players.map((player) => (
                                <Tab
                                    label={
                                        <Tooltip placement='left'>
                                            <TooltipTrigger>
                                                <img
                                                    className={styles.profilePicture}
                                                    src={`/red-minaret/characters/${player.name}.png`}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                    }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div>
                                                    <strong>{player.name || player.realName}</strong> ({player.realName})
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    }
                                >
                                    <div><strong>{player.name || player.realName}</strong> ({player.realName})</div>

                                    { player.role?.name === 'Werewolf' &&
                                        <div>
                                            <h2>
                                                Bluffs
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <i className='ra ra-help help' />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        The Werewolf is given a list of possible roles to claim.
                                                    </TooltipContent>
                                                </Tooltip>
                                            </h2>
                                            <GridList columns={3}>
                                            {
                                                /* TODO: currently, this re-selects on every update, but should persist */
                                                gameState.bluffs?.map(
                                                    role => (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <img
                                                                    src={`/red-minaret/icons/${role.icon}.png`}
                                                                    alt={role.name}
                                                                    style={{
                                                                        cursor: 'help',
                                                                    }}
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div
                                                                    style={{
                                                                        maxWidth: '400px',
                                                                    }}
                                                                >
                                                                    <div><strong>{role.name}</strong></div>
                                                                    <div>{role.description}</div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )
                                                )
                                            }
                                            </GridList>
                                        </div>
                                    }

                                    <div>
                                        { player.knowledge?.length > 0 &&
                                            <div>
                                                <h2>Knowledge</h2>
                                                <Log events={player.knowledge} />
                                            </div>
                                        }
                                    </div>

                                </Tab>
                            ))}
                        </Tabs>
                    </div>
                    <hr />
                    <div>
                        <h2>
                            Game Log
                            <Tooltip>
                                <TooltipTrigger>
                                    <i className='ra ra-help help' />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span>
                                        <span className='private'>Private messages</span> and <i className='private ra ra-help' style={{ margin: 2 }} /> are for your eyes only!
                                    </span>
                                </TooltipContent>
                            </Tooltip>
                        </h2>
                        <Log events={gameState.log} />
                    </div>
                </div>
            </div>

        </div>
    )
}

export default App
