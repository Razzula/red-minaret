import classNames from 'classnames';

import { GameState, Player, Settings } from '../../App';
import { Tooltip, TooltipClickContent, TooltipContent, TooltipHoverContent, TooltipTrigger } from '../common/Tooltip/Tooltip';
import StatusToken from './StatusToken';

import styles from './Consortium.module.scss';
import { PlayState, Team } from '../../enums';
import PseudonymToken from './PseudonymToken';
import GridList from '../common/GridList/GridList';
import roles from '../../data/roles';
import CheckButton from '../common/CheckButton/CheckButton';
import statuses, { Status } from '../../data/statuses';
import { canPlayerActTonight, getWerewolfBluffs, setRole } from '../../game/utils';
import IconButton from '../common/IconButton/IconButton';
import { PromptOptions } from '../common/Prompt/Prompt';
import { handleArtistAbility } from '../../game/Artist';

type PlayerTokenProps = {
    player: Player;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    index: number;
    centreX: number;
    centreY: number;
    centrepieceRadius: number;
    consortiumRadius: number;
    currentPlayer: number | null;
    selectedPlayers: number[];
    settings: Settings;
    togglePlayerAlive: (name: string) => void;
    handleClick: (event: React.MouseEvent<HTMLElement>, index: number) => void;
    removePlayer: (name: string) => void;
    setCurrentPlayer: React.Dispatch<React.SetStateAction<number | null>>;

    villagerPool: number[];
    outsiderPool: number[];
    werewolfPool: number[];
    minionPool: number[];

    showPrompt: (opts: PromptOptions) => Promise<string | boolean | null>;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({
    player, gameState, setGameState, index, centreX, centreY, centrepieceRadius, consortiumRadius, currentPlayer, selectedPlayers,
    settings,
    togglePlayerAlive, handleClick, removePlayer, setCurrentPlayer,
    villagerPool, outsiderPool, werewolfPool, minionPool,
    showPrompt,
}) => {

    const isMobile = (typeof window !== 'undefined') && (window.innerWidth <= 767);

    const trueRole = player.trueRole || player.role;
    const role = gameState.players[index].role;

    const roleTrueName = settings.useOriginalNames ? (trueRole?.altName ?? trueRole?.name) : trueRole?.name;
    const roleName = settings.useOriginalNames ? (role?.altName ?? role?.name) : role?.name;
    const roleDisplayName = (roleTrueName !== roleName) ? `${roleTrueName} ${roleName}` : roleName;

    const circleDiameter = isMobile ? 60 : 100;
    const circleRadius = circleDiameter / 2;
    const padding = isMobile ? 5 : 40;

    const angle = (index * 2 * Math.PI) / (gameState.players?.length || 0);
    const x = centreX + (consortiumRadius - circleRadius - padding) * Math.sin(angle);
    const y = centreY - (consortiumRadius - circleRadius - padding) * Math.cos(angle);

    const isActive = currentPlayer === index;
    const isInactive = currentPlayer !== null && currentPlayer !== index;
    const isSelected = selectedPlayers.includes(index);
    const isAlive = player.alive;
    const isPendingExecution = gameState.choppingBlock?.playerName === player.name;

    const teamStyle = role?.team
        ? (role.team === Team.EVIL ? styles.evil : styles.good)
        : null;

    async function renamePlayer() {
        const newName = await showPrompt({
            title: 'Enter new name:',
            type: 'text',
            confirmText: 'Rename',
            cancelText: 'Cancel',
            message: player.realName || player.name,
        });

        if (newName !== null && typeof newName === 'string') {
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
            const playerCanAct = canPlayerSelectTonight(gameState.players[currentPlayer]);
            return playerCanAct ? `url('/red-minaret/icons/${currentPlayerRole.icon}.png'), pointer` : 'not-allowed';
        }
        return 'not-allowed';
    }

    function setPlayerRole(roleName: string) {
        const role = roles.find((role) => role.name === roleName);
        if (role) {
            const tempGameState = {...gameState};

            if (roleName === 'Drunk') {
                setRole(tempGameState, index, role, role);
                tempGameState.players[index].statuses.push({...statuses.Drunk});
            }
            else {
                setRole(tempGameState, index, role);
            }

            // update bluffs
            tempGameState.bluffs = getWerewolfBluffs(tempGameState, roles);

            setGameState(tempGameState);
        }
    }

    function roleSelectionPanel(rolePool: number[]) {
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
        playerStatuses.push({...status});
        tempGameState.players[index].statuses = playerStatuses;
        setGameState(tempGameState);
    }

    function statusSettingsPanel(statuses: Status[]) {
        return statuses.map((status) => (
            <Tooltip>
                <TooltipTrigger>
                    <CheckButton
                        key={status.name}
                        image={`/red-minaret/icons/${status.icon}.png`} altText={status.name}
                        isChecked={false}
                        onChange={() => assignStatusToPlayer(status)}
                    />
                </TooltipTrigger>
                <TooltipContent maxWidth={300}>
                    <strong>{status.name}</strong>
                    <div>{status.description}</div>
                </TooltipContent>
            </Tooltip>
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

    function onClick(event: React.MouseEvent<HTMLElement>,  index: number) {
        if (currentPlayer === null) {
            return;
        }
        if (canPlayerSelectTonight(gameState.players[currentPlayer])) {
            event.stopPropagation();
            handleClick(event, index);
        }
    }

    function canPlayerSelectTonight(player: Player) {
        if (gameState.time === 0) { // night
            return (
                canPlayerActTonight(player, gameState)
                && player.role?.name !== 'Empath'
                && player.role?.name !== 'Chef'
            );
        }
        return true;
    }

    return (
        <div>
            <div className={styles.player}
                style={{
                    position: 'absolute',
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
                                    [styles.inactive]: isInactive,
                                    [styles.active]: isActive,
                                    [styles.selected]: isSelected,
                                    [styles.dead]: !isAlive,
                                    [styles.pendingExecution]: isPendingExecution,
                                } as never)}
                            style={{
                                cursor: getCursorIconFromCurrentPlayer(),
                            }}
                            key={index}
                            onClick={(e) => onClick(e, index)}
                        >
                            { role ?
                                <img
                                    src={`/red-minaret/icons/${role?.icon}.png`}
                                    alt={`${role?.name ?? 'no role'}`}
                                    className={styles.circleButtonImg}
                                />
                                :
                                <i className='ra ra-help' />
                            }
                        </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <TooltipHoverContent>
                                <div>
                                    <div><strong>{roleDisplayName}</strong></div>
                                    <div>{player.role?.description || <i>No Role Assigned</i>}</div>
                                </div>
                                { isPendingExecution &&
                                    <div className='evil'>
                                        <hr />
                                        <i>
                                            This player is flagged for execution!
                                            They will be lynched tonight, unless another player is nominated with <strong>{gameState.choppingBlock?.votes}</strong> or more votes.
                                        </i>
                                    </div>
                                }
                                { !isAlive &&
                                    <div>
                                        <div className='evil'>
                                            <hr />
                                            <i>This player is dead!</i>
                                        </div>
                                        <div className='private'>They have {player.ghostVotes} vote{player.ghostVotes === 1 ? '' : 's'} remaining.</div>
                                    </div>
                                }
                            </TooltipHoverContent>
                            <div>
                                { player.oldRoles.length > 0 &&
                                    <div>
                                        <hr />
                                        <div><strong>Previous Roles:</strong></div>
                                        <div>{player.oldRoles.map(role=>
                                            <img
                                                key={role.name}
                                                src={`/red-minaret/icons/${role.icon}.png`}
                                                alt={role.name}
                                                className={styles.circleButtonImg}
                                            />
                                        )}</div>
                                    </div>
                                }

                                <hr />
                                {/* HOTBAR */}
                                { gameState.state === PlayState.SETUP &&
                                    <span>
                                        <IconButton
                                            icon={<i className='ra ra-spades-card' />}
                                            label={[
                                                    <TooltipHoverContent>Assign Role</TooltipHoverContent>,
                                                    <TooltipClickContent>
                                                            <GridList columns={6}>{ roleSelectionPanel(villagerPool) }</GridList>
                                                            <hr />
                                                            <GridList columns={6}>{ roleSelectionPanel(outsiderPool) }</GridList>
                                                            <hr />
                                                            <GridList columns={6}>{ roleSelectionPanel(werewolfPool) }</GridList>
                                                            <hr />
                                                            <GridList columns={6}>{ roleSelectionPanel(minionPool) }</GridList>
                                                    </TooltipClickContent>
                                            ]}
                                        />

                                        <IconButton
                                            icon={<i className='ra ra-cancel' />}
                                            onClick={() => removePlayer(player.name)}
                                            label='Remove Player'
                                        />
                                    </span>
                                }

                                <IconButton
                                    icon={<i className='ra ra-round-bottom-flask' />}
                                    label={[
                                        <TooltipHoverContent>Assign Status</TooltipHoverContent>,
                                        <TooltipClickContent>
                                            <GridList columns={6}>
                                                { statusSettingsPanel(Object.values(statuses)) }
                                            </GridList>
                                        </TooltipClickContent>
                                    ]}
                                />

                                { gameState.state !== PlayState.SETUP &&
                                    <IconButton
                                        icon={<i className={player.alive ? 'ra ra-skull' : 'ra ra-angel-wings'} />}
                                        onClick={() => togglePlayerAlive(player.name)}
                                        label={player.alive ? 'Kill' : 'Revive'}
                                    />
                                }
                                { gameState.state !== PlayState.SETUP && gameState.time !== 0 && player.role?.name === 'Hunter' &&
                                    <IconButton
                                        icon={<img src={`/red-minaret/icons/${player.role.icon}.png`} alt='Hunter Ability' />}
                                        onClick={() => enterSpecialState('Hunter')}
                                        disabled={player.role.abilityUses !== undefined && player.abilityUses >= player.role.abilityUses}
                                        label='Shoot'
                                    />
                                }
                                { gameState.state !== PlayState.SETUP && gameState.time !== 0 && player.role?.name === 'Artist' &&
                                    <IconButton
                                        icon={<img src={`/red-minaret/icons/${player.role.icon}.png`} alt='Hunter Ability' />}
                                        onClick={() => handleArtistAbility(gameState, setGameState, showPrompt)}
                                        disabled={player.role.abilityUses !== undefined && player.abilityUses >= player.role.abilityUses}
                                        label='Question the Storyteller'
                                    />
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
                        centrepieceRadius={centrepieceRadius}
                        playerX={x}
                        playerY={y}
                        consortiumRadius={consortiumRadius}
                        playerRadius={circleRadius}
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
                    playerX={x}
                    playerY={y}
                    playerRadius={circleRadius}
                    padding={padding}
                    angle={angle}
                    renamePlayer={renamePlayer}
                    setPseudonym={setPseudonym}
                />

        </div>
    );
}

export default PlayerToken;
