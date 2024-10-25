import { GameState } from '../App';
import roles from '../data/roles';
import statuses from '../data/statuses';

type GameControlsProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    resetGameState: () => void;
    gameSettings: any;
    advanceTime: () => void;
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>;

    villagerPool: number[];
    outsiderPool: number[];
    werewolfPool: number[];
    minionPool: number[];
};

function GameControls({ gameState, setGameState, resetGameState, advanceTime, setCurrentPlayer, villagerPool, outsiderPool, werewolfPool, minionPool }: GameControlsProps) {

    function assignRoles() {
        const players = gameState.players;
        const numPlayers = players.length;

        const tempVillagerPool = [...villagerPool];
        const tempOutsiderPool = [...outsiderPool];
        const tempWerewolfPool = [...werewolfPool];
        const tempMinionPool = [...minionPool];

        // clear slate
        players.forEach(player => {
            player.role = undefined;
            player.statuses = [];
            player.alive = true;
        });

        // select roles
        const numEvil = Math.floor(numPlayers / 3);
        const numOutsiders = 1;

        // determine Werewolves
        const evilIndicies: number[] = [];
        while (evilIndicies.length < numEvil) {
            const index = Math.floor(Math.random() * numPlayers);
            if (!evilIndicies.includes(index)) {
                evilIndicies.push(index);
            }
        }

        const werewolfIndicies = evilIndicies.slice(0, 1);

        // determine Outsiders
        const outsiderIndicies: number[] = [];
        while (outsiderIndicies.length < Math.min(numOutsiders, tempOutsiderPool.length)) {
            const index = Math.floor(Math.random() * numPlayers);
            if (!evilIndicies.includes(index) && !outsiderIndicies.includes(index)) {
                outsiderIndicies.push(index);
            }
        }
        let drunkIndex: number | null = null;

        // assign roles
        players.forEach((player, index) => {
            if (evilIndicies.includes(index)) {

                if (werewolfIndicies.includes(index)) {
                    // WEREWOLF
                    const role = tempWerewolfPool[Math.floor(Math.random() * tempWerewolfPool.length)]
                    player.role = roles[role];
                    tempWerewolfPool.splice(tempWerewolfPool.indexOf(role), 1);
                }
                else {
                    // MINION
                    const role = tempMinionPool[Math.floor(Math.random() * tempMinionPool.length)]
                    player.role = roles[role];
                    tempMinionPool.splice(tempMinionPool.indexOf(role), 1);
                }

            }
            else {

                if (outsiderIndicies.includes(index)) {
                    // OUTSIDER
                    const role = tempOutsiderPool[Math.floor(Math.random() * tempOutsiderPool.length)]
                    player.role = roles[role];
                    tempOutsiderPool.splice(tempOutsiderPool.indexOf(role), 1);

                    // DRUNK
                    if (roles[role].name === 'Drunk') {
                        drunkIndex = index;
                    }
                }
                else {
                    // VILLAGER
                    const role = tempVillagerPool[Math.floor(Math.random() * tempVillagerPool.length)]
                    player.role = roles[role];
                    tempVillagerPool.splice(tempVillagerPool.indexOf(role), 1);

                    if (player.role) {
                        // SEER
                        if (roles[role].name === 'Seer') {
                            let redHerringIndex = Math.floor(Math.random() * numPlayers);
                            while (evilIndicies.includes(redHerringIndex)) {
                                // an evil player cannot be the red herring
                                redHerringIndex = Math.floor(Math.random() * numPlayers);
                            }
                            players[redHerringIndex].statuses?.push(statuses['Red Herring']);
                        }
                    }
                }
            }
        });

        // DRUNK
        if (drunkIndex !== null) {
            players[drunkIndex].statuses?.push(statuses['Drunk']);
            players[drunkIndex].role = roles[tempVillagerPool[Math.floor(Math.random() * tempVillagerPool.length)]];
        }

        setGameState({ ...gameState, players });
    }

    function startGame() {
        setGameState({ ...gameState, day: 1, time: 0, state: 'playing' });
        setCurrentPlayer(0);
    }

    if (gameState.state === 'setup') {
        return (
            <div>
                <button onClick={assignRoles}>Assign Roles</button>
                <button onClick={startGame} disabled={gameState.players.find(x => x.role === undefined) !== undefined}>Start</button>
            </div>
        );
    }

    if (gameState.state === 'playing') {
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
