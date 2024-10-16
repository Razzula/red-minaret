import React from 'react';

import { GameState } from './App';

import './CircleButtons.css';

type CircleButtonsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    radius: number;
};

const CircleButtons: React.FC<CircleButtonsProps> = ({ gameState, setGameState, radius }) => {

    const centerX = 200;
    const centerY = 400;

    const players = gameState.players;

    return (
        <div className='group-container'
            style={{
                width: `${2 * radius}px`,
                height: `${2 * radius}px`,
            }}
        >

            {players.map((player, index) => {

                const role = players[index].role;

                const angle = (index * 2 * Math.PI) / (players?.length || 0);
                const x = centerX + radius * Math.sin(angle);
                const y = centerY - radius * Math.cos(angle);

                return (
                    <div className='player'
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                        }}
                    >
                        <button
                            className={`circle-button ${role}`}
                            key={index}
                            disabled={role !== undefined}
                        >
                            <h2>{index + 1}</h2>
                        </button>
                        <span>{player.name}</span>
                    </div>
                );
            })}

        </div>
    );
};

export default CircleButtons;
