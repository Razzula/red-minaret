import { useEffect, useState } from 'react'

import 'rpg-awesome/css/rpg-awesome.min.css';

import Consortium from './components/consortium/Consortium'
import GameControls from './components/GameControls'
import { advanceTime, handleAction, hunterAbility, togglePlayerAlive } from './game/core'
import { findPlayersNeighbours } from './game/utils'

import roles, { Role } from './data/roles'
import { Status } from './data/statuses'

import './App.css'
import './globals.css'
import { PlayerType, PlayState, PlayStateType, Team } from './enums'
import pseudonyms from './data/pseudonyms'
import GridList from './components/common/GridList/GridList'
import CheckButton from './components/common/CheckButton/CheckButton'
import { Tab, Tabs, Tooltip, TooltipContent, TooltipTrigger } from './components/common'

import styles from './components/consortium/Consortium.module.scss';

export type GameState = {
    day: number;
    time: number;
    state: PlayStateType;

    special?: {
        state: string;
        previous: PlayStateType;
    };

    players: Player[];

    nominations: string[];
    nominators: string[];
    choppingBlock?: {
        playerName: string;
        votes: number;
    };
}

export type Player = {
    name: string; // this is the player's codename (mandatory)
    realName?: string; // this is the player's real name (optional)
    alive: boolean;
    role?: Role;
    statuses: Status[];
    ghostVotes: number;
    abilityUses: number;
}

function defaultGameState(playerCount: number = 5): GameState  {
    return {
        day: 0,
        time: 0,
        state: PlayState.SETUP,
        players: pseudonyms
            .sort(() => Math.random() - 0.5) // shuffle
            .slice(0, playerCount).map((name, index) => ({
                name,
                realName: `Player ${index + 1}`,
                alive: true,
                statuses: [],
                ghostVotes: 1,
                abilityUses: 0,
            })),
        nominations: [],
        nominators: [],
    };
}

function App() {

    const [gameState, setGameState] = useState<GameState>(loadGameState() || defaultGameState())

    const [gameSettings, /*setGameSettings*/] = useState({})

    const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

    const [villagerPool, setVillagerPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.VILLAGER ? index : null).filter(i => i !== null));
    const [outsiderPool, setOutsiderPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.OUTSIDER ? index : null).filter(i => i !== null));
    const [werewolfPool, setWerewolfPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.WEREWOLF ? index : null).filter(i => i !== null));
    const [minionPool, setMinionPool] = useState<number[]>(roles.map((role, index) => role.type === PlayerType.MINION ? index : null).filter(i => i !== null));

    const timeSymbol = getTimeSymbol();

    useEffect(() => {
        if (gameState) {
            localStorage.setItem('gameState', JSON.stringify(gameState));
        }
    }, [gameState]);

    useEffect(() => {
        if (currentPlayer !== null) {
            // EMPATH
            if (gameState.players[currentPlayer].role?.name === 'Empath') {
                const neighbours = findPlayersNeighbours(gameState, currentPlayer);
                setSelectedPlayers(neighbours);
            }
            else {
                setSelectedPlayers([]);
            }
        }
        else {
            setSelectedPlayers([]);
        }
    }, [currentPlayer, gameState]);

    useEffect(() => {1
        if (gameState.players.length > 0 && gameState.state === PlayState.PLAYING) {
            if (!gameState.players.find(player => player.role?.type === PlayerType.WEREWOLF && player.alive)) {
                gameState.state = PlayState.VICTORY;
            }
            else if (
                gameState.players.filter(player => player.role?.team === Team.EVIL && player.alive).length
                    >= gameState.players.filter(player => player.role?.team === Team.GOOD && player.alive).length
            ) {
                gameState.state = PlayState.DEFEAT;
            }
        }
    }, [gameState]);

    useEffect(() => {
        if (gameState.state === PlayState.DEFEAT) {
            alert('Werewolves win!');
        }
        else if (gameState.state === PlayState.VICTORY) {
            alert('Villagers win!');
        }
    }, [gameState.state]);

    function loadGameState() {
        const cachedGameState = localStorage.getItem('gameState');
        if (cachedGameState) {
            return JSON.parse(cachedGameState);
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
                ...defaultGameState(),
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
            setGameState(defaultGameState(gameState.players.length));
        }
    }

    function getTimeSymbol() {
        switch (gameState.time) {
            case 0:
                if (currentPlayer === null) {
                    return '⚙';
                }
                return '🌙'
            case 1:
                return '☀️'
            case 2:
                return '🌆'
            default:
                return ''
        }
    }

    function getTimeBlurb() {
        switch (gameState.time) {
            case 0:
                if (currentPlayer === null) {
                    return 'Configure the game.';
                }
                return `It is ${currentPlayer + 1} a.m. (${gameState.players[currentPlayer].name}'s turn)`;
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
                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger>
                                    <CheckButton
                                        image={`/red-minaret/icons/${role.icon}.png`}
                                        altText={role.name}
                                        isChecked={rolePool.includes(index)}
                                        onChange={active ? () => updateRolePool(index) : () => {}}
                                        disabled={!poolEnabled}
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
                                        { !poolEnabled &&
                                            <div
                                                style={{
                                                    color: '#ff5338',
                                                }}
                                            ><i>Not enough players to use this role!</i></div>
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

        let instruction;
        const player = gameState.players[currentPlayer];

        if (!player.alive) {
            return 'This player is dead.';
        }

        if (player.role?.night) {
            instruction = gameState.players[currentPlayer].role?.night;
        }
        else {
            return 'There is nothing for this player to do, right now...';
        }

        // EMPATH
        if (gameState.players[currentPlayer].role?.name === 'Empath') {
            let evilCount = 0;
            // check neighbours (skip over dead players)
            const neighbours = findPlayersNeighbours(gameState, currentPlayer);
            for (const neighbour of neighbours) {
                if (gameState.players[neighbour].role?.team === Team.EVIL) {
                    evilCount++;
                }
            }
            instruction = `${instruction} (${evilCount}).`;
        }

        // DRUNK
        if (gameState.players[currentPlayer].statuses?.find(status => status.name === 'Drunk')) {
            instruction = `${instruction} Remember, this player is the Drunk!`;
        }
        else if (gameState.players[currentPlayer].statuses?.find(status => status.name === 'Poisoned')) {
            instruction = `${instruction} Remember, this player has been poisoned!`;
        }

        return instruction;

    }

    function handleActionCall(index: number) {
        handleAction(index, currentPlayer, gameState, selectedPlayers, setSelectedPlayers);
    }

    function handleSpecialAction(specialState: string) {
        switch (specialState) {
            case 'Hunter':
                hunterAbility(gameState, selectedPlayers, setGameState, setCurrentPlayer, setSelectedPlayers);
        }
    }

    function togglePlayerAliveCall(name: string) {
        togglePlayerAlive(name, gameState, setGameState);
    }

    function shuffleCodeNames() {
        const tempGameState = {...gameState};
        const shuffledNames = pseudonyms.sort(() => Math.random() - 0.5);
        tempGameState.players.forEach((player, index) => {
            player.name = shuffledNames[index];
        });
        setGameState(tempGameState);
    }

    function addPlayer() {
        const tempGameState = {...gameState};
        const playerName = pseudonyms
            .sort(() => Math.random() - 0.5)
            .find(name => !gameState.players.find(player => player.name === name))
            ?? `Player ${gameState.players.length + 1}`;

        tempGameState.players.push({ name: playerName, alive: true, statuses: [], ghostVotes: 1, abilityUses: 0 });
        setGameState(tempGameState);
    }

    function removePlayer(name: string) {
        const tempGameState = {...gameState};
        tempGameState.players = tempGameState.players.filter(player => player.name !== name);
        setGameState(tempGameState);
    }

    /**
     * TODO:
     * - Taj Mahal background
     *      - bonus points to have sky reflect day/evening/night
     */

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

            <Tooltip>
                    <TooltipTrigger>
                        <button className='dialogue-x' onClick={() => resetGameState()}>
                            <i className='ra ra-cycle' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Reset</TooltipContent>
                </Tooltip>

            {/* LEFT COLUMN */}
            <div className='verticalCentre'>
                <div className='sidebar'>
                    { gameState.state === PlayState.SETUP ?
                        <div>
                            {/* TODO: make this its own component? */}
                            <h2>Configuration</h2>
                            <Tabs>
                                <Tab label='Roster'>
                                    <h3>Villagers</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.VILLAGER, villagerPool, setVillagerPool, true)}
                                    </div>

                                    <h3>Outsiders</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.OUTSIDER, outsiderPool, setOutsiderPool, true)}
                                    </div>

                                    <h3>Werewolves</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.WEREWOLF, werewolfPool, setWerewolfPool, true)}
                                    </div>

                                    <h3>Minions</h3>
                                    <div className='column'>
                                        {roleSettingsPanel(PlayerType.MINION, minionPool, setMinionPool, true)}
                                    </div>
                                </Tab>
                                <Tab label='Settings'>
                                    <span>🦗 chirp chirp</span>
                                </Tab>
                            </Tabs>
                        </div>
                        :
                        <div>
                            <h2><u>Roster</u></h2>

                            <h3>Villagers</h3>
                            <div className='column'>
                                {roleSettingsPanel(PlayerType.VILLAGER, villagerPool, setVillagerPool)}
                            </div>

                            <h3>Outsiders</h3>
                            <div className='column'>
                                {roleSettingsPanel(PlayerType.OUTSIDER, outsiderPool, setOutsiderPool)}
                            </div>

                            <h3>Werewolves</h3>
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
            <div className='centreColumn'>
                {/* TOP BOX */}
                <div className='control-box column'
                    style={{
                        minWidth: '600px',
                        flex: '0 0 auto',
                    }}
                >
                    <h2>{timeSymbol}  { gameState.state === PlayState.SETUP ? 'Setup' : `Day ${gameState.day}` }  {timeSymbol}</h2>
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
                        handleAction={handleActionCall} togglePlayerAlive={togglePlayerAliveCall}
                        addPlayer={addPlayer} removePlayer={removePlayer}
                        setCurrentPlayer={setCurrentPlayer} handleSpecialAction={handleSpecialAction}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                    />
                </div>

                {/* BOTTOM BOX */}
                <div className='control-box'
                    style={{
                        flex: '0 0 auto',
                    }}
                >
                    <GameControls
                        gameState={gameState} setGameState={setGameState} resetGameState={resetGameState}
                        gameSettings={gameSettings}
                        advanceTime={() => advanceTime(gameState, setGameState, currentPlayer, setCurrentPlayer)} setCurrentPlayer={setCurrentPlayer}
                        shuffleCodeNames={shuffleCodeNames}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className='verticalCentre'>
                <div className='sidebar'>
                    <div>
                        <h2>Players</h2>
                        <Tabs>
                            {gameState.players.map((player) => (
                                <Tab
                                    label={
                                        <img
                                            className={styles.profilePicture}
                                            src={`/red-minaret/characters/${player.name}.png`}
                                        />
                                    }
                                >
                                    <div><strong>{player.name || player.realName}</strong> ({player.realName})</div>

                                    <div>
                                        <h2>Knowledge</h2>
                                        <div>this area will show a player's knowledge (what they did at night, etc.)</div>
                                    </div>

                                    { player.role?.name === 'Werewolf' &&
                                        <div>
                                            <h2>Bluffs</h2>
                                            <GridList columns={3}>
                                            {
                                                roles
                                                    .filter(role => !gameState.players.find(p => p.role?.name === role.name))
                                                    .slice(0, 3)
                                                    .map(
                                                        role => (
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <img
                                                                        src={`/red-minaret/icons/${role.icon}.png`}
                                                                        alt={role.name}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div><strong>{role.name}</strong></div>
                                                                    <div>{role.description}</div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    )
                                            }
                                            </GridList>
                                        </div>
                                    }

                                </Tab>
                            ))}
                        </Tabs>
                    </div>
                    <hr />
                    <div>
                        <h2>Game Log</h2>
                        <span>TODO: put something actually useful here...</span>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default App
