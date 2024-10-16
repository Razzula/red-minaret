import { useEffect, useState } from 'react'

import { GameState } from './App';

type GameControlsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    gameSettings: any;
    advanceTime: () => void;
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>;
};

function GameControls({ gameState, setGameState, gameSettings, advanceTime, setCurrentPlayer }: GameControlsProps) {

    function assignRoles() {
        const players = gameState.players;
        const numPlayers = players.length;
        const numWerewolves = Math.floor(numPlayers / 3);

        // clear slate
        players.forEach(player => {
            player.role = undefined;
            player.statuses = [];
            player.alive = true;
        });

        // determine Werewolves
        const werewolfIndices: number[] = [];
        while (werewolfIndices.length < numWerewolves) {
            const index = Math.floor(Math.random() * numPlayers);
            if (!werewolfIndices.includes(index)) {
                werewolfIndices.push(index);
            }
        }

        // assign roles
        players.forEach((player, index) => {
            if (werewolfIndices.includes(index)) {
                player.role = 'Werewolf';
            } else {
                player.role = 'Villager';
            }
        });

        // handle drunk
        if (Math.random() < gameSettings.drunkProb) {
            const drunkIndex = Math.floor(Math.random() * numPlayers);
            players[drunkIndex].statuses = [...players[drunkIndex].statuses || [], 'Drunk'];
        }

        setGameState({ ...gameState, players });
    }

    function startGame() {
        setGameState({ ...gameState, day: 1, time: 0 });
        setCurrentPlayer(0);
    }

    if (gameState.day === 0 && gameState.time === 0) {
        return (
            <div>
                <button onClick={assignRoles}>Assign Roles</button>
                <button onClick={startGame} disabled={gameState.players.find(x => x.role === undefined) !== undefined}>Start</button>
            </div>
        );
    }

    return (
        <div>
            <button onClick={advanceTime}>Next</button>
        </div>
    );
}

export default GameControls;
