import { useEffect, useState } from "react";
import { GameState, Player } from "../../App";
import { PlayerType } from "../../enums";
import { countEvilPairs, findPlayersNeighbours, isPlayerEvil, Result } from "../../game/utils";
import { PromptOptions } from "../common/Prompt/Prompt";
import { Tooltip, TooltipContent, TooltipTrigger } from "../common/Tooltip/Tooltip";

import styles from './Consortium.module.scss';

type CentreInfoProps = {
    gameState: GameState;
    currentPlayer: number;
    players: Player[];
    selectedPlayers: number[];

    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>;
};

export const CentreInfo: React.FC<CentreInfoProps> = ({ gameState, currentPlayer, players, selectedPlayers, showPrompt }) => {

    const [playerResult, setPlayerResult] = useState<string | null>(null);

    async function countEvilNeighbours(){
        // check neighbours (skip over dead players)
        const neighbours = findPlayersNeighbours(gameState, currentPlayer);
        return await countEvilSubset(neighbours, 'Empath');
    }

    async function countEvilSubset(playerIndexes: number[], source?: string): Promise<number> {
        let evilCount = 0;
        for (const playerIndex of playerIndexes) {
            const player = players[playerIndex];
            const playerIsEvil = isPlayerEvil(player, source === 'Seer');
            if (playerIsEvil === Result.TRUE) {
                evilCount++;
            }
            else if (playerIsEvil === Result.STORYTELLER) {
                // sometimes it is the storyteller's choice whether a player is Evil
                const extras = [];
                if (source !== undefined) {
                    extras.push(`This will affect the number of Evil players detected by the ${source}.`);
                }
                if (player.role?.type === PlayerType.OUTSIDER) {
                    extras.push('As an Outsider, you should ideally choose what would be most detrimental to the Villagers.');
                }

                const storytellerChoice = await showPrompt({
                    title: 'Storyteller Decision',
                    message: `${player.name} is the ${player.role?.name}. Do they ping as Evil?`,
                    extras: extras,
                    type: 'bool',
                    confirmText: 'Not Evil',
                    cancelText: 'Evil',
                });
                if (storytellerChoice === null) {
                    evilCount++;
                }
            }
        }
        return evilCount;
    }

    useEffect(() => {

        const player = players[currentPlayer];
        let playerResult: string;

        if (player.statuses.find((status) => status.name === 'Drunk')) {
            setPlayerResult('Drunk!');
        }
        else if (player.statuses.find((status) => status.name === 'Poisoned')) {
            setPlayerResult('Poisoned!');
        }
        else {
            // SEER
            if (player.role?.name === 'Seer') {
                countEvilSubset(selectedPlayers, 'Seer').then((result) => {
                    setPlayerResult(result.toString());
                });
            }
            // EMPATH
            else if (player.role?.name === 'Empath') {
                countEvilNeighbours().then((result) => {
                    setPlayerResult(result.toString());
                });
            }
            // RAVENKEEPER
            else if (player.role?.name === 'Ravenkeeper') {
                playerResult = selectedPlayers.length > 0 ? (
                    players[selectedPlayers[0]].role?.name ?? ''
                ) : '';
                setPlayerResult(playerResult);
            }
            // UNDERTAKER
            else if (player.role?.name === 'Undertaker') {
                playerResult = gameState.lastNight.lynched ? (players[gameState.lastNight.lynched].role?.name ?? '') : '';
                setPlayerResult(playerResult);
            }
            // CHEF
            else if (player.role?.name === 'Chef') {
                countEvilPairs(gameState, showPrompt).then((result) => {
                    setPlayerResult(result.toString());
                });
            }
            else {
                return;
            }
        }

    }, [currentPlayer, gameState, players, selectedPlayers, showPrompt]);

    const token = (
        <span
            className={styles.circleButton}
            style={{
                width: '100px',
                height: '100px',
            }}
        >
            {playerResult}
        </span>
    );

    if (playerResult !== 'Drunk!' && playerResult !== 'Poisoned!') {
        return token;
    }

    // add additional information in special cases
    return (
        <Tooltip enableHover={true}>
            <TooltipTrigger>
                {token}
            </TooltipTrigger>
            <TooltipContent>
                This player is {playerResult} You should give them intentionally unhelpful information.
            </TooltipContent>
        </Tooltip>
    );

};

export default CentreInfo;
