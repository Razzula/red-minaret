import React, { useEffect, useRef, useState } from 'react';

import { GameState, LogEvent, Player, Settings } from '../../App';
import { Dialog, DialogContent, DialogTrigger } from '../common/Dialog/Dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../common/Tooltip/Tooltip';
import { Voting } from '../Voting';
import PlayerToken from './PlayerToken';

import styles from './Consortium.module.scss';
import { PlayState } from '../../enums';
import Log from '../Log';
import InvestigationInterface from '../InvestigationInterface';
import { advanceTime } from '../../game/core';
import IconButton from '../common/IconButton/IconButton';
import { canPlayerActTonight } from '../../game/utils';
import CentreInfo from './CentreInfo';
import { PromptOptions } from '../common/Prompt/Prompt';

type ConsortiumProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    currentPlayer: number | null;
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
    gameState, setGameState, currentPlayer, selectedPlayers,
    settings,
    handleAction, togglePlayerAlive, addPlayer, removePlayer, setCurrentPlayer, setSelectedPlayers, handleSpecialAction,
    villagerPool, outsiderPool, werewolfPool, minionPool,
    showPrompt,
}) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const [centerX, setCenterX] = useState(0);
    const [centerY, setCenterY] = useState(0);
    const [radius, setRadius] = useState(0);

    const [votingAllowed, setVotingAllowed] = useState(false);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const container = containerRef.current;
                const { width, height } = container.getBoundingClientRect();
                setCenterX(width / 2);
                setCenterY(height / 2);
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
        if (currentPlayer === null) {
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
            message: `${currentPlayer ? gameState.players[currentPlayer].name : '...'} learnt that ${count} of ${selectedPlayers.join(' and ')} is the ${selectedRole}.`,
        };
        const tempGameState = {
            ...gameState,
            currentEvent: event,
            popupEvent: undefined,
        };
        advanceTime(tempGameState, setGameState, currentPlayer, setCurrentPlayer, showPrompt);
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
            { gameState.popupEvent && (
                <Dialog open={gameState.popupEvent !== undefined}>
                    <DialogContent>
                        {
                            gameState.popupEvent.override ?
                                // HANDLE OVERRIDES
                                (() => {
                                    switch (gameState.popupEvent?.override?.type) {
                                        case 'investigate':
                                            return <InvestigationInterface
                                                title={gameState.popupEvent.override.param}
                                                players={players}
                                                setGameState={setGameState}
                                                onInvestigate={handleInvestigate}
                                            />;
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
                                        { gameState.popupEvent.heading &&
                                            <div className='dialogueHeading'>{gameState.popupEvent.heading}</div>
                                        }
                                        { gameState.popupEvent.message &&
                                            <div>{gameState.popupEvent.message}</div>
                                        }
                                        { gameState.popupEvent.events && gameState.popupEvent.events?.length > 0 &&
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
                    </DialogContent>
                </Dialog>
                )
            }

            <div className='centrepiece'>
                <Centrepiece
                    gameState={gameState} players={players} currentPlayer={currentPlayer} selectedPlayers={selectedPlayers}
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
                        centreX={centerX}
                        centreY={centerY}
                        radius={radius}
                        currentPlayer={currentPlayer}
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
    currentPlayer: number | null;
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
    gameState, players, currentPlayer, selectedPlayers, showPrompt,
    addPlayer, handleSpecialAction, cancelSpecialState, togglePlayerAlive, votingAllowed, setVotingAllowed,
    setGameState,
}) => {

    const [centrepiece, setCentrepiece] = useState<JSX.Element | null>(null);

    useEffect(() => {

        if (gameState.state === PlayState.SETUP) {
            // Add Player button
            setCentrepiece(
                <Tooltip>
                    <TooltipTrigger>
                        <button
                            className={styles.circleButton}
                            style={{
                                width: '100px',
                                height: '100px',
                            }}
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
            setCentrepiece(
                <div>
                    <button
                        className={styles.circleButton}
                        style={{
                            width: '100px',
                            height: '100px',
                        }}
                        onClick={() => handleSpecialAction('Hunter')}
                    >
                        Shoot
                    </button>
                    <button
                        className={styles.circleButton}
                        style={{
                            width: '100px',
                            height: '100px',
                        }}
                        onClick={cancelSpecialState}
                    >
                        Cancel
                    </button>
                </div>
            );
            return;
        }

        if (gameState.time === 2) {
            // Voting Dialog
            setCentrepiece(
                <Dialog>
                    <DialogTrigger>
                        <Tooltip>
                            <TooltipTrigger>
                                <button
                                    className={styles.circleButton}
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                    }}
                                    disabled={!votingAllowed}
                                >
                                    <i className='ra ra-noose' />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Nominate for Lynching</TooltipContent>
                        </Tooltip>
                    </DialogTrigger>
                    <DialogContent>
                        <Voting
                            gameState={gameState} setGameState={setGameState} togglePlayerAlive={togglePlayerAlive}
                            setVotingAllowed={setVotingAllowed}
                        />
                    </DialogContent>
                </Dialog>
            );
            return;
        }

        if (gameState.time === 0 && currentPlayer !== null) {
            const playerCanAct = canPlayerActTonight(players[currentPlayer], gameState);
            if (playerCanAct) {
                setCentrepiece(<CentreInfo gameState={gameState} currentPlayer={currentPlayer} players={players} selectedPlayers={selectedPlayers} showPrompt={showPrompt} />);
                return;
            }
        }

        setCentrepiece(null);

    }, [gameState, players, currentPlayer, selectedPlayers, votingAllowed]);

    return centrepiece;
};

export default Consortium;
