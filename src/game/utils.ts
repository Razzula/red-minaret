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
