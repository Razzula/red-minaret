import classNames from 'classnames';

import { GameState, Player } from "../../App";
import { Tooltip, TooltipContent, TooltipHoverContent, TooltipTrigger } from "../common";
import StatusToken from "./StatusToken";

import styles from './Consortium.module.scss';
import { PlayState, Team } from '../../enums';
import PseudonymToken from './PseudonymToken';

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
    removePlayer: (name: string) => void;
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({ player, gameState, setGameState, index, centreX, centreY, radius, currentPlayer, selectedPlayers, togglePlayerAlive, handleClick, removePlayer, setCurrentPlayer }) => {

    const role = gameState.players[index].role;
    const circleDiameter = 100;

    const angle = (index * 2 * Math.PI) / (gameState.players?.length || 0);
    const x = centreX + (radius - circleDiameter) * Math.sin(angle);
    const y = centreY - (radius - circleDiameter) * Math.cos(angle);

    const isActive = currentPlayer !== null && currentPlayer !== index;
    const isSelected = selectedPlayers.includes(index);
    const isAlive = player.alive;
    const isPendingExecution = gameState.choppingBlock?.playerName === player.name;

    const teamStyle = role?.team
        ? (role.team === Team.EVIL ? styles.evil : styles.good)
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

    function enterSpecialState(specialState: string) {
        setGameState((prev) => ({
            ...prev,
            state: PlayState.SPECIAL,
            special: {
                state: specialState,
                previous: prev.state,
            }
        }));

        const currentPlayerIndex = gameState.players.findIndex((p) => p.name === player.name);
        if (currentPlayerIndex !== -1) {
            setCurrentPlayer(currentPlayerIndex);
        }
    }

    function getCursorIconFromCurrentPlayer() {
        if (currentPlayer === null) {
            return 'pointer';
        }
        const currentPlayerRole = gameState.players[currentPlayer].role;
        if (currentPlayerRole !== undefined && (
                gameState.time !== 0 || currentPlayerRole?.night !== undefined
            )
        ) {
            return `url('/red-minaret/icons/${currentPlayerRole.icon}.png'), pointer`;
        }
        return 'not-allowed';
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
                            style={{
                                cursor: getCursorIconFromCurrentPlayer(),
                            }}
                            key={index}
                            onClick={(e) => handleClick(e, index)}
                        >
                            <img
                                src={`/red-minaret/icons/${role?.icon}.png`}
                                alt={`${role?.name ?? 'no role'}`}
                                className={styles.circleButtonImg}
                            />
                        </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <TooltipHoverContent>
                                <div><strong>{player.role?.name}</strong></div>
                                <div>{player.role?.description}</div>
                            </TooltipHoverContent>
                            <div>
                                {/* HOTBAR */}
                                { gameState.state === PlayState.SETUP &&
                                    <span>
                                        <button onClick={() => {}}>assign role</button>
                                        <button onClick={() => removePlayer(player.name)}>remove player</button>
                                    </span>
                                }
                                { gameState.state !== PlayState.SETUP &&
                                    <button onClick={() => togglePlayerAlive(player.name)}>{player.alive ? 'kill' : 'revive'}</button>
                                }
                                { gameState.state !== PlayState.SETUP && gameState.time !== 0 && player.role?.name === 'Hunter' &&
                                    <button
                                        onClick={() => enterSpecialState('Hunter')}
                                        disabled={player.role.abilityUses !== undefined && player.abilityUses >= player.role.abilityUses}
                                    >shoot</button>
                                }
                            </div>
                        </TooltipContent>
                </Tooltip>
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

                <PseudonymToken
                    pseudonym={player.name}
                    realName={player.realName}
                    centreX={centreX}
                    centreY={centreY}
                    radius={radius}
                    angle={angle}
                    renamePlayer={renamePlayer}
                />

        </div>
    );
}

export default PlayerToken;
