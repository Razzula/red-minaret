import { useEffect, useState } from "react";
import { GameState, Player } from "../../App";
import { PlayerType, PlayState } from "../../enums";
import { countEvilPairs, findPlayersNeighbours, isPlayerDrunk, isPlayerEvil, isPlayerIntoxicated, isPlayerMarionette, isPlayerPoisoned, Result } from "../../game/utils";
import { PromptOptions } from "../common/Prompt/Prompt";
import { Tooltip, TooltipContent, TooltipTrigger } from "../common/Tooltip/Tooltip";

import styles from './Consortium.module.scss';
import classNames from "classnames";

type CentreInfoProps = {
    gameState: GameState;
    currentPlayer: number;
    players: Player[];
    selectedPlayers: number[];

    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>;
    setSelectionPopup: (title: string | null, params?: string[]) => void;
};

export const CentreInfo: React.FC<CentreInfoProps> = ({ gameState, currentPlayer, players, selectedPlayers, showPrompt, setSelectionPopup }) => {

    const [playerResult, setPlayerResult] = useState<string | null>(null);

    async function countEvilNeighbours() {
        // check neighbours (skip over dead players)
        const neighbours = findPlayersNeighbours(gameState, currentPlayer);
        return await countEvilSubset(neighbours, 'Empath');
    }

    async function countEvilSubset(playerIndexes: number[], source?: string): Promise<number> {
        let evilCount = 0;
        for (const playerIndex of playerIndexes) {
            const player = players[playerIndex];
            const playerIsEvil = isPlayerEvil(player, gameState, source === 'Seer');
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

        if (gameState.state !== PlayState.PLAYING || gameState.popupEvent !== undefined) {
            // game is not in progress, so no results
            return;
        }

        // SEER
        if (player.role?.name === 'Seer') {
            countEvilSubset(selectedPlayers, player.role?.name).then((result) => {
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
                players[selectedPlayers[0]].role?.name ?? 'Select Player'
            ) : 'Select Player';
            setPlayerResult(playerResult);
        }
        // UNDERTAKER
        else if (player.role?.name === 'Undertaker') {
            playerResult = gameState.lastNight.lynched ? (players[gameState.lastNight.lynched].role?.name ?? 'Select Player') : 'Select Player';
            setPlayerResult(playerResult);
        }
        // CHEF
        else if (player.role?.name === 'Chef') {
            countEvilPairs(gameState, showPrompt).then((result) => {
                setPlayerResult(result.toString());
            });
        }
        // SPY
        else if (player.role?.name === 'Spy') {
            playerResult = selectedPlayers.length === 1 ? (gameState.players[selectedPlayers[0]].trueRole?.name ?? 'Select Player') : 'Select Player';
            setPlayerResult(playerResult);
            setSelectionPopup('Show Spy Result', [playerResult]);
        }
        // TOWN CRIER
        else if (player.role?.name === 'Town Crier') {
            const nominatingPlayers = gameState.players.filter(
                (player) => gameState.nominators.includes(player.name)
            ).map(
                (player) => gameState.players.indexOf(player)
            );

            const numberOfMinions = nominatingPlayers.filter(
                (index) => gameState.players[index].role?.type === PlayerType.MINION
            ).length;

            setPlayerResult(numberOfMinions > 0 ? 'Yes' : 'No');
        }
        else {
            setPlayerResult('Select Player');
            setSelectionPopup(null);
        }

    }, [currentPlayer, players, selectedPlayers, showPrompt]);

    const isDrunk = isPlayerDrunk(players[currentPlayer]);
    const isPoisoned = isPlayerPoisoned(players[currentPlayer]);
    const isMarionette = isPlayerMarionette(players[currentPlayer]);
    const isIntoxicated = isPlayerIntoxicated(players[currentPlayer], gameState);

    const token = (
        <span
            className={classNames(
                styles.circleButton,
                {
                    [styles.intoxicated]: isIntoxicated,
                }
            )}
            style={{
                width: '100px',
                height: '100px',
            }}
        >
            {isDrunk &&
                <div><strong>Drunk!</strong></div>
            }
            {isPoisoned &&
                <div><strong>Poisoned!</strong></div>
            }
            {isMarionette &&
                <div><strong>Marionette!</strong></div>
            }

            <div className={classNames(
                { 'severe': isIntoxicated }
            )}>
                {playerResult}
            </div>
        </span>
    );

    if (!isIntoxicated) {
        return token;
    }

    // add additional information in special cases
    return (
        <Tooltip enableHover={true}>
            <TooltipTrigger>
                {token}
            </TooltipTrigger>
            <TooltipContent>
                You should give this player intentionally unhelpful information.
            </TooltipContent>
        </Tooltip>
    );

};

export default CentreInfo;
