import { useEffect, useState } from 'react'

import { GameState } from './App';

type GameControlsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
};

function GameControls({ gameState, setGameState }: GameControlsProps) {

    function assignRoles() {
        const players = gameState.players;
        const numPlayers = players.length;
        const numWerewolves = Math.floor(numPlayers / 3);

        const werewolfIndices: number[] = [];
        while (werewolfIndices.length < numWerewolves) {
            const index = Math.floor(Math.random() * numPlayers);
            if (!werewolfIndices.includes(index)) {
                werewolfIndices.push(index);
            }
        }

        players.forEach((player, index) => {
            if (werewolfIndices.includes(index)) {
                player.role = 'Werewolf';
            } else {
                player.role = 'Villager';
            }
        });

        setGameState({ ...gameState, players });
    }

    function advanceTime() {
        let { day, time } = gameState;
        time++;
        if (time > 1) {
            time = 0;
            day++;
        }
        setGameState({ ...gameState, day, time });
    }

    if (gameState.day === 0 && gameState.time === 0) {
        return (
            <div>
                <button onClick={assignRoles}>Assign Roles</button>
                <button onClick={advanceTime} disabled={gameState.players.find(x => x.role === undefined) !== undefined}>Start</button>
            </div>
        );
    }

    return (
        <div>
            <button>Next</button>
        </div>
    );
}

export default GameControls;
