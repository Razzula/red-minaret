import classNames from 'classnames';

import { GameState, Player } from "../../App";
import { Tooltip, TooltipClickContent, TooltipContent, TooltipHoverContent, TooltipTrigger } from "../common";
import StatusToken from "./StatusToken";

import styles from './Consortium.module.scss';

type PlayerTokenProps = {
    player: Player;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    index: number;
    centreX: number;
    centreY: number;
    radius: number;
    currentPlayer: number | null;
    selectedPlayers: number[];
    togglePlayerAlive: (name: string) => void;
    handleClick: (event: React.MouseEvent<HTMLElement>, index: number) => void;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({player, gameState, setGameState, index, centreX, centreY, radius, currentPlayer, selectedPlayers, togglePlayerAlive, handleClick}) => {

    const role = gameState.players[index].role;

    const angle = (index * 2 * Math.PI) / (gameState.players?.length || 0);
    const x = centreX + radius * Math.sin(angle);
    const y = centreY - radius * Math.cos(angle);

    const isActive = currentPlayer !== null && currentPlayer !== index;
    const isSelected = selectedPlayers.includes(index);
    const isAlive = player.alive;
    const isPendingExecution = gameState.choppingBlock?.playerName === player.name;

    const teamStyle = role?.team
        ? (role.team.toLowerCase() === 'evil' ? styles.evil : styles.good)
        : null;

    function renamePlayer() {
        const newName = prompt('Enter new name:', player.realName || player.name);
        console.log(newName);
        if (newName) {
            const tempGameState = {...gameState};
            tempGameState.players[index].realName = newName;
            setGameState(tempGameState);
        }
    }

    return (
        <div>
            <div className={styles.player}
                style={{
                    left: `${x}px`,
                    top: `${y}px`,
                }}
            >
                <Tooltip enableClick={true} enableHover={true}>
                    <TooltipTrigger>
                        <button
                            className={classNames(
                              styles.circleButton,
                              teamStyle,
                              {
                                  [styles.inactive]: isActive,
                                  [styles.selected]: isSelected,
                                  [styles.dead]: !isAlive,
                                  [styles.pendingExecution]: isPendingExecution,
                              } as never)}
                            key={index}
                            disabled={role === undefined}
                            onClick={(e) => handleClick(e, index)}
                        >
                            <img
                                src={`/red-minaret/icons/${role?.icon}.png`}
                                alt={`${index + 1}`}
                                className={styles.circleButtonImg}
                            />
                        </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <TooltipHoverContent>
                                <div>{player.realName} ({player.name})</div>
                                <div><strong>{player.role?.name}</strong></div>
                                <div>{player.role?.description}</div>
                            </TooltipHoverContent>
                            <div>
                                <button onClick={() => togglePlayerAlive(player.name)}>{player.alive ? 'kill' : 'revive'}</button>
                                <button onClick={renamePlayer}>rename</button>
                            </div>
                        </TooltipContent>
                </Tooltip>
                <span>{player.realName} ({player.name})</span>
            </div>

            {
                player.statuses?.map((status, index) => (
                    <StatusToken key={index}
                        status={status}
                        index={index}
                        centreX={centreX}
                        centreY={centreY}
                        radius={radius}
                        angle={angle}
                        isPlayerActive={isActive}
                        playerRole={role}
                    />
                ))
            }
        </div>
    );
}

export default PlayerToken;
