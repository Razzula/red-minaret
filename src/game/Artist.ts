import { GameState, LogEvent } from "../App";
import { PromptOptions } from "../components/common/Prompt/Prompt";
import { isPlayerDrunk, isPlayerIntoxicated } from "./utils";

export function handleArtistAbility(
    gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>
) {
    const artistIndex = gameState.players.findIndex(player => player.role?.name === 'Artist');
    if (artistIndex === -1) {
        return;
    }
    const artist = gameState.players[artistIndex];
    if (artist.abilityUses >= (artist.role?.abilityUses || 0)) {
        return;
    }

    showPrompt({
        title: 'Artist Ability',
        message: `The Artist may ask a yes/no question.`,
        extras: isPlayerIntoxicated(artist, gameState) ? [`The Artist is ${isPlayerDrunk(artist) ? 'Drunk' : 'Posioned'}. You must lie.`] : ['You must answer truthfully.'],
        type: 'text',
        confirmText: 'Yes',
        cancelText: 'No',
    }).then((result) => {
        const tempGameState = { ...gameState };
        const log: LogEvent[] = [
            {
                type: 'private',
                message: `The Artist asked: ${result ?? '???'}.`,
            },
            {
                type: 'private',
                message: `The answer was: ${result !== null ? 'Yes' : 'No'}.`,
                extra: isPlayerIntoxicated(artist, tempGameState) ? 'The Artist was intoxicated.' : undefined,
                indent: 1,
            },
        ];
        tempGameState.log.push(...log);
        tempGameState.players[artistIndex].knowledge.push(...log);
        tempGameState.players[artistIndex].abilityUses += 1;
        setGameState(tempGameState);
    });

}