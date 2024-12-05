import { useEffect, useState } from 'react';
import { GameState } from '../App';
import { PlayerType, PlayState } from '../enums';
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

    const [canStartGame, setCanStartGame] = useState(false);
    const [blocker, setBlocker] = useState<string[]>([]);

    useEffect(() => {
        const blockers: string[] = [];

        // PRE-REQUISITES
        // player count
        const enoughPlayers = gameState.players.length >= 5;
        if (!enoughPlayers) {
            blockers.push('Not enough players');
        }

        const rolePreReqs = gameState.players.every((player) =>
            player.role?.prereqRoles === undefined || player.role.prereqRoles.every((prereq) => {
                const poolToSearch = gameState.players.map(p => p.role);
                const valid = poolToSearch.filter(role => role?.[prereq.key] === prereq.value).length >= prereq.count;
                if (!valid) {
                    blockers.push(`${player.role?.name} needs >=${prereq.count} ${prereq.value}`);
                }
                return valid;
            }
        ));

        const isWerewolf = gameState.players.find(x => x.role?.type === PlayerType.WEREWOLF) !== undefined;
        if (!isWerewolf) {
            blockers.push('No Werewolves');
        }

        // const duplicateRoles = gameState.players.every((player, index) => gameState.players.findIndex(p => p.role?.name === player.role?.name) === index);
        // if (duplicateRoles) {
        //     blockers.push('Duplicate Roles');
        // }

        const allRolesAssigned = gameState.players.find(p => p.role === undefined) === undefined;
        if (!allRolesAssigned) {
            blockers.push('Unassigned Roles');
        }

        if (blockers.length > 0) {
            setBlocker(blockers);
        }
        else {
            setBlocker([]);
        }

        setCanStartGame(
            enoughPlayers
            && isWerewolf
            // && !duplicateRoles
            && allRolesAssigned
            && rolePreReqs
        );
    }, [gameState]);

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

                        <button onClick={startGame} disabled={!canStartGame}>
                            <i className='ra ra-stopwatch' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Begin Game
                        { blocker.length > 0 &&
                            <div className='severe'>
                                <hr />
                                <div>Blocked by:</div>
                                {
                                    blocker.map((b, i) => (
                                            <li key={i}><strong>{b}</strong></li>
                                    ))
                                }
                            </div>
                        }
                    </TooltipContent>
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
