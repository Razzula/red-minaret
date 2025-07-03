import { GameState, PopupEvent, LogEvent, Player } from '../App';
import { PromptOptions } from '../components/common/Prompt/Prompt';

import roles, { Role } from '../data/roles';
import statuses, { Status } from '../data/statuses';
import { PlayerType, PlayState, Team } from "../enums";
import { isPlayerGrandchild } from './Nain';
import { canPlayerActTonight, getWerewolfBluffs, isPlayerDrunk, isPlayerEvil, isPlayerIntoxicated, isPlayerLunatic, isPlayerMarionette, isPlayerPoisoned, Result, setRole, updateRole } from "./utils";

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
        player.trueRole = undefined;
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
    let marionetteIndex: number | null = null;

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
    let lunaticIndex: number | null = null;

    // determine Villagers (remainder)
    const villagerIndicies = players.map((_player, index) => index).filter(index => !evilIndicies.includes(index) && !outsiderIndicies.includes(index));

    // assign roles
    evilIndicies.forEach(index => {
        if (werewolfIndicies.includes(index)) {
            // WEREWOLF
            const role = tempWerewolfPool[Math.floor(Math.random() * tempWerewolfPool.length)]
            setRole(gameState, index, roles[role]);
            tempWerewolfPool.splice(tempWerewolfPool.indexOf(role), 1);
        }
        else {
            // MINION
            const role = tempMinionPool[Math.floor(Math.random() * tempMinionPool.length)]
            setRole(gameState, index, roles[role]);
            tempMinionPool.splice(tempMinionPool.indexOf(role), 1);

            // BARON
            if (gameState.players[index].role && gameState.players[index].role.name === 'Baron') {
                // transfer two Villagers to the Outsider pool
                const transferedVillagers = villagerIndicies.splice(0, 2);
                outsiderIndicies.push(...transferedVillagers);
            }
            // MARIONETTE
            else if (roles[role].name === 'Marionette') {
                marionetteIndex = index;
            }
        }
    });

    outsiderIndicies.forEach(index => {
        // OUTSIDER
        const role = tempOutsiderPool[Math.floor(Math.random() * tempOutsiderPool.length)]

        // DRUNK
        if (roles[role].name === 'Drunk') {
            drunkIndex = index;
        }
        else if (roles[role].name === 'Lunatic') {
            lunaticIndex = index;
        }
        else {
            tempOutsiderPool.splice(tempOutsiderPool.indexOf(role), 1);
            setRole(gameState, index, roles[role]);
        }

    });

    villagerIndicies.forEach(index => {
        // VILLAGER
        const role = tempVillagerPool[Math.floor(Math.random() * tempVillagerPool.length)]
        setRole(gameState, index, roles[role]);
        tempVillagerPool.splice(tempVillagerPool.indexOf(role), 1);

        if (gameState.players[index].role) {
            // SEER
            if (roles[role].name === 'Seer') {
                let redHerringIndex = Math.floor(Math.random() * numPlayers);
                while (evilIndicies.includes(redHerringIndex)) {
                    // an evil player cannot be the red herring
                    redHerringIndex = Math.floor(Math.random() * numPlayers);
                }
                players[redHerringIndex].statuses?.push(statuses['Red Herring']);
            }

            // SEER
            else if (roles[role].name === 'Nain') {
                let grandChildIndex = Math.floor(Math.random() * numPlayers);
                while (evilIndicies.includes(grandChildIndex) || grandChildIndex === index) {
                    // an evil player cannot be the grandchild
                    grandChildIndex = Math.floor(Math.random() * numPlayers);
                }
                players[grandChildIndex].statuses?.push(statuses['Grandchild']);
            }
        }
    });

    // DRUNK
    if (drunkIndex !== null) {
        const DrunkRole = roles.find(role => role.name === 'Drunk') as Role;
        setRole(gameState, drunkIndex, DrunkRole, roles[tempVillagerPool[Math.floor(Math.random() * tempVillagerPool.length)]]);
        players[drunkIndex].statuses?.push({ ...statuses.Drunk });
    }
    // LUNATIC
    if (lunaticIndex !== null) {
        const LunaticRole = roles.find(role => role.name === 'Lunatic') as Role;
        setRole(gameState, lunaticIndex, LunaticRole, roles[[...werewolfPool][Math.floor(Math.random() * werewolfPool.length)]]);
        players[lunaticIndex].role!.team = Team.GOOD;
        players[lunaticIndex].role!.type = PlayerType.OUTSIDER;
        players[lunaticIndex].statuses?.push({ ...statuses.Lunatic });
    }

    // MARIONETTE
    if (marionetteIndex !== null) {
        const MarionetteRole = roles.find(role => role.name === 'Marionette') as Role;
        // Marionette must neighbour the Werewolf
        const werewolfIndex = werewolfIndicies[0];
        const werewolfNeighbours = getPlayerNeighbours(players, werewolfIndex);
        if (!werewolfNeighbours.includes(marionetteIndex)) {
            const randomNeighbourIndex = werewolfNeighbours[Math.floor(Math.random() * werewolfNeighbours.length)];
            // swap roles
            setRole(gameState, marionetteIndex, players[randomNeighbourIndex].trueRole as Role, players[randomNeighbourIndex].role as Role);
            const tempStatuses = players[randomNeighbourIndex].statuses || [];
            players[randomNeighbourIndex].statuses = players[marionetteIndex].statuses || [];
            players[marionetteIndex].statuses = tempStatuses;
            marionetteIndex = randomNeighbourIndex;
        }
        const fakeRole = tempVillagerPool[Math.floor(Math.random() * tempVillagerPool.length)];
        setRole(gameState, marionetteIndex, MarionetteRole, roles[fakeRole]);
        players[marionetteIndex].role!.team = Team.EVIL; // Marionette is an Evil player
        players[marionetteIndex].role!.type = PlayerType.MINION;
        players[marionetteIndex].statuses?.push({ ...statuses.Marionette });
    }

    // bluffs
    gameState.bluffs = getWerewolfBluffs(gameState, roles);

    gameState.turnOrder = determineTurnOrder(players);

    setGameState({ ...gameState, players });
}

function determineTurnOrder(players: Player[]) {
    const bags: Record<string, number[]> = {};
    const beforeBag: Record<string, number[]> = {};

    function pushToBag(playerIndex: number, bag: string) {
        if (bags[bag] === undefined) {
            bags[bag] = [];
        }
        bags[bag].push(playerIndex);
    }

    players.forEach((player, index) => {
        if (player.trueRole?.order) {
            switch (player.trueRole.order.type) {
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
                case 'before':
                    if (player.trueRole.order.relative !== undefined) {
                        if (beforeBag[player.trueRole.order.relative] === undefined) {
                            beforeBag[player.trueRole.order.relative] = [];
                        }
                        beforeBag[player.trueRole.order.relative].push(index);
                    }
                    else {
                        pushToBag(index, 'default');
                    }
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
                const playerType = players[playerIndex].role?.type;
                if (playerType) {
                    if (beforeBag[playerType] !== undefined) {
                        // if this player is before another player, add them to the front of the turn order
                        beforeBag[playerType].forEach(beforeIndex => {
                            turnOrder.push(beforeIndex);
                        });
                    }
                }

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

export async function handleNightKill(
    playerIndex: number, tempGameState: GameState, log: LogEvent[],
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>,
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>
): Promise<[GameState, boolean, string]> {
    let murder = false;
    let temp = '';

    const player = tempGameState.players[playerIndex];

    const hasProtectedStatus = player.statuses?.find(status => status.name === 'Protected');
    const playerProtected = hasProtectedStatus !== undefined && !hasProtectedStatus.intoxicated;

    if (player.alive) {
        if (!playerProtected) {

            // SOLDIER
            if (player.role?.name === 'Soldier') {
                if (isPlayerIntoxicated(player, tempGameState)) {
                    temp = 'soldier-null';
                }
                else {
                    return [tempGameState, false, 'soldier'];
                }
            }

            // WEREWOLF (IMP)
            else if (player.role?.name === 'Werewolf') {
                // a self-kill for a Werewolf, converts their Minion to the Werewolf
                const minions = tempGameState.players.filter(player => player.role?.type === PlayerType.MINION && player.alive);
                if (minions) {
                    const minion = minions.sort(() => Math.random() - 0.5).pop();
                    if (minion) {
                        const werewolfRole = roles.find(role => role.name === 'Werewolf') as Role;
                        const minionIndex = tempGameState.players.findIndex(player => player.name === minion.name);
                        if (minion.role) {
                            updateRole(tempGameState, minionIndex, werewolfRole);
                        }
                        setRole(tempGameState, minionIndex, werewolfRole);

                        log.push({
                            type: 'alert',
                            message: `${minion.name} is now the Werewolf!`,
                        });
                    }
                }
            }

            else if (player.role?.type === PlayerType.OUTSIDER) {
                // BLIGHTFANG
                const blightfangIndex = tempGameState.players.findIndex(player => player.trueRole?.name === 'Blightfang');
                // an Outsider-kill for a Blightfang, converts them into a Blightfang
                if (blightfangIndex !== -1) {
                    const blightfangCount = tempGameState.players.filter(player => player.trueRole?.name === 'Blightfang').length;
                    if (blightfangCount < 2) {
                        // kill the Blightfang
                        const newBlightfangIndex = playerIndex;
                        playerIndex = blightfangIndex; // death handled by night kill

                        // infect the Outsider
                        const blightfangRole = {...roles.find(role => role.name === 'Blightfang')} as Role;
                        updateRole(tempGameState, newBlightfangIndex, blightfangRole);
                        tempGameState.players[newBlightfangIndex].abilityUses = tempGameState.players[blightfangIndex].abilityUses;
                    }
                }
            }

            // MAYOR
            else if (player.role?.name === 'Mayor') {
                if (!isPlayerIntoxicated(player, tempGameState)) {
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
                        return handleNightKill(mayorChoice, tempGameState, log, setCurrentPlayer, showPrompt);
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

            // FARMER
            if (player.role?.name === 'Farmer') {
                const farmerIndex = tempGameState.players.findIndex(player => player.role?.name === 'Farmer');
                if (farmerIndex !== -1) {
                    const farmer = tempGameState.players[farmerIndex];
                    if (farmer.alive && !isPlayerIntoxicated(farmer, tempGameState)) {
                        // create a new Farmer
                        const numberOfGoodPlayers = tempGameState.players.reduce((count, player) => (player.alive && !isPlayerEvil(player, tempGameState) ? count + 1 : count), 0);
                        if (numberOfGoodPlayers > 0) {
                            setCurrentPlayer(farmerIndex);
                            tempGameState.special = {
                                state: 'Farmer',
                                previous: tempGameState.state,
                            }
                            tempGameState.state = PlayState.SPECIAL;
                        }
                    }
                }
            }

            murder = true;
            tempGameState = killPlayerByIndex(playerIndex, tempGameState);
            // gamelog
            log.push({
                type: 'severe',
                message: `${player.name} was murdered in the night!`,
            });

            // NAIN
            if (isPlayerGrandchild(tempGameState.players[playerIndex])) {
                const nainIndex = tempGameState.players.findIndex(player => player.role?.name === 'Nain');
                if (nainIndex !== -1) {
                    const nain = tempGameState.players[nainIndex];
                    if (nain.alive && !isPlayerIntoxicated(nain, tempGameState)) {
                        // kill the Nain
                        tempGameState.players[nainIndex].alive = false;
                        log.push({
                            type: 'severe',
                            message: `${nain.name} died!`,
                            extra: 'Their grandchild was killed.',
                            indent: 1,
                        });
                    }
                }
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
    let tempGameState: GameState | null = { ...gameState };
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
                    && canPlayerActTonight(player, tempGameState)
                    && player.role?.type !== PlayerType.WEREWOLF
                    // some roles only increment under certain conditions
                    && (player.role?.condition === undefined || (
                        (player.role?.condition === 'dead' && !player.alive)
                    ))
                ) {
                    tempGameState.players[currentPlayer].abilityUses += 1;
                    setGameState(tempGameState);
                }

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
        handleDawn(tempGameState, setCurrentPlayer, showPrompt);
    }
    // NEW DAY
    else if (time > 2) {
        tempGameState = handleDusk(tempGameState, setGameState);
        if (tempGameState === null) {
            return;
        }

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

export async function handleDawn(
    tempGameState: GameState,
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>,
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>,
) {

    tempGameState.players.forEach((_, i) => {
        // reset modified state
        tempGameState.players[i].modified = false;
    });

    // HANDLE MURDER
    let murder = false;
    let temp = '';

    const popupEvent: PopupEvent = { message: 'It is a new day!' };
    const log: LogEvent[] = [];

    for (const [index, player] of tempGameState.players.entries()) {
        const hasTargetedStatus = player.statuses?.find(status => status.name === 'Targeted');
        const playerTargeted = hasTargetedStatus !== undefined && !hasTargetedStatus.intoxicated;

        if (playerTargeted) {
            [tempGameState, murder, temp] = await handleNightKill(
                index, tempGameState, log, setCurrentPlayer, showPrompt
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
                    case 'soldier-null':
                        return "The Soldier's ability was nullified.";
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
        log.forEach(logEvent => {
            tempGameState.log.push(logEvent);
            tempGameState.logBuffer.push(logEvent);
        })
    }
    popupEvent.events = tempGameState.logBuffer;
    tempGameState.logBuffer = [];
    if (popupEvent) {
        tempGameState.popupEvent = popupEvent;
    }

    return tempGameState;
}

export function handleDusk(tempGameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>): GameState | null {

    // CANNIBAL
    const cannibalIndex = tempGameState.players.findIndex(player => player.trueRole?.name === 'Cannibal');
    if (cannibalIndex !== -1) {
        // restore Cannibal status
        tempGameState.players[cannibalIndex].statuses = tempGameState.players[cannibalIndex].statuses?.filter(
            (status) => status.name !== 'Cannibal'
        );
        const cannibalRole = roles.find(role => role.name === 'Cannibal') as Role;
        updateRole(tempGameState, cannibalIndex, cannibalRole);
    }

    // handle lynch
    if (tempGameState.choppingBlock) {

        // WITCHER
        if (tempGameState.choppingBlock?.playerName === 'Storyteller') {
            const isWitcherInGame = tempGameState.players.some(player => player.role?.name === 'Witcher');
            if (isWitcherInGame) {
                // Good win
                tempGameState.state = PlayState.VICTORY;
            }
            else {
                // Good lose
                tempGameState.state = PlayState.DEFEAT;
            }
            return tempGameState;
        }

        const lynchedIndex = tempGameState.players.findIndex(player => player.name === tempGameState.choppingBlock?.playerName);

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
            if (!isPlayerIntoxicated(tempGameState.players[lynchedIndex], tempGameState)) {
                // game log
                tempGameState.log = log;
                // alert
                popupEvent.heading = 'The Saint has been lynched!';
                popupEvent.events = log;
                tempGameState.popupEvent = popupEvent;
                tempGameState.state = PlayState.DEFEAT;
                setGameState({ ...tempGameState });
                return null;
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

        // GOBBO
        if (tempGameState.players[lynchedIndex].role?.name === 'Gobbo') {
            if (tempGameState.players[lynchedIndex].statuses?.find(status => status.name === 'Goblin')) {
                if (!isPlayerIntoxicated(tempGameState.players[lynchedIndex], tempGameState)) {
                    // game log
                    tempGameState.log = log;
                    // alert
                    popupEvent.heading = 'The Gobbo has been lynched!';
                    popupEvent.events = log;
                    tempGameState.popupEvent = popupEvent;
                    tempGameState.state = PlayState.DEFEAT;
                    setGameState({ ...tempGameState });
                    return null;
                }
                else {
                    // game log
                    log.push({
                        type: 'private',
                        message: 'The game continues...',
                        indent: 1,
                        extra: `${tempGameState.players[lynchedIndex].name} was the Gobbo, however, they were poisoned.`,
                    });
                    // alert
                    popupEvent.heading = 'The Gobbo has been lynched!';
                    tempGameState.popupEvent = popupEvent;
                }
            }
        }

        // CANNIBAL
        const cannibalIndex = tempGameState.players.findIndex(player => player.role?.name === 'Cannibal');
        if (cannibalIndex !== -1 && isPlayerEvil(tempGameState.players[lynchedIndex], tempGameState) !== Result.TRUE) {
            tempGameState.players[cannibalIndex].statuses?.push({ ...statuses.Cannibal });
            const cannibalRole = roles.find(role => role.name === 'Cannibal') as Role;
            setRole(tempGameState, cannibalIndex, cannibalRole, tempGameState.players[lynchedIndex].role as Role);
        }

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

                // no execution
                if (tempGameState.lastNight.lynched === undefined) {

                    // not nullified
                    if (!isPlayerIntoxicated(tempGameState.players[mayorIndex], tempGameState)) {
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
    }
    tempGameState.nominations = [];
    tempGameState.nominators = [];

    return tempGameState;
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
    playerIndex: number,
    currentPlayer: number | null, setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>,
    gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    selectedPlayers: number[], setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>,
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>
) {
    if (currentPlayer === null) {
        return;
    }

    const playerIsDrunk = isPlayerDrunk(gameState.players[currentPlayer]);
    const playerIsPoisoned = isPlayerPoisoned(gameState.players[currentPlayer]);
    const playerIsMarionette = isPlayerMarionette(gameState.players[currentPlayer]);
    const playerIsLunatic = isPlayerLunatic(gameState.players[currentPlayer]);
    const playerIsIntoxicated = isPlayerIntoxicated(gameState.players[currentPlayer], gameState);

    const currentRole = gameState.players[currentPlayer].role;
    if (!currentRole) {
        return;
    }

    const currentRoleDelay = currentRole.delay || 0;

    let tempGameState = { ...gameState };

    if (
        (
            currentRole.name === 'Werewolf'
            || currentRole.name === 'Bloodhound'
            || currentRole.name === 'Blightfang'
            || (currentRole.name === 'Dragulf' && gameState.lastDeath !== gameState.day - 1)
        )
        && gameState.day > currentRoleDelay
    ) {
        // WEREWOLF, BLOODHOUND, BLIGHTFANG, DRAGULF
        const statusToApply = { ...statuses['Targeted'] };
        if (playerIsIntoxicated) {
            // POISONED
            // note: it is strange that a poisioner would ever target a Werewolf,
            // however, the BotCT rules do not prevent this...
            statusToApply.intoxicated = true;
            if (playerIsLunatic) {
                statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Lunatic');
            }
            else {
                statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', currentRole.name);
            }
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
        const statusToApply = { ...statuses['Protected'] };
        if (playerIsIntoxicated) {
            statusToApply.intoxicated = true;
            if (playerIsDrunk) {
                statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Drunk');
            }
            else if (playerIsPoisoned) {
                statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Doctor');
            }
            else if (playerIsMarionette) {
                statusToApply.altDescription = statusToApply.altDescription!.replace('$ROLE$', 'Marionette');
            }
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
        if (playerIsIntoxicated) {
            statusToApply.intoxicated = true;
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

    else if (currentRole.name === 'Gambler') {
        // GAMBLER
        showPrompt({
            type: 'select',
            title: 'Gambler Ability',
            message: `What role do you think ${gameState.players[playerIndex].name} is?`,
            options: [...gameState.players.map(player => player.role?.name).filter(role => role !== undefined), 'Other'],
        }).then((result) => {
            if (result !== null) {
                tempGameState.log.push({
                    type: 'private',
                    message: `${gameState.players[currentPlayer].name} gambled that ${gameState.players[playerIndex].name} is a ${result}.`,
                });
                // tempGameState.currentEvent = {
                //     type: 'private',
                //     message: `${gameState.players[currentPlayer].name} gambled that ${gameState.players[playerIndex].name} is a ${result}.`,
                // };
                setSelectedPlayers([playerIndex]);

                if (playerIsIntoxicated) {
                    console.log('gambler was intoxicated');
                }
                else {
                    tempGameState.logBuffer.push({
                        type: 'private',
                        message: `${gameState.players[currentPlayer].name} gambled that ${gameState.players[playerIndex].name} is a ${result}.`,
                    });
                    if (result !== null) {
                        if (result !== gameState.players[playerIndex].role?.name) {
                            // failed gamble
                            tempGameState = killPlayerByIndex(currentPlayer, tempGameState);
                            tempGameState.log.push({
                                type: 'severe',
                                message: `${gameState.players[currentPlayer].name} died!`,
                                indent: 1,
                            });
                            tempGameState.logBuffer.push({
                                type: 'severe',
                                message: `${gameState.players[currentPlayer].name} died!`,
                                indent: 1,
                            });
                        }
                        advanceTime(tempGameState, setGameState, currentPlayer, setCurrentPlayer, showPrompt);
                    }
                }
            }
        });
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

export function killPlayer(playerName: string, gameState: GameState) {
    return killPlayerByIndex(gameState.players.findIndex(player => player.name === playerName), gameState);
}

export function killPlayerByIndex(playerIndex: number, gameState: GameState): GameState {

    const tempGameState = { ...gameState };

    // FOOL, DRAGULF
    if (
        tempGameState.players[playerIndex].role?.name === 'Fool'
        || tempGameState.players[playerIndex].role?.name === 'Dragulf'
    ) {
        const player = tempGameState.players[playerIndex];
        if (player.abilityUses < (player.role?.abilityUses ?? 0)) {
            tempGameState.players[playerIndex].abilityUses += 1; // ability will be used
            if (!isPlayerIntoxicated(player, gameState)) {
                // cheat death
                tempGameState.log.push({
                    type: 'alert',
                    message: `${player.name} cheated death!`,
                    extra: `They are the ${tempGameState.players[playerIndex].role?.name}.`,
                });
                return tempGameState;
            }
            else {
                tempGameState.log.push({
                    type: 'alert',
                    message: `The ${tempGameState.players[playerIndex].role?.name} ability failed to activate.`,
                    extra: 'They were intoxicated.',
                });
            }
        }
    }

    // TEA LADY
    const neighbours = getPlayerNeighbours(tempGameState.players, playerIndex);
    const teaLadyNeighbour = neighbours.find(neighbour => {
        return (
            tempGameState.players[neighbour].role?.name === 'Tea Lady'
            && tempGameState.players[neighbour].alive
            && !isPlayerIntoxicated(tempGameState.players[neighbour], gameState)
        );
    });
    if (teaLadyNeighbour) {
        const teaNeighbours = getPlayerNeighbours(tempGameState.players, teaLadyNeighbour);
        if (teaNeighbours.every(neighbour => isPlayerEvil(tempGameState.players[neighbour], gameState) !== Result.TRUE)) {
            // Tea Lady can save this player
            tempGameState.log.push({
                type: 'alert',
                message: `${tempGameState.players[teaLadyNeighbour].name} saved ${tempGameState.players[playerIndex].name}!`,
                indent: 1,
            });
            return tempGameState; // no death
        }
    }

    // kill!
    tempGameState.players[playerIndex].alive = false;
    tempGameState.lastDeath = tempGameState.day;

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
                    if (isPlayerIntoxicated(tempGameState.players[scarletWomanIndex], gameState)) {
                        console.log('Scarlet Woman is intoxicated'); // this is currently impossible with the current roster
                    }
                    else {
                        // Scarlet Woman becomes the Werewolf
                        updateRole(tempGameState, scarletWomanIndex, werewolfRole);
                    }
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

function getPlayerNeighbours(players: Player[], playerIndex: number): number[] {
    const neighbours: number[] = [];
    const playerCount = players.length;

    for (let i = 1; i < playerCount; i++) {
        const leftIndex = (playerIndex - i + playerCount) % playerCount;
        if (players[leftIndex].alive) {
            if (leftIndex !== playerIndex) {
                neighbours.push(leftIndex);
            }
            break;
        }
    }
    for (let i = 1; i < playerCount; i++) {
        const rightIndex = (playerIndex + i) % playerCount;
        if (players[rightIndex].alive) {
            if (rightIndex !== playerIndex && !neighbours.includes(rightIndex)) {
                neighbours.push(rightIndex);
            }
            break;
        }
    }

    return neighbours;
}
