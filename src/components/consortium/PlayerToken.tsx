import classNames from 'classnames';

import { GameState, Player } from "../../App";
import { Tooltip, TooltipContent, TooltipHoverContent, TooltipTrigger } from "../common";
import StatusToken from "./StatusToken";

import styles from './Consortium.module.scss';
import { PlayState, Team } from '../../enums';
import PseudonymToken from './PseudonymToken';
import GridList from '../common/GridList/GridList';
import roles from '../../data/roles';
import CheckButton from '../common/CheckButton/CheckButton';
import statuses, { Status } from '../../data/statuses';

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

    villagerPool: number[];
    outsiderPool: number[];
    werewolfPool: number[];
    minionPool: number[];
}

const PlayerToken: React.FC<PlayerTokenProps> = ({
    player, gameState, setGameState, index, centreX, centreY, radius, currentPlayer, selectedPlayers,
    togglePlayerAlive, handleClick, removePlayer, setCurrentPlayer,
    villagerPool, outsiderPool, werewolfPool, minionPool,
}) => {

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

    function setPseudonym(pseudonym: string) {
        const tempGameState = {...gameState};
        const existingPlayer = tempGameState.players.findIndex((p) => p.name === pseudonym);
        if (existingPlayer !== -1) {
            // swap names
            tempGameState.players[existingPlayer].name = player.name;
        }
        tempGameState.players[index].name = pseudonym;
        setGameState(tempGameState);
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

    function setPlayerRole(roleName: string) {
        const role = roles.find((role) => role.name === roleName);
        if (role) {
            const tempGameState = {...gameState};
            tempGameState.players[index].role = role;
            setGameState(tempGameState);
        }
    }

    function roleSettingsPanel(rolePool: number[]) {
        return rolePool.map((roleIndex) => (
            <CheckButton
                key={roleIndex}
                image={`/red-minaret/icons/${roles[roleIndex].icon}.png`} altText={roles[roleIndex].name}
                isChecked={player.role?.name === roles[roleIndex].name}
                onChange={() => setPlayerRole(roles[roleIndex].name)}
            />
        ));
    }

    function assignStatusToPlayer(status: Status) {
        const tempGameState = {...gameState};
        const playerStatuses = tempGameState.players[index].statuses || [];
        playerStatuses.push(status);
        tempGameState.players[index].statuses = playerStatuses;
        setGameState(tempGameState);
    }

    function statusSettingsPanel(statuses: Status[]) {
        return statuses.map((status) => (
            <CheckButton
                key={status.name}
                image={`/red-minaret/icons/${status.icon}.png`} altText={status.name}
                isChecked={false}
                onChange={() => assignStatusToPlayer(status)}
            />
        ));
    }

    function removeStatus(status: Status) {
        const tempGameState = {...gameState};
        const playerStatuses = tempGameState.players[index].statuses || [];
        const statusIndex = playerStatuses.findIndex((s) => s.name === status.name);
        if (statusIndex !== -1) {
            playerStatuses.splice(statusIndex, 1);
            tempGameState.players[index].statuses = playerStatuses;
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
                                <div
                                    style={{
                                        maxWidth: '500px',
                                    }}
                                >
                                    <div><strong>{player.role?.name}</strong></div>
                                    <div>{player.role?.description}</div>
                                </div>
                            </TooltipHoverContent>
                            <div>
                                {/* HOTBAR */}
                                { gameState.state === PlayState.SETUP &&
                                    <span>
                                        <Tooltip>
                                            <TooltipTrigger>

                                                <Tooltip enableClick={true} enableHover={false}>
                                                    <TooltipTrigger>
                                                        <button onClick={() => {}}><i className='ra ra-spades-card' /></button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <GridList columns={6}>{ roleSettingsPanel(villagerPool) }</GridList>
                                                        <hr />
                                                        <GridList columns={6}>{ roleSettingsPanel(outsiderPool) }</GridList>
                                                        <hr />
                                                        <GridList columns={6}>{ roleSettingsPanel(werewolfPool) }</GridList>
                                                        <hr />
                                                        <GridList columns={6}>{ roleSettingsPanel(minionPool) }</GridList>
                                                    </TooltipContent>
                                                </Tooltip>

                                            </TooltipTrigger>
                                            <TooltipContent>Assign Role</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger>
                                                <button onClick={() => removePlayer(player.name)}><i className='ra ra-cancel' /></button>
                                            </TooltipTrigger>
                                            <TooltipContent>Remove Player</TooltipContent>
                                        </Tooltip>
                                    </span>
                                }

                                <Tooltip>
                                    <TooltipTrigger>

                                        <Tooltip enableClick={true} enableHover={false}>
                                            <TooltipTrigger>
                                                <button onClick={() => {}}><i className='ra ra-round-bottom-flask' /></button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <GridList columns={6}>
                                                    { statusSettingsPanel(Object.values(statuses)) }
                                                </GridList>
                                            </TooltipContent>
                                        </Tooltip>

                                    </TooltipTrigger>
                                    <TooltipContent>Assign Status</TooltipContent>
                                </Tooltip>

                                { gameState.state !== PlayState.SETUP &&
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button onClick={() => togglePlayerAlive(player.name)}>
                                                <i className={player.alive ? 'ra ra-broken-skull' : 'ra ra-angel-wings'} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>{player.alive ? 'Kill' : 'Revive'}</TooltipContent>
                                    </Tooltip>
                                }
                                { gameState.state !== PlayState.SETUP && gameState.time !== 0 && player.role?.name === 'Hunter' &&
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button
                                                onClick={() => enterSpecialState('Hunter')}
                                                disabled={player.role.abilityUses !== undefined && player.abilityUses >= player.role.abilityUses}
                                            >
                                                <img src={`/red-minaret/icons/${player.role.icon}.png`} alt='Hunter Ability' />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Shoot</TooltipContent>
                                    </Tooltip>
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
                        removeStatus={removeStatus}
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
                    setPseudonym={setPseudonym}
                />

        </div>
    );
}

export default PlayerToken;
