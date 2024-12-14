import { GameState, PopupEvent, LogEvent, Player } from '../App';
import { PromptOptions } from '../components/common/Prompt/Prompt';

import roles from '../data/roles';
import statuses, { Status } from '../data/statuses';
import { PlayerType, PlayState } from "../enums";
import { getWerewolfBluffs, isPlayerDrunk, isPlayerIntoxicated, isPlayerPoisoned, isPlayerWerewolf, Result } from "./utils";

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

    // determine Villagers (remainder)
    const villagerIndicies = players.map((_player, index) => index).filter(index => !evilIndicies.includes(index) && !outsiderIndicies.includes(index));

    // assign roles
    evilIndicies.forEach(index => {
        const player = players[index];

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

            // BARON
            if (player.role.name === 'Baron') {
                // transfer two Villagers to the Outsider pool
                const transferedVillagers = villagerIndicies.splice(0, 2);
                outsiderIndicies.push(...transferedVillagers);
                console.log(outsiderIndicies);
            }
        }
    });

    outsiderIndicies.forEach(index => {
        const player = players[index];

        // OUTSIDER
        const role = tempOutsiderPool[Math.floor(Math.random() * tempOutsiderPool.length)]
        player.role = roles[role];
        tempOutsiderPool.splice(tempOutsiderPool.indexOf(role), 1);

        // DRUNK
        if (roles[role].name === 'Drunk') {
            drunkIndex = index;
        }
    });

    villagerIndicies.forEach(index => {
        const player = players[index];

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
    });

    // DRUNK
    if (drunkIndex !== null) {
        players[drunkIndex].statuses?.push(statuses['Drunk']);
        players[drunkIndex].role = roles[tempVillagerPool[Math.floor(Math.random() * tempVillagerPool.length)]];
    }

    // bluffs
    gameState.bluffs = getWerewolfBluffs(gameState, roles);

    gameState.turnOrder = determineTurnOrder(players);

    setGameState({ ...gameState, players });
}

function determineTurnOrder(players: Player[]) {
    const bags: Record<string, number[]> = {};

    function pushToBag(playerIndex: number, bag: string) {
        if (bags[bag] === undefined) {
            bags[bag] = [];
        }
        bags[bag].push(playerIndex);
    }

    players.forEach((player, index) => {
        if (player.role?.order) {
            switch (player.role.order.type) {
                case 'first':
                    pushToBag(index, 'first');
                    break;
                case 'early':
                    pushToBag(index, 'early');
                    break;
                case 'late':
                    pushToBag(index, 'late');
                    break;
                case 'last':
                    pushToBag(index, 'last');
                    break;
                default:
                    pushToBag(index, 'default');
                    break;
            }
        }
        else {
            pushToBag(index, 'default');
        }
    });

    const turnOrder: number[] = [];
    for (const bag of ['first', 'early', 'default', 'late', 'last']) {
        if (bags[bag] !== undefined && bags[bag].length > 0) {
            // bags[bag].sort(() => Math.random() - 0.5); // shuffle
            bags[bag].forEach(playerIndex => {
                turnOrder.push(playerIndex);
            });
        }
    }

    return turnOrder;
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

async function handleNightKill(
    playerIndex: number, player: Player, tempGameState: GameState, log: LogEvent[],
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>
): Promise<[GameState, boolean, string]> {
    let murder = false;
    let temp  = '';

    const hasProtectedStatus = player.statuses?.find(status => status.name === 'Protected');
    const playerProtected = hasProtectedStatus !== undefined && !hasProtectedStatus.drunk && !hasProtectedStatus.poisoned;

    if (player.alive) {
        if (!playerProtected) {
            if ( player.role?.name !== 'Soldier'
                || isPlayerIntoxicated(player)
            ) {

                // WEREWOLF (IMP)
                if (player.role?.name === 'Werewolf') {
                    // a self-kill for a Werewolf, converts their Minion to the Werewolf
                    const minions = tempGameState.players.filter(player => player.role?.type === PlayerType.MINION && player.alive);
                    if (minions) {
                        const minion = minions.sort(() => Math.random() - 0.5).pop();
                        if (minion) {
                            const werewolfRole = roles.find(role => role.name === 'Werewolf');
                            const minionIndex = tempGameState.players.findIndex(player => player.name === minion.name);
                            if (minion.role) {
                                tempGameState.players[minionIndex].oldRoles.push(minion.role);
                            }
                            tempGameState.players[minionIndex].role = werewolfRole;

                            log.push({
                                type: 'alert',
                                message: `${minion.name} is now the Werewolf!`,
                            });
                        }
                    }
                }

                // MAYOR
                else if (player.role?.name === 'Mayor') {
                    if (!isPlayerDrunk(player) || !isPlayerPoisoned(player)) {
                        const storytellerChoice = await showPrompt({
                            type: 'select',
                            title: 'Mayor Ability',
                            message: 'The Mayor has been killed. You can choose to let them die, or to kill another player instead.',
                            extras: ['You should choose what would be most interesting for the story.'],
                            cancelText: 'Kill Mayor',
                            confirmText: 'Kill Another Player',
                            options: tempGameState.players.filter(player => player.alive).map(player => player.name),
                        });

                        if (storytellerChoice !== null && storytellerChoice !== player.name) {
                            // protect Mayor
                            log.push({
                                type: 'alert',
                                message: `Mayor ability protected ${player.name}.`,
                            });

                            const mayorChoice = tempGameState.players.findIndex(player => player.name === storytellerChoice);
                            return handleNightKill(mayorChoice, tempGameState.players[mayorChoice], tempGameState, log, showPrompt);
                        }

                        log.push({
                            type: 'alert',
                            message: `Mayor ability did not protect ${player.name}.`,
                        });
                    }
                    else {
                        log.push({
                            type: 'alert',
                            message: `Mayor ability failed to protect ${player.name}.`,
                            extra: 'The Mayor was intoxicated.',
                        });
                    }
                }

                murder = true;
                tempGameState = killPlayerByIndex(playerIndex, tempGameState);
                // gamelog
                log.push({
                    type: 'severe',
                    message: `${player.name} was murdered in the night!`,
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
    else {
        temp = 'dead';
    }

    return [tempGameState, murder, temp];
}

export async function advanceTime(
    gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    currentPlayer: number | null, setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>,
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>
) {
    let tempGameState = { ...gameState };
    let { day, time } = tempGameState;

    if (time === 0) {
        // at night, advance through players
        if (currentPlayer === null) {
            console.error('currentPlayer cannot be null');
        }
        else {
            // gamelog
            if (tempGameState.currentEvent) {
                tempGameState.log.push(tempGameState.currentEvent);
                tempGameState.players[currentPlayer].knowledge.push(tempGameState.currentEvent);
                tempGameState.currentEvent = undefined;
            }

            if (tempGameState.turn !== undefined && tempGameState.turn < tempGameState.players.length - 1) {
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

                console.log(tempGameState.turnOrder, tempGameState.turn);
                if (tempGameState.turnOrder !== undefined && tempGameState.turn !== undefined) {
                    setCurrentPlayer(tempGameState.turnOrder[tempGameState.turn + 1]);
                    tempGameState.turn += 1;
                }
                else {
                    setCurrentPlayer(currentPlayer + 1); // fallback to 'chronological' order
                }
                setGameState(tempGameState);
                return;
            }
            else {
                tempGameState.turn = undefined;
                setCurrentPlayer(null);
            }
        }
    }

    time++;
    // MORNING
    if (time === 1) {
        // HANDLE MURDER
        let murder = false;
        let temp = '';

        const popupEvent: PopupEvent = { message: 'It is a new day!' };
        const log: LogEvent[] = [];

        for (const [index, player] of tempGameState.players.entries()) {
            const hasTargetedStatus = player.statuses?.find(status => status.name === 'Targeted');
            const playerTargeted = hasTargetedStatus !== undefined && !hasTargetedStatus.drunk && !hasTargetedStatus.poisoned;

            if (playerTargeted) {
                [tempGameState, murder, temp] = await handleNightKill(
                    index, player, tempGameState, log, showPrompt
                );
            }
        }

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
                        case 'dead':
                            return "An already-dead player was targeted...";
                        default:
                            return undefined;
                    }
                })()
            });
        }
        else {
            popupEvent.heading = 'A red sun rises, blood has been spilled this night...';
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

            tempGameState = killPlayerByIndex(lynchedIndex, tempGameState);
            tempGameState.lastNight.lynched = lynchedIndex;
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
            tempGameState.lastNight.lynched = undefined;

            tempGameState.log.push({
                type: 'public',
                message: 'Nobody was lynched.',
            });

            // MAYOR
            const mayorIndex = tempGameState.players.findIndex(player => player.role?.name === 'Mayor');
            if (mayorIndex !== -1) {
                // only three players
                const numberOfLivingPlayers = tempGameState.players.reduce((count, player) => (player.alive ? count + 1 : count), 0);
                if (tempGameState.players[mayorIndex].alive && numberOfLivingPlayers === 3) {

                    // not nullified
                    if (tempGameState.players[mayorIndex].statuses?.find(status => status.name === 'Poisoned') === undefined
                        && tempGameState.players[mayorIndex].statuses?.find(status => status.name === 'Drunk') === undefined
                    ) {
                        // villager victory
                        tempGameState.state = PlayState.VICTORY;

                        tempGameState.log.push({
                            type: 'alert',
                            message: 'Mayor victory conditions met!',
                            indent: 1,
                        });
                    }
                    else {
                        tempGameState.popupEvent = {
                            heading: 'Mayor ability blocked.',
                            message: 'The Mayor ability would have activated, but they are incapacitated.',
                        };
                    }

                }
            }
        }
        tempGameState.nominations = [];
        tempGameState.nominators = [];

        time = 0;
        day++;
        tempGameState.log.push({ type: 'heading', message: `Day ${day}` });

        // start at the first player
        if (tempGameState.turnOrder !== undefined && tempGameState.turnOrder.length > 0) {
            tempGameState.turn = 0;
            setCurrentPlayer(tempGameState.turnOrder[0]);
        }
        else {
            setCurrentPlayer(0); // fallback to 'chronological' order
        }
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
    const currentRoleDelay = currentRole.delay || 0;

    const tempGameState = { ...gameState };

    if (currentRole.name === 'Werewolf' && gameState.day > currentRoleDelay) {
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

export async function handleHunterAbility(
    gameState: GameState, selectedPlayers: number[],
    setGameState: React.Dispatch<React.SetStateAction<GameState>>, setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>, setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>,
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>
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
                    const isTargetWerewolf = isPlayerWerewolf(target);
                    if (isTargetWerewolf === Result.TRUE) {
                        tempGameState.players[selectedPlayers[0]].alive = false;

                        tempGameState.log.push({
                            type: 'severe',
                            message: `${target.name} died!`,
                            indent: 1,
                        });
                    }
                    else if (isTargetWerewolf === Result.STORYTELLER) {
                        const extras: string[] = [
                            'If the target is a Werewolf, they will die. Otherwise, they will survive.',
                        ];
                        if (target.role?.type === PlayerType.OUTSIDER) {
                            extras.push('As an Outsider, you should ideally choose what would be most detrimental to the Villagers.');
                        }

                        const storytellerChoice = await showPrompt({
                            type: 'bool',
                            title: 'Storyteller Decision',
                            message: `The Hunter shot the ${target.role?.name}. Do they ping as a Werewolf?`,
                            extras: extras,
                            cancelText: 'Werewolf',
                            confirmText: 'Not Werewolf',
                        });

                        if (storytellerChoice === null) {
                            // storyteller decided that the target is a Werewolf
                            tempGameState.players[selectedPlayers[0]].alive = false;
                            tempGameState.log.push({
                                type: 'severe',
                                message: `${target.name} died!`,
                                indent: 1,
                                extra: 'They pinged as a Werewolf.',
                            });
                        }
                        else {
                            // storyteller decided that the target is not a Werewolf
                            tempGameState.log.push({
                                type: 'alert',
                                message: `${target.name} survived!`,
                                indent: 1,
                                extra: 'They did not ping as a Werewolf.',
                            });
                        }
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

export function killPlayer(playerName: string, gameState: GameState) {
    return killPlayerByIndex(gameState.players.findIndex(player => player.name === playerName), gameState);
}

export function killPlayerByIndex(playerIndex: number, gameState: GameState) {
    const tempGameState = { ...gameState };
    tempGameState.players[playerIndex].alive = false;

    // SCARLET WOMAN
    if (tempGameState.players[playerIndex].role?.type === PlayerType.WEREWOLF) {
        if (tempGameState.players.length >= 5) {
            const scarletWomanIndex = tempGameState.players.findIndex(player => player.role?.name === 'Scarlet Woman');
            if (scarletWomanIndex !== -1) {

                // valid case
                const scarletWomanRole = tempGameState.players[scarletWomanIndex].role;
                if (scarletWomanRole !== undefined) {
                    tempGameState.players[scarletWomanIndex].oldRoles.push(scarletWomanRole);
                }
                const werewolfRole = roles.find(role => role.name === tempGameState.players[playerIndex].role?.name);
                if (werewolfRole !== undefined) {
                    // Scarlet Woman becomes the Werewolf
                    tempGameState.players[scarletWomanIndex].role = werewolfRole;
                }

                tempGameState.log.push({
                    type: 'alert',
                    message: `${tempGameState.players[scarletWomanIndex].name} is now the Werewolf!`,
                });
            }
        }
    }

    return tempGameState;
}
