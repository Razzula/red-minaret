import { GameState, Player } from "../../App";
import { Team } from "../../enums";
import { countEvilPairs, findPlayersNeighbours } from "../../game/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../common/Tooltip/Tooltip";

import styles from './Consortium.module.scss';

type CentreInfoProps = {
    gameState: GameState;
    currentPlayer: number;
    players: Player[];
    selectedPlayers: number[];
};

export const CentreInfo: React.FC<CentreInfoProps> = ({ gameState, currentPlayer, players, selectedPlayers }) => {

    const player = players[currentPlayer];
    let playerResult: string;

    if (player.statuses.find((status) => status.name === 'Drunk')) {
        playerResult = 'Drunk!';
    }
    else if (player.statuses.find((status) => status.name === 'Poisoned')) {
        playerResult = 'Poisoned!';
    }
    else {
        // SEER
        if (player.role?.name === 'Seer') {
            // if a selected player is evil or the red herring, then the player sees evil
            playerResult = selectedPlayers.length > 0 ? (
                selectedPlayers.find((index) =>
                    players[index].role?.team === Team.EVIL || players[index].statuses.find((status) => status.name === 'Red Herring')
                ) !== undefined ? Team.EVIL : Team.GOOD
            ) : '';
        }
        // EMPATH
        else if (player.role?.name === 'Empath') {
            let evilCount = 0;
            // check neighbours (skip over dead players)
            const neighbours = findPlayersNeighbours(gameState, currentPlayer);
            for (const neighbour of neighbours) {
                if (gameState.players[neighbour].role?.team === Team.EVIL) {
                    evilCount++;
                }
            }
            playerResult = evilCount.toString();
        }
        // RAVENKEEPER
        else if (player.role?.name === 'Ravenkeeper') {
            playerResult = selectedPlayers.length > 0 ? (
                players[selectedPlayers[0]].role?.name ?? ''
            ) : '';
        }
        // UNDERTAKER
        else if (player.role?.name === 'Undertaker') {
            playerResult = gameState.lastNight.lynched ? (players[gameState.lastNight.lynched].role?.name ?? '') : '';
        }
        // CHEF
        else if (player.role?.name === 'Chef') {
            playerResult = countEvilPairs(gameState).toString();
        }
        else {
            return null;
        }
    }

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
