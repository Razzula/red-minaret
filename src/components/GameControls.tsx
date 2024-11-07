import { GameState } from '../App';
import { assignRoles } from '../game/core';

type GameControlsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    resetGameState: () => void;
    gameSettings: any;
    advanceTime: () => void;
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>;
    shuffleCodeNames: () => void;

    villagerPool: number[];
    outsiderPool: number[];
    werewolfPool: number[];
    minionPool: number[];
};

function GameControls({ gameState, setGameState, resetGameState, advanceTime, setCurrentPlayer, shuffleCodeNames, villagerPool, outsiderPool, werewolfPool, minionPool }: GameControlsProps) {

    function startGame() {
        setGameState({ ...gameState, day: 1, time: 0, state: 'playing' });
        setCurrentPlayer(0);
    }

    if (gameState.state === 'setup') {
        return (
            <div>
                <button onClick={() => assignRoles(gameState, setGameState, villagerPool, outsiderPool, werewolfPool, minionPool)}>Assign Roles</button>
                <button onClick={shuffleCodeNames}>Shuffle Codenames</button>
                <button onClick={startGame} disabled={gameState.players.length < 5 || gameState.players.find(x => x.role === undefined) !== undefined}>Start</button>
            </div>
        );
    }

    if (gameState.state === 'playing' || gameState.state === 'special') {
        return (
            <div>
                <button onClick={advanceTime} disabled={gameState.state !== 'playing'}>Next</button>
            </div>
        );
    }

    return (
        <button onClick={resetGameState}>Restart</button>
    );
}

export default GameControls;
