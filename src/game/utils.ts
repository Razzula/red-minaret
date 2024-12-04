import { GameState } from "../App";
import { Role } from "../data/roles";
import { Team } from "../enums";

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