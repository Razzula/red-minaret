import { GameState } from "../App";
import roles from '../data/roles';
import statuses, { Status } from '../data/statuses';

export function assignRoles(gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>, villagerPool: number[], outsiderPool: number[], werewolfPool: number[], minionPool: number[]) {
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

export function enactVote(gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>, nominatingPlayer: string, nominatedPlayer: string, votes: Record<string, boolean>) {

    const totalVotes = Object.keys(votes).length; // TODO: dead players shouldn't be counted in the threshold
    const castVotes = Object.values(votes).reduce((count, value) => (value ? count + 1 : count), 0);
    const voteThreshold = Math.ceil(totalVotes / 2);

    // track nominations
    const tempGameState = {
        ...gameState,
        nominators: [...gameState.nominators, nominatingPlayer],
        nominations: [...gameState.nominations, nominatedPlayer],
    };

    // handle execution
    if (castVotes >= voteThreshold) {
        // TODO: handle a tie
        tempGameState.choppingBlock = nominatedPlayer;
    }

    // track ghost votes
    Object.entries(votes).forEach(([playerName, vote]) => {
        if (vote) { // iterate over players who voted
            const playerIndex = tempGameState.players.findIndex(player => player.name === playerName);
            const player = tempGameState.players[playerIndex];
            if (!player?.alive && player?.ghostVotes) {
                // if player using ghost votes, decrement
                tempGameState.players[playerIndex] = {
                    ...player,
                    ghostVotes: player.ghostVotes - 1,
                };
            }
        }
    });

    setGameState(tempGameState);
}

export function advanceTime(gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>, currentPlayer: number | null, setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>) {
    const tempGameState = { ...gameState };
    let { day, time } = tempGameState;

    if (time === 0) {
        // at night, advance through players
        // TODO: order should be role-based (use codenames), not 'chronological'
        if (currentPlayer === null) {
            setCurrentPlayer(0);
            return;
        }
        else if (currentPlayer < tempGameState.players.length - 1) {
            setCurrentPlayer((currentPlayer + 1));
            return;
        }
        else {
            setCurrentPlayer(null);
        }
    }

    time++;
    // MORNING
    if (time === 1) {
        // HANDLE MURDER
        tempGameState.players.forEach((player, index) => {
            if (player.statuses?.find(status => status.name === 'Targeted') &&
                !player.statuses?.find(status => status.name === 'Protected') &&
                player.role?.name !== 'Soldier'
            ) {
                // TODO: handle SAINT
                tempGameState.players[index].alive = false;
            }
        });
    }
    // NEW DAY
    else if (time > 2) {

        // handle lynch
        if (gameState.choppingBlock) {
            const lynchedIndex = tempGameState.players.findIndex(player => player.name === gameState.choppingBlock);

            tempGameState.players[lynchedIndex].alive = false;
            tempGameState.choppingBlock = undefined;

            tempGameState.nominations = [];
            tempGameState.nominators = [];

            // SAINT
            if (tempGameState.players[lynchedIndex].role?.name === 'Saint') {
                // TODO: custom alerts via Dialogue component
                alert('(the Saint was lynched...)');
                tempGameState.state = 'defeat';
                setGameState({ ...tempGameState });
                return;
            }
            // VIRGIN, etc.
        }

        time = 0;
        day++;

        setCurrentPlayer(0);
    }

    tempGameState.players.forEach((player, index) => {
        if (player.statuses) {
            // reset
            tempGameState.players[index].statuses = updateStatuses(player.statuses, time);
            // TODO: this is too fast for morning!
        }
    });

    setGameState({ ...tempGameState, day, time });
}

function updateStatuses(statuses: Status[], time: number) {
    const newStatuses = [];
    for (const status of statuses) {
        if (status.expiration === undefined || status.expiration !== time) {
            newStatuses.push(status);
        }
    }
    return newStatuses;
}

export function handleAction(playerIndex: number, currentPlayer: number | null, gameState: GameState, selectedPlayers: number[], setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>,) {
    if (currentPlayer === null) {
        return;
    }

    const isPlayerDrunk = gameState.players[currentPlayer].statuses?.find(status => status.name === 'Drunk') ? true : false;

    const currentRole = gameState.players[currentPlayer].role;
    if (!currentRole) {
        return;
    }

    if (currentRole.name === 'Werewolf') {
        // WEREWOLF
        gameState.players[playerIndex].statuses?.push(statuses['Targeted']);
        for (const selectedPlayer of selectedPlayers) {
            gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
        }
        setSelectedPlayers([playerIndex]);
        return;
    }

    if (currentRole.name === 'Doctor') {
        // DOCTOR
        const statusToApply = statuses['Protected'];
        if (isPlayerDrunk) {
            statusToApply.drunk = true;
            statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Drunk');
        }

        gameState.players[playerIndex].statuses?.push(statusToApply);
        for (const selectedPlayer of selectedPlayers) {
            gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
        }
        setSelectedPlayers([playerIndex]);
        return;
    }

    if (currentRole.name === 'Seer') {
        const newSelectedPlayers = [...selectedPlayers];
        if (newSelectedPlayers.includes(playerIndex)) {
            // deselect this player
            newSelectedPlayers.splice(newSelectedPlayers.indexOf(playerIndex), 1);
        }
        else {
            // select this player
            if (newSelectedPlayers.length === 2) {
                // deselect the first player
                newSelectedPlayers.shift();
            }
            newSelectedPlayers.push(playerIndex);
        }
        setSelectedPlayers(newSelectedPlayers);
        return;
    }

    if (currentRole.name === 'Butler') {
        // BUTLER
        gameState.players[playerIndex].statuses?.push(statuses['Patron']);
        for (const selectedPlayer of selectedPlayers) {
            gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
        }
        setSelectedPlayers([playerIndex]);
        return;
    }

    setSelectedPlayers([playerIndex]);
}

export function togglePlayerAlive(name: string, gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) {
    const index = gameState.players.findIndex(player => player.name === name);
    if (index === -1) {
        return;
    }
    const tempGameState = { ...gameState };
    tempGameState.players[index].alive = !tempGameState.players[index].alive;
    setGameState(tempGameState);
}
