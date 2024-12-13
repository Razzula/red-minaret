import { GameState, Player } from "../App";
import { Role } from "../data/roles";
import { PlayerType, Team } from "../enums";

export enum Result {
    TRUE,
    FALSE,
    STORYTELLER, // sometimes, the storyteller has to make a decision
    NULL,
}

export function findPlayersNeighbours(gameState: GameState, currentPlayer: number): number[] {

    const neighbours = [];

    for (let i = 1; i < gameState.players.length; i++) {
        const neighbourIndex = (currentPlayer + i) % gameState.players.length;
        if (gameState.players[neighbourIndex].alive) {
            neighbours.push(neighbourIndex);
            break;
        }
    }
    for (let i = 1; i < gameState.players.length; i++) {
        const neighbourIndex = (currentPlayer - i < 0) ? currentPlayer - i + gameState.players.length : currentPlayer - i;
        if (gameState.players[neighbourIndex].alive) {
            neighbours.push(neighbourIndex);
            break;
        }
    }

    return neighbours;
}

export function countEvilPairs(gameState: GameState): number {

    let evilPairs = (
        gameState.players[0].role?.team === Team.EVIL &&
        gameState.players[gameState.players.length - 1].role?.team === Team.EVIL
    ) ? 1 : 0;

    let evil = Result.NULL;
    gameState.players.forEach(player => {
        if (player.alive) {
            const playerIsEvil = isPlayerEvil(player);
            if (playerIsEvil === Result.TRUE) {
                if (evil === Result.TRUE) {
                    evilPairs++;
                }
                evil = Result.TRUE;
            }
            else if (playerIsEvil === Result.STORYTELLER) {
                // XXX: in-built prompt; multiple triggers
                const decision = prompt(`Is ${player.name} evil? (Y/N)`);
                if (decision?.toLowerCase() === 'y') {
                    if (evil === Result.TRUE) {
                        evilPairs++;
                    }
                    evil = Result.TRUE;
                }
                else {
                    evil = Result.FALSE;
                }
            }
            else {
                evil = Result.FALSE;
            }
        }
    });
    return evilPairs;
}

export function getWerewolfBluffs(gameState: GameState, roles: Role[]): Role[] {
    return [...roles]
        .sort(() => Math.random() - 0.5)
        .filter(role =>
            role.team === Team.GOOD &&
            role.name !== 'Drunk' &&
            !gameState.players.find(p => p.role?.name === role.name)
        )
        .slice(0, 3)
}

export function isPlayerEvil(player: Player): Result {

    if (player.role) {
        if (player.role.team === Team.EVIL) {
            return Result.TRUE;
        }

        // RECLUSE
        if (player.role.name === 'Recluse') {
            return Result.STORYTELLER;
        }

        return Result.FALSE;
    }

    return Result.NULL;
}

export function isPlayerWerewolf(player: Player): Result {

    if (player.role) {
        if (player.role.type === PlayerType.WEREWOLF) {
            return Result.TRUE;
        }

        // RECLUSE
        if (player.role.name === 'Recluse') {
            return Result.STORYTELLER;
        }

        return Result.FALSE;
    }

    return Result.NULL;
}

export function isPlayerMinion(player: Player): Result {

    if (player.role) {
        if (player.role.type === PlayerType.MINION) {
            return Result.TRUE;
        }

        // RECLUSE
        if (player.role.name === 'Recluse') {
            return Result.STORYTELLER;
        }

        return Result.FALSE;
    }

    return Result.NULL;
}

export function isPlayerVillager(player: Player): Result {

    if (player.role) {
        if (player.role.type === PlayerType.VILLAGER) {
            return Result.TRUE;
        }

        return Result.FALSE;
    }

    return Result.NULL;
}

export function canPlayerActTonight(player: Player, gameState: GameState): boolean {

    const roleDelay = (player.role?.delay ?? 0) + 1;

    // RAVENKEEPER
    if (player.role?.name === 'Ravenkeeper') {
        if (player.alive || player.role?.abilityUses && player.abilityUses >= player.role?.abilityUses) {
            return false;
        }
    }
    // DEATH
    else if (!player.alive) {
        return false;
    }

    if (player.role?.night
        && (roleDelay <= gameState.day)
        && (player.role?.abilityUses === undefined || player.abilityUses < player.role?.abilityUses)
    ) {
        // UNDERTAKER
        if (player.role?.name === 'Undertaker') {
            return gameState.lastNight.lynched !== undefined;
        }
        return true;
    }
    else {
        return false;
    }

}

export function isPlayerDrunk(player: Player): boolean {
    return player.statuses.find(status => status.name === 'Drunk') !== undefined;
}

export function isPlayerPoisoned(player: Player): boolean {
    return player.statuses.find(status => status.name === 'Poisoned') !== undefined;
}

export function isPlayerIntoxicated(player: Player): boolean {
    return isPlayerDrunk(player) || isPlayerPoisoned(player);
}