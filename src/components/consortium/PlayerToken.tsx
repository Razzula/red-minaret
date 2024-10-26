import { GameState, Player } from "../../App";
import { Tooltip, TooltipContent, TooltipTrigger } from "../common/Tooltip";
import StatusToken from "./StatusToken";

type PlayerTokenProps = {
    player: Player;
    gameState: GameState;
    index: number;
    centreX: number;
    centreY: number;
    radius: number;
    currentPlayer: number | null;
    selectedPlayers: number[];
    togglePlayerAlive: (name: string) => void;
    handleClick: (event: React.MouseEvent<HTMLElement>, index: number) => void;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({player, gameState, index, centreX, centreY, radius, currentPlayer, selectedPlayers, togglePlayerAlive, handleClick}) => {

    const role = gameState.players[index].role;

    const angle = (index * 2 * Math.PI) / (gameState.players?.length || 0);
    const x = centreX + radius * Math.sin(angle);
    const y = centreY - radius * Math.cos(angle);

    const isActive = currentPlayer !== null && currentPlayer !== index ? 'inactive' : 'active';
    const isSelected = selectedPlayers.includes(index) ? 'selected' : 'unselected';
    const isAlive = player.alive ? 'alive' : 'dead';
    const isPendingExecution = gameState.choppingBlock === player.name ? 'pending-execution' : '';

    return (
        <div>
            <div className='player'
                style={{
                    left: `${x}px`,
                    top: `${y}px`,
                }}
            >
                <Tooltip enableClick={true} enableHover={false}>
                    <TooltipTrigger>
                        <button
                            className={`circle-button ${role?.team} ${isActive} ${isSelected} ${isAlive} ${isPendingExecution}`}
                            key={index}
                            disabled={role === undefined}
                            onClick={(e) => handleClick(e, index)}
                        >
                            <img
                                src={`/red-minaret/iconpack/${role?.icon}.png`}
                                alt={`${index + 1}`}
                                className={`circle-button-img`}
                            />
                        </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div>{player.role?.description}</div>
                            <div>
                                <button onClick={() => togglePlayerAlive(player.name)}>{player.alive ? 'kill' : 'revive'}</button>
                            </div>
                        </TooltipContent>
                </Tooltip>
                <span>{player.name}</span>
                { player.role &&
                    <span> ({player.role?.name})</span>
                }
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
                        isPlayerActive={isActive === 'active'}
                        playerRole={role}
                    />
                ))
            }
        </div>
    );
}

export default PlayerToken;