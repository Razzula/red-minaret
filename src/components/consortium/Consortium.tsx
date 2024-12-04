import React, { useEffect, useRef, useState } from 'react';

import { GameState } from '../../App';
import { Dialog, DialogContent, DialogTrigger, Tooltip, TooltipContent, TooltipTrigger } from '../common';
import { Voting } from '../Voting';
import PlayerToken from './PlayerToken';

import styles from './Consortium.module.scss';
import { PlayState, Team } from '../../enums';

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

        if (currentPlayer !== index) {
            event.stopPropagation();
            handleAction(index);
        }
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
