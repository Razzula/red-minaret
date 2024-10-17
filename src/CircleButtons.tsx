import React, { useEffect, useRef, useState } from 'react';

import { GameState } from './App';

import './CircleButtons.css';

type CircleButtonsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    radius: number;
    currentPlayer: number | null;
};

const CircleButtons: React.FC<CircleButtonsProps> = ({ gameState, setGameState, radius, currentPlayer }) => {

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

    const players = gameState.players;

    return (
        <div className='group-container'
            style={{
                width: `${3 * radius}px`,
                height: `${3 * radius}px`,
            }}
            ref={containerRef}
        >

            {players.map((player, index) => {

                const role = players[index].role;

                const angle = (index * 2 * Math.PI) / (players?.length || 0);
                const x = centerX + radius * Math.sin(angle);
                const y = centerY - radius * Math.cos(angle);

                const isActive = currentPlayer !== null && currentPlayer !== index ? 'inactive' : 'active';

                return (
                    <div className='player'
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                        }}
                    >
                        <button
                            className={`circle-button ${role?.team} ${isActive}`}
                            key={index}
                            disabled={role === undefined}
                        >
                            <h2>{index + 1}</h2>
                        </button>
                        <span>{player.name}</span>
                        { player.role &&
                            <span> ({player.role?.name})</span>
                        }
                        {
                            player.statuses?.map((status, index) => {
                                // const newX = (centerX - x) / 2;
                                // const newY = (centerY - y) / 2;

                                return (
                                    <div key={index}
                                        // className='player'
                                        // style={{
                                        //     left: `${x}px`,
                                        //     top: `${y}px`,
                                        // }}
                                    >{status}</div>
                                );
                            })
                        }
                    </div>
                );
            })}

        </div>
    );
};

export default CircleButtons;
