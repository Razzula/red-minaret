import { GameState } from '../App';
import { PlayState } from '../enums';
import { assignRoles } from '../game/core';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip/Tooltip';

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
        setGameState({ ...gameState,
            day: 1, time: 0, state: PlayState.PLAYING,
            log: [{ type: 'heading', message: 'Day 1' }]
        });
        setCurrentPlayer(0);
    }

    if (gameState.state === PlayState.SETUP) {
        return (
            <div>
                <Tooltip>
                    <TooltipTrigger>
                        <button onClick={() => assignRoles(gameState, setGameState, villagerPool, outsiderPool, werewolfPool, minionPool)}>
                            <i className='ra ra-spades-card' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Assign Roles</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger>
                        <button onClick={shuffleCodeNames}>
                            <i className='ra ra-perspective-dice-six' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Shuffle Codenames</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger>

                    <button onClick={startGame} disabled={gameState.players.length < 5 || gameState.players.find(x => x.role === undefined) !== undefined}>
                            <i className='ra ra-stopwatch' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Begin Game</TooltipContent>
                </Tooltip>

            </div>
        );
    }

    if (gameState.state === PlayState.PLAYING || gameState.state === PlayState.SPECIAL) {
        return (
            <div>
                <Tooltip>
                    <TooltipTrigger>
                        <button onClick={advanceTime} disabled={gameState.state !== PlayState.PLAYING}>
                            <i className='ra ra-hourglass' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Continue</TooltipContent>
                </Tooltip>
            </div>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger>
                <button onClick={() => resetGameState()}>
                    <i className='ra ra-cycle' />
                </button>
            </TooltipTrigger>
            <TooltipContent>Restart</TooltipContent>
        </Tooltip>
    );
}

export default GameControls;
