import { GameState, PopupEvent, LogEvent } from "../App";

import roles from '../data/roles';
import statuses, { Status } from '../data/statuses';
import { PlayState, Team } from "../enums";
import { getWerewolfBluffs } from "./utils";

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

    // bluffs
    gameState.bluffs = getWerewolfBluffs(gameState, roles);

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

    tempGameState.log.push({
        type: 'public',
        message: `${nominatingPlayer} nominated ${nominatedPlayer}.`,
    });

    // handle execution
    if (castVotes >= voteThreshold) {
        const priorVotes = tempGameState.choppingBlock?.votes || 0;
        if (castVotes > priorVotes) {
            // this player is now on the chopping block
            tempGameState.choppingBlock = {
                playerName: nominatedPlayer,
                votes: castVotes,
            };

            tempGameState.log.push({
                type: 'public',
                message: `${nominatingPlayer} is facing execution.`,
                indent: 1,
            });
        }
        else if (priorVotes === castVotes) {
            // in the case of a tie, no one is executed
            tempGameState.log.push({
                type: 'public',
                message: `Nobody is facing execution.`,
                indent: 1,
                extra: `The vote was tied with ${tempGameState.choppingBlock?.playerName}.`,
            });
            tempGameState.choppingBlock = undefined;
        }
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
            // start at the first player
            setCurrentPlayer(0);
            return;
        }
        else {
            // gamelog
            if (tempGameState.currentEvent) {
                tempGameState.log.push(tempGameState.currentEvent);
                tempGameState.players[currentPlayer].knowledge.push(tempGameState.currentEvent);
                tempGameState.currentEvent = undefined;
            }

            if (currentPlayer < tempGameState.players.length - 1) {
                // move to the next player


                // increment ability use counts, for night actions
                const player = tempGameState.players[currentPlayer];
                if (
                    player.role?.abilityUses !== undefined
                    && player.abilityUses < player.role?.abilityUses
                    && player.role?.night !== undefined
                    // some roles only increment under certain conditions
                    && (player.role?.condition === undefined || (
                        (player.role?.condition === 'dead' && !player.alive)
                    ))
                ) {
                    tempGameState.players[currentPlayer].abilityUses += 1;
                    setGameState(tempGameState);
                }

                setCurrentPlayer((currentPlayer + 1));
                setGameState(tempGameState);
                return;
            }
            else {
                setCurrentPlayer(null);
            }
        }
    }

    time++;
    // MORNING
    if (time === 1) {
        // HANDLE MURDER
        let murder = false;
        let temp: string = '';
        const popupEvent: PopupEvent = { message: 'It is a new day!' };
        const log: LogEvent[] = [];

        tempGameState.players.forEach((player, index) => {
            const targetedStatus = player.statuses?.find(status => status.name === 'Targeted');
            const playerTargeted = targetedStatus !== undefined && !targetedStatus.drunk && !targetedStatus.poisoned;

            const protectedStatus = player.statuses?.find(status => status.name === 'Protected');
            const playerProtected = protectedStatus !== undefined && !protectedStatus.drunk && !protectedStatus.poisoned;

            if (playerTargeted) {
                if (!playerProtected) {
                    if ( player.role?.name !== 'Soldier'
                        || player.statuses.find(status => status.name === 'Poisoned') !== undefined
                    ) {
                        murder = true;
                        tempGameState.players[index].alive = false;
                        // alert
                        popupEvent.heading = 'A red sun rises, blood has been spilled this night...';
                        // gamelog
                        log.push({
                            type: 'severe',
                            message: `${tempGameState.players[index].name} was murdered in the night!`,
                        });
                    }
                    else {
                        temp = 'soldier';
                    }
                }
                else {
                    temp = 'protected';
                }
            }
        });
        if (!murder) {
            // alert
            popupEvent.heading = 'Day drops, day rises. Dusk is sweet, the sunrise sweeter.';
            // gamelog
            log.push({
                type: 'public',
                message: 'Nobody was murdered in the night...',
                extra: (() => {
                    switch (temp) {
                        case 'soldier':
                            return 'The Soldier is immune to Werewolf kills.';
                        case 'protected':
                            return "The Doctor protected the Werewolf's target";
                        default:
                            return undefined;
                    }
                })()
            });
        }

        if (log.length > 0) {
            popupEvent.events = log;
            log.forEach(logEvent => {
                tempGameState.log.push(logEvent);
            })
        }
        if (popupEvent) {
            tempGameState.popupEvent = popupEvent;
        }
    }
    // NEW DAY
    else if (time > 2) {

        // handle lynch
        if (gameState.choppingBlock) {
            const lynchedIndex = tempGameState.players.findIndex(player => player.name === gameState.choppingBlock?.playerName);

            const popupEvent: PopupEvent = {}
            const log: LogEvent[] = [];

            tempGameState.players[lynchedIndex].alive = false;
            tempGameState.choppingBlock = undefined;

            log.push({
                type: 'severe',
                message: `${tempGameState.players[lynchedIndex].name} was lynched!`,
            });

            // SAINT
            if (tempGameState.players[lynchedIndex].role?.name === 'Saint') {
                if (tempGameState.players[lynchedIndex].statuses?.find(status => status.name === 'Poisoned') === undefined) {
                    // game log
                    tempGameState.log = log;
                    // alert
                    popupEvent.heading = 'The Saint has been lynched!';
                    popupEvent.events = log;
                    tempGameState.popupEvent = popupEvent;
                    tempGameState.state = PlayState.DEFEAT;
                    setGameState({ ...tempGameState });
                    return;
                }
                else {
                    // game log
                    log.push({
                        type: 'private',
                        message: 'The game continues...',
                        indent: 1,
                        extra: `${tempGameState.players[lynchedIndex].name} was the Saint, however, they were poisoned.`,
                    });
                    // alert
                    popupEvent.heading = 'The Saint has been lynched!';
                    tempGameState.popupEvent = popupEvent;
                }
            }
            popupEvent.events = log;
            tempGameState.popupEvent = popupEvent;
            log.forEach(logEvent => {
                tempGameState.log.push(logEvent);
            });
        }
        else {
            tempGameState.log.push({
                type: 'public',
                message: 'Nobody was lynched.',
            });
        }
        tempGameState.nominations = [];
        tempGameState.nominators = [];

        time = 0;
        day++;
        tempGameState.log.push({ type: 'heading', message: `Day ${day}` });

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

export function handleAction(
    playerIndex: number, currentPlayer: number | null,
    gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    selectedPlayers: number[], setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>,
) {
    if (currentPlayer === null) {
        return;
    }

    const isPlayerDrunk = gameState.players[currentPlayer].statuses?.find(status => status.name === 'Drunk') ? true : false;
    const isPlayerPoisoned = gameState.players[currentPlayer].statuses?.find(status => status.name === 'Poisoned') ? true : false;

    const currentRole = gameState.players[currentPlayer].role;
    if (!currentRole) {
        return;
    }

    const tempGameState = { ...gameState };

    if (currentRole.name === 'Werewolf') {
        // WEREWOLF
        const statusToApply = statuses['Targeted'];
        if (isPlayerPoisoned) {
            // POISONED
            // note: it is strange that a poisioner would ever target a Werewolf,
            // however, the BotCT rules do not prevent this...
            statusToApply.poisoned = true;
            statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Werewolf');
        }

        tempGameState.players[playerIndex].statuses?.push(statusToApply);
        for (const selectedPlayer of selectedPlayers) {
            tempGameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
        }
        setSelectedPlayers([playerIndex]);

        // gamelog
        tempGameState.currentEvent = {
            type: 'private',
            message: `${tempGameState.players[currentPlayer].name} targeted ${tempGameState.players[playerIndex].name}.`,
        };
    }

    else if (currentRole.name === 'Poisoner') {
        // POISIONER
        const statusToApply = statuses['Poisoned'];

        tempGameState.players[playerIndex].statuses?.push(statusToApply);
        for (const selectedPlayer of selectedPlayers) {
            tempGameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
        }
        setSelectedPlayers([playerIndex]);

        // gamelog
        tempGameState.currentEvent = {
            type: 'private',
            message: `${tempGameState.players[currentPlayer].name} poisioned ${tempGameState.players[playerIndex].name}.`,
        };
    }

    else if (currentRole.name === 'Doctor') {
        // DOCTOR
        const statusToApply = statuses['Protected'];
        if (isPlayerDrunk) {
            statusToApply.drunk = true;
            statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Drunk');
        }
        else if (isPlayerPoisoned) {
            statusToApply.poisoned = true;
            statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Doctor');
        }

        tempGameState.players[playerIndex].statuses?.push(statusToApply);
        for (const selectedPlayer of selectedPlayers) {
            tempGameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
        }
        setSelectedPlayers([playerIndex]);

        // gamelog
        tempGameState.currentEvent = {
            type: 'private',
            message: `${tempGameState.players[currentPlayer].name} protected ${tempGameState.players[playerIndex].name}.`,
        };
    }

    else if (currentRole.name === 'Seer') {
        // SEER
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
        // XXX: this does not allow the Seer to select themselves!
        setSelectedPlayers(newSelectedPlayers);

        // gamelog
        tempGameState.currentEvent = {
            type: 'private',
            message: `${tempGameState.players[currentPlayer].name} learnt that x of ${newSelectedPlayers.map(
                (index) => tempGameState.players[index].name
            ).join(', ')} ${newSelectedPlayers.length > 1 ? 'are' : 'is'} evil.`,
        };
    }

    else if (currentRole.name === 'Butler') {
        // BUTLER
        const statusToApply = statuses['Patron'];
        if (isPlayerPoisoned) {
            statusToApply.poisoned = true;
        }

        tempGameState.players[playerIndex].statuses?.push(statuses['Patron']);
        for (const selectedPlayer of selectedPlayers) {
            tempGameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
        }
        setSelectedPlayers([playerIndex]);

        // gamelog
        tempGameState.currentEvent = {
            type: 'private',
            message: `${tempGameState.players[currentPlayer].name} chose to serve ${tempGameState.players[playerIndex].name}.`,
        };
    }

    else {
        setSelectedPlayers([playerIndex]);
    }

    setGameState(tempGameState);
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

export function hunterAbility(
    gameState: GameState, selectedPlayers: number[],
    setGameState: React.Dispatch<React.SetStateAction<GameState>>, setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>, setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>
) {
    // HUNTER
    if (gameState.state === PlayState.SPECIAL && gameState.special?.state === 'Hunter') {
        const hunterIndex = gameState.players.findIndex(player => player.role?.name === 'Hunter');
        const hunter = gameState.players[hunterIndex];
        if (hunter && selectedPlayers.length === 1) {
            if (hunter.role?.abilityUses === undefined || hunter.abilityUses < hunter.role?.abilityUses) {
                const tempGameState = {...gameState};

                const target = gameState.players[selectedPlayers[0]];

                tempGameState.log.push({
                    type: 'public',
                    message: `${hunter.name} shot ${target.name}.`,
                });

                if (hunter.statuses?.find(status => status.name === 'Poisoned') !== undefined) {
                    // POISONED
                    tempGameState.log.push({
                        type: 'alert',
                        message: `${target.name} survived!`,
                        indent: 1,
                        extra: `${hunter.name} was poisioned.`,
                    });
                }
                else if (hunter.statuses?.find(status => status.name === 'Drunk') !== undefined) {
                    // DRUNK
                    tempGameState.log.push({
                        type: 'alert',
                        message: `${target.name} survived!`,
                        indent: 1,
                        extra: `${hunter.name} is drunk.`,
                    });
                }
                else {
                    // kill the selected player, if they are evil
                    if (target.role?.team === Team.EVIL) {
                        tempGameState.players[selectedPlayers[0]].alive = false;

                        tempGameState.log.push({
                            type: 'severe',
                            message: `${target.name} died!`,
                            indent: 1,
                        });
                    }
                    else {
                        tempGameState.log.push({
                            type: 'alert',
                            message: `${target.name} survived!`,
                            indent: 1,
                            extra: 'They were not the Werewolf.',
                        });
                    }
                }

                // log ability usage
                tempGameState.players[hunterIndex].abilityUses = (hunter.abilityUses || 0) + 1;

                // revert state
                tempGameState.state = tempGameState.special?.previous || PlayState.SETUP;
                tempGameState.special = undefined;

                setGameState(tempGameState);
                setCurrentPlayer(null);
                setSelectedPlayers([]);
            }
        }
    }
}
