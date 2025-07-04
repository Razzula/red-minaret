import React, { useEffect, useRef, useState } from 'react';

import { GameState, LogEvent, Player, Settings } from '../../App';
import { Dialogue, DialogueContent, DialogueTrigger } from '../common/Dialogue/Dialogue';
import { Tooltip, TooltipContent, TooltipHoverContent, TooltipTrigger } from '../common/Tooltip/Tooltip';
import { Voting } from '../Voting';
import PlayerToken from './PlayerToken';

import styles from './Consortium.module.scss';
import { PlayerType, PlayState, Team } from '../../enums';
import Log from '../Log';
import InvestigationInterface from '../InvestigationInterface';
import { advanceTime } from '../../game/core';
import IconButton from '../common/IconButton/IconButton';
import { canPlayerActTonight, isPlayerLunatic, isPlayerMarionette } from '../../game/utils';
import CentreInfo from './CentreInfo';
import { PromptOptions } from '../common/Prompt/Prompt';
import classNames from 'classnames';
import CommunicateInterface from '../CommunicateInterface';

type ConsortiumProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    currentPlayerIndex: number | null;
    selectedPlayers: number[];
    settings: Settings;
    handleAction: (index: number) => void;
    togglePlayerAlive: (name: string) => void;
    addPlayer: () => void;
    removePlayer: (name: string) => void;
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>;
    setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>;
    handleSpecialAction: (specialState: string) => void;

    villagerPool: number[];
    outsiderPool: number[];
    werewolfPool: number[];
    minionPool: number[];

    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>;
};

const Consortium: React.FC<ConsortiumProps> = ({
    gameState, setGameState, currentPlayerIndex, selectedPlayers,
    settings,
    handleAction, togglePlayerAlive, addPlayer, removePlayer, setCurrentPlayer, setSelectedPlayers, handleSpecialAction,
    villagerPool, outsiderPool, werewolfPool, minionPool,
    showPrompt,
}) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const [centreX, setcentreX] = useState(0);
    const [centreY, setcentreY] = useState(0);
    const [radius, setRadius] = useState(0);

    const [votingAllowed, setVotingAllowed] = useState(false);

    const isMobile = (typeof window !== 'undefined') && (window.innerWidth <= 767);
    const centrepieceRadius = isMobile ? 25 : 50;

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const container = containerRef.current;
                const { width, height } = container.getBoundingClientRect();
                setcentreX(width / 2);
                setcentreY(height / 2);
                setRadius(Math.min(width, height) / 2);
            }
        };

        updateDimensions(); // initial call, on mount

        // listen for resize events
        window.addEventListener('resize', updateDimensions);
        return () => {
            window.removeEventListener('resize', updateDimensions);
        };
    }, []);

    useEffect(() => {
        if (gameState.time === 2) {
            setVotingAllowed(true);
        }
    }, [gameState.time]);

    function handleClick(event: React.MouseEvent<HTMLElement>, index: number) {
        if (currentPlayerIndex === null) {
            return;
        }

        event.stopPropagation();
        handleAction(index);
        // if (currentPlayer !== index) {
        // }
    }

    function cancelSpecialState() {
        setGameState((prev) => ({
            ...prev,
            state: prev.special?.previous || PlayState.SETUP,
            special: undefined,
        }));
        setCurrentPlayer(null);
        setSelectedPlayers([]);
    }

    function handleInvestigate(selectedRole: string, selectedPlayers: string[], count: number) {
        // UI
        const selectedUIPlayers: number[] = [];
        selectedPlayers.forEach((player) => {
            selectedUIPlayers.push(gameState.players.findIndex((p) => p.name === player));
        });
        setSelectedPlayers(selectedUIPlayers);

        // game log
        const event: LogEvent = {
            type: 'private',
            message: `${(currentPlayerIndex !== null) ? gameState.players[currentPlayerIndex].name : '...'} learnt that ${count} of ${selectedPlayers.join(' and ')} is the ${selectedRole}.`,
        };
        const tempGameState = {
            ...gameState,
            currentEvent: event,
            popupEvent: undefined,
        };
        advanceTime(tempGameState, setGameState, currentPlayerIndex, setCurrentPlayer, showPrompt);
    }

    const players = gameState.players;

    return (
        <div className={styles.groupContainer}
            style={{
                width: '100%',
                height: '100%',
            }}
            ref={containerRef}
        >

            {/* ALERT POPUP */}
            {gameState.popupEvent && (
                <Dialogue open={gameState.popupEvent !== undefined}>
                    <DialogueContent overlayopacity={gameState.popupEvent.override?.blackout ? 1 : 0.5}>
                        {
                            gameState.popupEvent.override ?
                                // HANDLE OVERRIDES
                                (() => {
                                    switch (gameState.popupEvent?.override?.type) {
                                        case 'investigate':
                                            return <InvestigationInterface
                                                title={gameState.popupEvent.override.params ? gameState.popupEvent.override.params[0] : ''}
                                                players={players}
                                                gameState={gameState}
                                                setGameState={setGameState}
                                                onInvestigate={handleInvestigate}
                                            />;
                                        case 'communicate':
                                            return (
                                                <CommunicateInterface
                                                    onClose={() => setGameState((prev) => ({ ...prev, popupEvent: undefined }))}
                                                    gameState={gameState}
                                                    initOptions={gameState.popupEvent.override.params}
                                                />
                                            );
                                        case 'welcome':
                                            return (
                                                <div className='dialogue-content'
                                                    style={{
                                                        padding: '20px',
                                                    }}
                                                >
                                                    <div className='welcome'>
                                                        <img src='/red-minaret/logo.svg' alt='Blood on the Taj Mahal' width='128' />
                                                        <p>
                                                            A group of friends have gone on a trip to the breathtaking Taj Mahal, only to be thrown into a chilling mystery.
                                                            A scream pierces the air, and one of the group is found lifeless, their blood staining the pristine marble.
                                                            Among you lies a dark secret—deceit, danger, and deduction await.
                                                        </p>
                                                        <p>That poor soul was you. You are now a ghost, guiding the living to uncover the truth.</p>
                                                        <p>
                                                            As the Storyteller, guide the group through this game of deception and deduction to uncover the truth and restore justice.
                                                            Use this virtual grimoire to orchestrate the experience.
                                                        </p>
                                                        <p><strong>Let the mystery begin!</strong></p>

                                                        <div>
                                                            <IconButton
                                                                icon={<i className='ra ra-book' />}
                                                                onClick={() => setGameState((prev) => ({ ...prev, popupEvent: { override: { type: 'help' } } }))}
                                                                label='How to Play'
                                                            />
                                                            <IconButton
                                                                icon={<i className='ra ra-cancel' />}
                                                                onClick={() => setGameState((prev) => ({ ...prev, popupEvent: undefined }))}
                                                                label='Begin!'
                                                            />
                                                        </div>

                                                    </div>
                                                </div>
                                            );
                                        case 'help':
                                            return (
                                                <div className='dialogue-content' style={{ padding: '20px' }}>
                                                    <div className='centreContents'>
                                                        <div className='howto'>
                                                            <h1>Help</h1>
                                                            <p>
                                                                This application is a virtual 'grimoire' for the <strong>Blood on the Taj Mahal</strong> social deduction game.
                                                                It is a tool for you, the <span className='storyteller'>Storyteller</span>, to guide a group of friends through the game.
                                                            </p>

                                                            <h2>Configuration</h2>
                                                            <p>
                                                                The game is designed for 5+ players (excluding the <span className='storyteller'>Storyteller</span>).
                                                                You can add players by clicking the <i className='storyteller ra ra-health' /> button on the setup screen.
                                                                To remove a player, select their token, then click the <i className='storyteller ra ra-cancel' /> button.
                                                            </p>
                                                            <p>
                                                                Players are split into two teams:
                                                                <ul>
                                                                    <li className='good'>Good (Villagers and Outsiders)</li>
                                                                    <li className='evil'>Evil (Werewolves and Minions)</li>
                                                                </ul>
                                                                The <span className='evil'>Evil</span> team aims to eliminate enough <span className='good'>Good</span> players to take control of the group.
                                                            </p>
                                                            <p>
                                                                The <span className='good'>Good</span> team’s goal is to eliminate the <strong className='evil'>Werewolves</strong> to restore peace.
                                                            </p>
                                                            <p>
                                                                You can assign roles by clicking the <i className='storyteller ra ra-spades-card' /> button.
                                                            </p>

                                                            <h3>Codenames</h3>
                                                            <p>
                                                                Each player is assigned a codename, a pseudonym for their character.
                                                            </p>
                                                            <p>
                                                                During a player's turn at night, ensure it remains concealed from the group who is awake and when.
                                                            </p>
                                                            <p>
                                                                You can:
                                                                <ul>
                                                                    <li>Use these secret names to identify players</li>
                                                                    <li>Awaken players using secret numbers (e.g., "x o'clock")</li>
                                                                </ul>
                                                            </p>

                                                            <h2>Gameplay</h2>

                                                            <h3>Phases</h3>
                                                            <p>
                                                                The game is divided into three phases: <strong>Night</strong>, <strong>Day</strong>, and <strong>Evening</strong>.
                                                            </p>

                                                            <h4>Night</h4>
                                                            <p>
                                                                During the
                                                                <Tooltip>
                                                                    <TooltipTrigger> Night*</TooltipTrigger>
                                                                    <TooltipContent>Except the first night!</TooltipContent>
                                                                </Tooltip>,
                                                                the <strong className='evil'>Werewolves</strong> select a player to kill. Unless interrupted, that player dies.
                                                            </p>
                                                            <p>
                                                                Other roles may perform actions at night, aiding their respective teams. Follow the action order provided in the app to ensure fairness.
                                                            </p>
                                                            <p>
                                                                Once a player dies, they lose their ability but can continue participating in discussions and voting.
                                                            </p>

                                                            <h4>Day</h4>
                                                            <p>
                                                                During the day, players discuss and attempt to identify the <strong className='evil'>Evil</strong> team.
                                                            </p>
                                                            <p>
                                                                Players can freely discuss for as long as you allow, even splitting into separate rooms for private conversations. Encourage dialogue and cooperation.
                                                            </p>

                                                            <h4>Evening</h4>
                                                            <p>
                                                                At the end of the day, the group votes to lynch a player. The player with the most votes is eliminated.
                                                            </p>
                                                            <p>
                                                                If votes are tied or no majority is reached, no player is lynched.
                                                            </p>
                                                            <p>
                                                                Each player can only nominate and be nominated each once per day.
                                                            </p>
                                                            <p>
                                                                Once a player becomes a ghost, they can vote only <strong>once</strong> for the remainder of the game.
                                                            </p>
                                                        </div>

                                                        <IconButton
                                                            icon={<i className='ra ra-cancel' />}
                                                            onClick={() => setGameState((prev) => ({ ...prev, popupEvent: undefined }))}
                                                            label='Close'
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        default:
                                            return null;
                                    }
                                })()
                                :
                                // HANDLE NORMAL POPUPS
                                <div className='dialogue-content'
                                    style={{
                                        padding: '20px',
                                    }}
                                >
                                    <div className='column'>
                                        {gameState.popupEvent.heading &&
                                            <div className='dialogueHeading'>{gameState.popupEvent.heading}</div>
                                        }
                                        {gameState.popupEvent.message &&
                                            <div>{gameState.popupEvent.message}</div>
                                        }
                                        {gameState.popupEvent.events && gameState.popupEvent.events?.length > 0 &&
                                            <Log events={gameState.popupEvent.events} />
                                        }
                                        <Tooltip placement='bottom'>
                                            <TooltipTrigger>
                                                <button onClick={() => setGameState((prev) => ({ ...prev, popupEvent: undefined }))}>
                                                    <i className='ra ra-cancel' />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>Close</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                        }
                    </DialogueContent>
                </Dialogue>
            )
            }

            <div className='centrepiece'>
                <Centrepiece
                    gameState={gameState} players={players} currentPlayerIndex={currentPlayerIndex} selectedPlayers={selectedPlayers}
                    showPrompt={showPrompt} addPlayer={addPlayer} handleSpecialAction={handleSpecialAction}
                    cancelSpecialState={cancelSpecialState} togglePlayerAlive={togglePlayerAlive}
                    votingAllowed={votingAllowed} setVotingAllowed={setVotingAllowed} setGameState={setGameState}
                />
            </div>

            {
                players.map((player, index) => (
                    <PlayerToken key={index}
                        player={player}
                        gameState={gameState}
                        setGameState={setGameState}
                        index={index}
                        centreX={centreX}
                        centreY={centreY}
                        centrepieceRadius={centrepieceRadius}
                        consortiumRadius={radius}
                        currentPlayer={currentPlayerIndex}
                        selectedPlayers={selectedPlayers}
                        settings={settings}
                        togglePlayerAlive={togglePlayerAlive}
                        handleClick={handleClick}
                        removePlayer={removePlayer}
                        setCurrentPlayer={setCurrentPlayer}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                        showPrompt={showPrompt}
                    />
                ))
            }

        </div>
    );
};

type CentrepieceProps = {
    gameState: GameState;
    players: Player[];
    currentPlayerIndex: number | null;
    selectedPlayers: number[];
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>;
    addPlayer: () => void;
    handleSpecialAction: (specialState: string) => void;
    cancelSpecialState: () => void;
    togglePlayerAlive: (name: string) => void;
    votingAllowed: boolean;
    setVotingAllowed: React.Dispatch<React.SetStateAction<boolean>>;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
};

const Centrepiece: React.FC<CentrepieceProps> = ({
    gameState, players, currentPlayerIndex, selectedPlayers, showPrompt,
    addPlayer, handleSpecialAction, cancelSpecialState, togglePlayerAlive, votingAllowed, setVotingAllowed,
    setGameState,
}) => {

    const [centrepiece, setCentrepiece] = useState<JSX.Element | null>(null);
    const [commPopups, setCommPopups] = useState<JSX.Element[]>([]);
    const [selectionCommPopup, setSelectionCommPopup] = useState<JSX.Element | null>(null);

    useEffect(() => {

        if (gameState.state === PlayState.SETUP) {
            // Add Player button
            setCentrepiece(
                <Tooltip>
                    <TooltipTrigger>
                        <button
                            className={classNames(
                                styles.circleButton,
                                styles.centreButton,
                            )}
                            onClick={addPlayer}
                        >
                            <i className='ra ra-health' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Add Player</TooltipContent>
                </Tooltip>
            );
            return;
        }

        if (gameState.state === PlayState.SPECIAL) {
            // Cancel
            if (gameState.special?.state === 'Hunter') {
                setCentrepiece(
                    <div>
                        <button
                            className={classNames(styles.circleButton, styles.centreButton)}
                            onClick={() => handleSpecialAction('Hunter')}
                        >
                            Shoot
                        </button>
                        <button
                            className={classNames(styles.circleButton, styles.centreButton)}
                            onClick={cancelSpecialState}
                        >
                            Cancel
                        </button>
                    </div>
                );
            }
            else if (gameState.special?.state === 'Farmer') {
                const selectedPlayer = (selectedPlayers.length > 0) ? players[selectedPlayers[0]] : null;
                const selectedPlayerIsValid = (
                    selectedPlayer
                    && selectedPlayer.alive
                    && selectedPlayer.role?.team === Team.GOOD
                );
                setCentrepiece(
                    <div>
                        <button
                            className={classNames(styles.circleButton, styles.centreButton)}
                            disabled={!selectedPlayer || !selectedPlayerIsValid}
                            onClick={() => handleSpecialAction('Farmer')}
                        >
                            Donn the Plough!
                        </button>
                    </div>
                );
            }

            return;
        }

        if (gameState.time === 2) {
            // Voting Dialogue
            setCentrepiece(
                <Dialogue>
                    <DialogueTrigger>
                        <Tooltip>
                            <TooltipTrigger>
                                <button
                                    className={classNames(
                                        styles.circleButton,
                                        styles.centreButton,
                                    )}
                                    disabled={!votingAllowed}
                                >
                                    <i className='ra ra-noose' />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Nominate for Lynching</TooltipContent>
                        </Tooltip>
                    </DialogueTrigger>
                    <DialogueContent>
                        <Voting
                            gameState={gameState} setGameState={setGameState} togglePlayerAlive={togglePlayerAlive}
                            setVotingAllowed={setVotingAllowed}
                        />
                    </DialogueContent>
                </Dialogue>
            );
            return;
        }

        if (gameState.time === 0 && currentPlayerIndex !== null) {
            const playerCanAct = canPlayerActTonight(players[currentPlayerIndex], gameState);
            if (playerCanAct) {
                setCentrepiece(
                    <CentreInfo
                        gameState={gameState} currentPlayer={currentPlayerIndex} players={players} selectedPlayers={selectedPlayers}
                        showPrompt={showPrompt} setSelectionPopup={setSelectionPopup}
                    />);
                return;
            }
        }

        setCentrepiece(null);
        setSelectionPopup(null);

    }, [gameState, players, currentPlayerIndex, selectedPlayers, votingAllowed]);

    // COMMUNICATION POPUPS
    useEffect(() => {
        const commPopups: JSX.Element[] = [];

        if (currentPlayerIndex === null || gameState.state !== PlayState.PLAYING || gameState.popupEvent !== undefined) {
            // no player selected or game is not in progress, so no communication popups
            setCommPopups(commPopups);
            return;
        }

        const currentPlayer = players[currentPlayerIndex];

        // FIRST NIGHT
        if (gameState.time === 0
            && (gameState.day === 1 || currentPlayer.modified)
        ) {
            // Player Role
            commPopups.push(
                commPopup('Show Player Role', [currentPlayer.role?.name ?? '???'])
            );

            // WEREWOLF
            if (currentPlayer.role?.type === PlayerType.WEREWOLF
                || isPlayerLunatic(currentPlayer) // lunatic is treated as a werewolf for communication purposes
            ) {
                // Bluffs
                if (gameState.bluffs) {
                    commPopups.push(
                        commPopup('Show Bluffs', gameState.bluffs.map((b) => b.name))
                    );
                }

                // Minion
                const minion = players.find((p) => p.role?.type === PlayerType.MINION);
                const poppyGrower = players.find((p) => p.role?.name === 'Poppy Grower');
                if (minion && !poppyGrower?.alive) {
                    commPopups.push(
                        commPopup('Show Minion', [minion.role?.name ?? 'Error'])
                    );
                }
            }
            // MINION
            else if (currentPlayer.role?.type === PlayerType.MINION
                && !isPlayerMarionette(currentPlayer) // don't show werewolves if the minion is a marionette
            ) {
                // Werewolf
                const werewolves = players.filter((p) => p.role?.type === PlayerType.WEREWOLF);
                const poppyGrower = players.find((p) => p.role?.name === 'Poppy Grower');
                if (werewolves.length > 0 && !poppyGrower?.alive) {
                    commPopups.push(
                        commPopup('Show Werewolves', werewolves.map((w) => w.name))
                    );
                }
            }

            setCommPopups(commPopups);
            return;
        }
    }, [gameState, currentPlayerIndex]);

    function setSelectionPopup(title: string | null, params?: string[]) {
        if (!title || !params || params.length === 0) {
            setSelectionCommPopup(null);
            return;
        }
        setSelectionCommPopup(commPopup(title, params));
    }

    function commPopup(title: string, params: string[]) {
        return (
            <div style={{
                width: '52px',
                height: '52px',
            }}>
                <Tooltip enableHover={true} enableClick={false}>
                    <TooltipTrigger>
                        <button
                            className={classNames(styles.circleButton, styles.statusCircle)}
                            disabled={false}
                            onClick={() => setGameState((prev) => (
                                {
                                    ...prev,
                                    popupEvent: {
                                        override: {
                                            type: 'communicate',
                                            blackout: true,
                                            params,
                                        }
                                    }
                                }
                            ))
                            }
                        >
                            <i className='ra ra-speech-bubble' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <TooltipHoverContent>
                            <div style={{ maxWidth: '300px' }}>
                                {title}
                            </div>
                        </TooltipHoverContent>
                    </TooltipContent>
                </Tooltip>
            </div>
        );
    }

    return (
        <div>
            {centrepiece}
            {commPopups}
            {selectionCommPopup}
        </div>
    );
};

export default Consortium;
