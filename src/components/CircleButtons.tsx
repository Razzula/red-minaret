import React, { useEffect, useRef, useState } from 'react';

import { GameState } from '../App';

import '../styles/CircleButtons.css';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip';
import { Dialogue, DialogueContent, DialogueTrigger } from './common/Dialogue';
import { Voting } from './Voting';

type CircleButtonsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    radius: number;
    currentPlayer: number | null;
    selectedPlayers: number[];
    setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>;
    handleAction: (index: number) => void;
    togglePlayerAlive: (name: string) => void;
};

const CircleButtons: React.FC<CircleButtonsProps> = ({ gameState, setGameState, radius, currentPlayer, selectedPlayers, handleAction, togglePlayerAlive }) => {

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
        <div className='group-container'
            style={{
                width: `${3 * radius}px`,
                height: `${3 * radius}px`,
            }}
            ref={containerRef}
        >

            <div className='centrepiece'>
                { gameState.time === 2 &&
                    <Dialogue>
                        <DialogueTrigger>
                            <button>Start Vote</button>
                        </DialogueTrigger>
                        <DialogueContent>
                            <Voting gameState={gameState} setGameState={setGameState} togglePlayerAlive={togglePlayerAlive} />
                        </DialogueContent>
                    </Dialogue>
                }
            </div>

            {players.map((player, index) => {

                const role = players[index].role;

                const angle = (index * 2 * Math.PI) / (players?.length || 0);
                const x = centerX + radius * Math.sin(angle);
                const y = centerY - radius * Math.cos(angle);

                const isActive = currentPlayer !== null && currentPlayer !== index ? 'inactive' : 'active';
                const isSelected = selectedPlayers.includes(index) ? 'selected' : 'unselected';
                const isAlive = player.alive ? 'alive' : 'dead';
                const isPendingExecution = gameState.choppingBlock === player.name ? 'pending-execution' : '';

                return (<>
                    <div className='player'
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                        }}
                    >
                        <Tooltip enableClick={true} enableHover={false}>
                            <TooltipTrigger>
                                <button
                                    className={`circle-button ${role?.team} ${isActive} ${isSelected} ${isAlive} ${isPendingExecution}`}
                                    key={index}
                                    disabled={role === undefined}
                                    onClick={(e) => handleClick(e, index)}
                                >
                                    <h2>{index + 1}</h2>
                                </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div>{player.role?.description}</div>
                                    <div>
                                        <button onClick={() => togglePlayerAlive(player.name)}>{player.alive ? 'kill' : 'revive'}</button>
                                    </div>
                                </TooltipContent>
                        </Tooltip>
                        <span>{player.name}</span>
                        { player.role &&
                            <span> ({player.role?.name})</span>
                        }
                    </div>
                    {
                        player.statuses?.map((status, index) => {

                            const distanceMultiplier = (2 - index) / 3;
                            const newX = centerX + radius * distanceMultiplier * Math.sin(angle);
                            const newY = centerY - radius * distanceMultiplier * Math.cos(angle);

                            return (
                                <div key={index}
                                    className='status'
                                    style={{
                                        left: `${newX}px`,
                                        top: `${newY}px`,
                                        position: 'absolute',
                                    }}
                                >
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button
                                                className={`circle-button status-circle ${status} ${isActive}`}
                                                key={index}
                                                disabled={role === undefined}
                                                >
                                                <p>{status.name}</p>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>{status.description}</TooltipContent>
                                    </Tooltip>
                                </div>
                            );
                        })
                    }
                </>);
            })}

        </div>
    );
};

export default CircleButtons;
