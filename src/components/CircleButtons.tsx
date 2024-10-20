import React, { useEffect, useRef, useState } from 'react';

import { GameState } from '../App';

import '../styles/CircleButtons.css';

type CircleButtonsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    radius: number;
    currentPlayer: number | null;
    selectedPlayers: number[];
    setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>;
    handleAction: (index: number) => void;
};

const CircleButtons: React.FC<CircleButtonsProps> = ({ gameState, setGameState, radius, currentPlayer, selectedPlayers, setSelectedPlayers, handleAction }) => {

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

    function handleClick(index: number) {
        if (currentPlayer === null) {
            return;
        }

        if (currentPlayer !== index) {
            // setSelectedPlayers([index]);
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

            {players.map((player, index) => {

                const role = players[index].role;

                const angle = (index * 2 * Math.PI) / (players?.length || 0);
                const x = centerX + radius * Math.sin(angle);
                const y = centerY - radius * Math.cos(angle);

                const isActive = currentPlayer !== null && currentPlayer !== index ? 'inactive' : 'active';
                const isSelected = selectedPlayers.includes(index) ? 'selected' : 'unselected';
                const isAlive = player.alive ? 'alive' : 'dead';

                return (<>
                    <div className='player'
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                        }}
                    >
                        <button
                            className={`circle-button ${role?.team} ${isActive} ${isSelected} ${isAlive}`}
                            key={index}
                            disabled={role === undefined}
                            onClick={() => handleClick(index)}
                        >
                            <h2>{index + 1}</h2>
                        </button>
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
                                    <button
                                        className={`circle-button status-circle ${status} ${isActive}`}
                                        key={index}
                                        disabled={role === undefined}
                                    >
                                        <p>{status}</p>
                                    </button>
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
