import { GameState } from "../App";
import { PromptOptions } from "../components/common/Prompt/Prompt";
import { PlayerType, PlayState } from "../enums";
import { isPlayerIntoxicated, isPlayerWerewolf, Result } from "./utils";

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

                if (isPlayerIntoxicated(hunter, gameState)) {
                    // POISONED
                    tempGameState.log.push({
                        type: 'alert',
                        message: `${target.name} survived!`,
                        indent: 1,
                        extra: `${hunter.name} was intoxicated.`,
                    });
                }
                else {
                    // kill the selected player, if they are evil
                    const isTargetWerewolf = isPlayerWerewolf(target, gameState);
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
