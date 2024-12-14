import { useEffect, useState } from 'react';
import { GameState } from '../App';
import { PlayerType, PlayState } from '../enums';
import { assignRoles } from '../game/core';
import IconButton from './common/IconButton/IconButton';

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

        const duplicatedRoles = gameState.players.some((player, i) =>
            gameState.players.findIndex((p, ii) =>
                p.role?.name === player.role?.name && ii !== i
            ) !== -1
        );
        if (duplicatedRoles) {
            blockers.push('Duplicate Roles');
        }

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
            && !duplicatedRoles
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
            <div className='row'>

                <IconButton
                    icon={<i className='ra ra-spades-card' />}
                    onClick={() => assignRoles(gameState, setGameState, villagerPool, outsiderPool, werewolfPool, minionPool)}
                    label={(
                        <div>
                            Assign Roles
                            { gameState.players.length > 5 && minionPool.length <= 0 &&
                                <div className='error'>
                                    <hr />
                                    You require a <strong className='evil'>Minion</strong>, but none are available.
                                </div>
                            }
                        </div>
                    )}
                    disabled={gameState.players.length > 5 && minionPool.length <= 0}
                />

                <IconButton
                    icon={<i className='ra ra-perspective-dice-six' />}
                    onClick={shuffleCodeNames}
                    label='Shuffle Codenames'
                />

                <IconButton
                    icon={<i className='ra ra-stopwatch' />}
                    onClick={startGame}
                    disabled={!canStartGame}
                    label={(
                        <div>
                            Begin Game
                            { blocker.length > 0 &&
                                <div className='error'>
                                    <hr />
                                    {
                                        blocker.map((b, i) => (
                                            <div key={i}>{b}</div>
                                        ))
                                    }
                                </div>
                            }
                        </div>
                    )}
                />
            </div>
        );
    }

    if (gameState.state === PlayState.PLAYING || gameState.state === PlayState.SPECIAL) {
        return (
            <IconButton
                icon={<i className='ra ra-hourglass' />}
                onClick={advanceTime}
                disabled={gameState.state !== PlayState.PLAYING}
                label='Continue'
            />
        );
    }

    return (
        <IconButton
            icon={<i className='ra ra-cycle' />}
            onClick={resetGameState}
            label='Restart'
        />
    );
}

export default GameControls;
