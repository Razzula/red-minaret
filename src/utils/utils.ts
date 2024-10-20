import { GameState } from "../App";

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
