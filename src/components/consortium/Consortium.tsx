import React, { useEffect, useRef, useState } from 'react';

import { GameState } from '../../App';
import { Dialog, DialogContent, DialogTrigger, Tooltip, TooltipContent, TooltipTrigger } from '../common';
import { Voting } from '../Voting';
import PlayerToken from './PlayerToken';

import styles from './Consortium.module.scss';

type ConsortiumProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    radius: number;
    currentPlayer: number | null;
    selectedPlayers: number[];
    setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>;
    handleAction: (index: number) => void;
    togglePlayerAlive: (name: string) => void;
    addPlayer: () => void;
    removePlayer: (name: string) => void;
};

const Consortium: React.FC<ConsortiumProps> = ({ gameState, setGameState, radius, currentPlayer, selectedPlayers, handleAction, togglePlayerAlive, addPlayer, removePlayer }) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const [centerX, setCenterX] = useState(0);
    const [centerY, setCenterY] = useState(0);

    useEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            const { width, height } = container.getBoundingClientRect();
            setCenterX(width / 2);
            setCenterY(height / 2);
        }
    }, []);

    function handleClick(event: React.MouseEvent<HTMLElement>, index: number) {
        if (currentPlayer === null) {
            return;
        }

        if (currentPlayer !== index) {
            event.stopPropagation();
            handleAction(index);
        }
    }

    const players = gameState.players;

    return (
        <div className={styles.groupContainer}
            style={{
                width: `${3 * radius}px`,
                height: `${3 * radius}px`,
            }}
            ref={containerRef}
        >

            <div className='centrepiece'>
                { gameState.state === 'setup' &&
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
                                +
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Add Player</TooltipContent>
                    </Tooltip>
                }
                { gameState.time === 2 &&
                    <Dialog>
                        <DialogTrigger>
                            <button>Start Vote</button>
                        </DialogTrigger>
                        <DialogContent>
                            <Voting gameState={gameState} setGameState={setGameState} togglePlayerAlive={togglePlayerAlive} />
                        </DialogContent>
                    </Dialog>
                }
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
                    />
                ))
            }

        </div>
    );
};

export default Consortium;
