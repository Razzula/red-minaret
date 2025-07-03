import roles, { Role } from "../data/roles";
import { GameState } from "../App";
import { PlayState } from "../enums";
import { isPlayerEvil, Result, updateRole } from "./utils";

export async function HandleFarmerAbility(
    gameState: GameState, selectedPlayers: number[],
    setGameState: React.Dispatch<React.SetStateAction<GameState>>, setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>, setSelectedPlayers: React.Dispatch<React.SetStateAction<number[]>>,
) {
    // FARMER
    if (gameState.state === PlayState.SPECIAL && gameState.special?.state === 'Farmer') {

        const tempGameState = { ...gameState };

        const farmerRole = roles.find(role => role.name === 'Farmer');

        selectedPlayers.forEach((playerIndex) => {
            const player = tempGameState.players[playerIndex];
            if (player && player.alive && isPlayerEvil(player) !== Result.TRUE) {
                updateRole(tempGameState, playerIndex, {...farmerRole} as Role);
            }
        });

        // revert state
        tempGameState.state = tempGameState.special?.previous || PlayState.SETUP;
        tempGameState.special = undefined;

        setGameState(tempGameState);
        setCurrentPlayer(null);
        setSelectedPlayers([]);
    }
}
