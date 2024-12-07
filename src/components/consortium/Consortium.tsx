import React, { useEffect, useRef, useState } from 'react';

import { GameState, LogEvent } from '../../App';
import { Dialog, DialogContent, DialogTrigger } from '../common/Dialog/Dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../common/Tooltip/Tooltip';
import { Voting } from '../Voting';
import PlayerToken from './PlayerToken';

import styles from './Consortium.module.scss';
import { PlayState, Team } from '../../enums';
import Log from '../Log';
import InvestigationInterface from '../InvestigationInterface';
import { advanceTime } from '../../game/core';

type ConsortiumProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    currentPlayer: number | null;
    selectedPlayers: number[];
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
};

const Consortium: React.FC<ConsortiumProps> = ({ gameState, setGameState, currentPlayer, selectedPlayers,
    handleAction, togglePlayerAlive, addPlayer, removePlayer, setCurrentPlayer, setSelectedPlayers, handleSpecialAction,
    villagerPool, outsiderPool, werewolfPool, minionPool
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
        advanceTime(tempGameState, setGameState, currentPlayer, setCurrentPlayer);
    }

    const Centrepiece: React.FC = () => {

        if (gameState.state === PlayState.SETUP) {
            // Add Player button
            return (
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
        }

        if (gameState.state === PlayState.SPECIAL) {
            // Cancel
            return (
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
        }

        if (gameState.time === 2) {
            // Voting Dialog
            return (
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
        }

        if (gameState.time === 0 && currentPlayer !== null) {
            const player = players[currentPlayer];
            // SEER
            if (player.role?.name === 'Seer') {
                const seer = player;
                let seerResult: string;

                if (seer.statuses.find((status) => status.name === 'Drunk')) {
                    seerResult = 'Drunk!';
                }
                else if (seer.statuses.find((status) => status.name === 'Poisoned')) {
                    seerResult = 'Poisoned!';
                }
                else {
                    // if a selected player is evil or the red herring, then the seer sees evil
                    seerResult = selectedPlayers.length > 0 ? (
                        selectedPlayers.find((index) =>
                            players[index].role?.team === Team.EVIL || players[index].statuses.find((status) => status.name === 'Red Herring')
                        ) !== undefined ? Team.EVIL : Team.GOOD
                    ) : 'null';
                }

                const token = (
                    <span
                        className={styles.circleButton}
                        style={{
                            width: '100px',
                            height: '100px',
                        }}
                    >
                        {seerResult}
                    </span>
                );

                if (seerResult !== 'Drunk!' && seerResult !== 'Poisoned!') {
                    return token;
                }

                return (
                    <Tooltip enableHover={true}>
                        <TooltipTrigger>
                            {token}
                        </TooltipTrigger>
                        <TooltipContent>
                            This player is {seerResult} You should give them intentionally unhelpful information.
                        </TooltipContent>
                    </Tooltip>
                );
            }
            // RAVENKEEPER
            else if (player.role?.name === 'Ravenkeeper') {
                // TODO: refactor out above logic into a function
                return (
                    null
                );
            }

            return null;
        }
    };

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

                                                        <Tooltip placement='bottom'>
                                                            <TooltipTrigger>
                                                                <button onClick={() => setGameState((prev) => ({ ...prev, popupEvent: undefined }))}>
                                                                    <i className='ra ra-cancel' />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Begin!</TooltipContent>
                                                        </Tooltip>
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
                <Centrepiece />
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
                        togglePlayerAlive={togglePlayerAlive}
                        handleClick={handleClick}
                        removePlayer={removePlayer}
                        setCurrentPlayer={setCurrentPlayer}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                    />
                ))
            }

        </div>
    );
};

export default Consortium;
