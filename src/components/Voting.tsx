import { useEffect, useState } from 'react';

import { GameState, LogEvent, Player } from '../App';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip/Tooltip';
import { DialogueClose, useDialogueContext } from './common/Dialogue/Dialogue';
import { enactVote } from '../game/core';
import { Team } from '../enums';
import CheckButton from './common/CheckButton/CheckButton';
import GridList from './common/GridList/GridList';

import styles from './consortium/Consortium.module.scss';
import { isPlayerIntoxicated, isPlayerPoisoned, isPlayerVillager, Result } from '../game/utils';
import statuses from '../data/statuses';

type VotingProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;

    togglePlayerAlive: (index: string) => void;
    setVotingAllowed: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Voting({
    gameState, setGameState,
    setVotingAllowed
}: VotingProps) {

    const [voting, setVoting] = useState<boolean>(false);

    const [nominatedPlayer, setNominatedPlayer] = useState<string>();
    const [nominatingPlayer, setNominatingPlayer] = useState<string>();

    const zealot = gameState.players.find(player => player.alive && player.role?.name === 'Zealot');

    const [votes, setVotes] = useState<Record<string, boolean>>(getEligibleVoters());

    const { setOpen } = useDialogueContext();

    useEffect(() => {
        if (voting && nominatedPlayer) { // player nominated

            // VIRGIN
            const nominated = gameState.players.find(player => player.name === nominatedPlayer);
            const isNominatedDrunk = isPlayerIntoxicated(nominated);
            if (!isNominatedDrunk && nominatingPlayer != undefined && nominated?.role?.name === 'Virgin') {
                if (nominated.role.abilityUses != undefined && nominated.abilityUses < nominated.role.abilityUses) {
                    const nominator = gameState.players.find(player => player.name === nominatingPlayer);
                    const tempGameState = { ...gameState };

                    const nominatedIndex = gameState.players.findIndex(player => player.name === nominated.name);
                    tempGameState.players[nominatedIndex].abilityUses += 1;

                    if (nominator && isPlayerVillager(nominator) === Result.TRUE) {

                        endVote();
                        setVotingAllowed(false);

                        const nominatorIndex = gameState.players.findIndex(player => player.name === nominator.name);
                        tempGameState.players[nominatorIndex].alive = false;

                        // game log
                        const log: LogEvent[] = [
                            {
                                type: 'public',
                                message: `${nominatingPlayer} nominated ${nominatedPlayer}`,
                            },
                            {
                                type: 'severe',
                                message: `${nominatingPlayer} has died!`,
                                indent: 1,
                                extra: `${nominatedPlayer} was the Virgin.`,
                            }
                        ];
                        tempGameState.log = [...tempGameState.log, ...log];
                        // alert
                        tempGameState.popupEvent = {
                            heading: `${nominatingPlayer} has died!`,
                            message: `${nominatedPlayer} was the Virgin.`,
                            events: log,
                        }

                    }
                    else {
                        tempGameState.log.push({
                            type: 'alert',
                            message: `${nominatedPlayer}'s Virgin ability has been exhuasted.`,
                            extra: `${nominatingPlayer} is not a Villager.`,
                        });
                    }

                    setGameState(tempGameState);
                }
            }

        }
    }, [voting]);

    const totalVotes = Object.keys(votes).length; // TODO: dead players shouldn't be counted in the threshold
    const castVotes = Object.values(votes).reduce((count, value) => (value ? count + 1 : count), 0);
    const voteThreshold = Math.ceil(totalVotes / 2);

    const butler = gameState.players.find(player => player.alive && player.role?.name === 'Butler');
    const patron = gameState.players.find(player => {
        const patronStatus = player.statuses.find(status => status.name === 'Patron');
        return patronStatus !== undefined && !patronStatus.poisoned;
    })?.name;

    const invalidSelection = (
        !nominatedPlayer || !nominatingPlayer
    );

    function getEligibleVoters() {
        const eligibleVoters: Record<string, boolean> = {};
        gameState.players.forEach(player => {
            if (player.alive || player.ghostVotes) {
                // ZEALOT
                if (zealot?.name === player.name && mustZealotVote()) {
                    eligibleVoters[player.name] = true; // ZEALOT must vote
                }
                else {
                    eligibleVoters[player.name] = false;
                }
            }
        });
        return eligibleVoters;
    }

    function isPlayerEligibleToNominate(player: Player) {
        return player.alive && !gameState.nominators.includes(player.name);
    }

    function isPlayerEligibleToBeNominated(player: Player) {
        return player.alive && !gameState.nominations.includes(player.name);
    }

    function handleVote(playerName: string, vote: boolean) {
        const tempVotes = { ...votes };
        tempVotes[playerName] = vote;

        //  BUTLER
        if (butler && playerName === patron) {
            tempVotes[butler?.name] = false;
        }
        // ZEALOT
        if (zealot && mustZealotVote()) {
            tempVotes[zealot.name] = true; // ZEALOT must vote
        }

        setVotes(tempVotes);
    }

    function endVote() {
        if (voting) {
            setOpen(false);

            if (nominatedPlayer && nominatingPlayer) {
                enactVote(gameState, setGameState, nominatingPlayer, nominatedPlayer, votes);
            }
        }
    }

    function handleGobboClaim() {
        if (nominatedPlayer && nominatingPlayer) {
            const tempGameState = { ...gameState };
            const nominated = tempGameState.players.find(player => player.name === nominatedPlayer);
            if (nominated && nominated.role?.name === 'Gobbo') {
                // Gobbo Claim
                const gobboIndex = tempGameState.players.findIndex(player => player.name === nominated.name);
                tempGameState.players[gobboIndex].statuses.push({ ...statuses.Goblin });

                // game log
                tempGameState.log.push({
                    type: 'public',
                    message: `${nominatingPlayer} has made a valid Goblin claim!`,
                });

                // alert
                tempGameState.popupEvent = {
                    heading: `${nominatingPlayer} has made a valid Goblin claim!`,
                    message: `${nominatedPlayer} is the Gobbo.`,
                    events: [],
                }

                setGameState(tempGameState);
            }
        }
    }

    function mustZealotVote() {
        const alivePlayerCount = gameState.players.filter(player => player.alive).length;
        return zealot?.alive && !isPlayerPoisoned(zealot) && alivePlayerCount >= 5;
    }

    function profileSelect(selectedPlayer: string | undefined, selectablePlayers: string[], setPlayer: React.Dispatch<React.SetStateAction<string | undefined>>) {
        return (
            <Tooltip enableClick={true} enableHover={false}>
                <TooltipTrigger>
                    {selectedPlayer ?
                        <img
                            src={`/red-minaret/characters/${selectedPlayer}.png`} alt={selectedPlayer}
                            className={styles.circleButton}
                            width={50} height={50}
                            style={{ margin: '5px', width: '50px', height: '50px' }}
                        />
                        :
                        <button className={styles.circleButton}
                            style={{ width: '50px', height: '50px' }}
                        >
                            <i className='ra ra-help' />
                        </button>
                    }
                </TooltipTrigger>
                <TooltipContent>
                    <GridList columns={3}>
                        {
                            selectablePlayers.map((player) => {
                                return (
                                    <CheckButton
                                        image={`/red-minaret/characters/${player}.png`} altText={player}
                                        imageWidth='50px'
                                        className={styles.profilePicture}
                                        isChecked={selectedPlayer === player} onChange={() => {
                                            setPlayer(player);
                                        }}
                                    />
                                );
                            })
                        }
                    </GridList>
                </TooltipContent>
            </Tooltip>
        );
    }

    if (!voting) {
        // NOMINATIONS
        return (
            <div className='dialogue-content'>

                {gameState.nominations.length < gameState.players.length && gameState.nominators.length < gameState.players.length ? (
                    <div className='column'>
                        <div className='row'
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                            }}
                        >
                            {
                                profileSelect(
                                    nominatingPlayer,
                                    gameState.players.filter(player => isPlayerEligibleToNominate(player)).map(player => player.name),
                                    setNominatingPlayer
                                )
                            }
                            <span>nominates</span>
                            {
                                profileSelect(
                                    nominatedPlayer,
                                    gameState.players.filter(player => isPlayerEligibleToBeNominated(player)).map(player => player.name),
                                    setNominatedPlayer
                                )
                            }
                        </div>

                        <div>
                            <Tooltip placement='bottom'>
                                <TooltipTrigger>
                                    <DialogueClose><i className='ra ra-cancel' /></DialogueClose>
                                </TooltipTrigger>
                                <TooltipContent>Close</TooltipContent>
                            </Tooltip>

                            <Tooltip placement='bottom'>
                                <TooltipTrigger>
                                    <button onClick={() => setVoting(true)} disabled={invalidSelection}><i className='ra ra-large-hammer' /></button>
                                </TooltipTrigger>
                                <TooltipContent>Begin Voting</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                ) : (
                    <div>Nobody is eligible to vote</div>
                )}

            </div>
        );
    }
    else {
        // VOTING PROPER
        const isGobboNominated = gameState.players.some(player => player.name === nominatedPlayer && player.role?.name === 'Gobbo');

        return (
            <div className='dialogue-content'>
                <div className='column'>
                    <span>{nominatingPlayer} nominates {nominatedPlayer}</span>

                    <GridList columns={3}>
                        {
                            Object.entries(votes).map(([playerName, vote]) => {

                                const butlerCannotVote = (
                                    playerName === butler?.name // BUTLER
                                    && !isPlayerPoisoned(butler)
                                    && (patron !== undefined ? !votes[patron] : true)
                                );

                                return (
                                    <CheckButton
                                        image={`/red-minaret/characters/${playerName}.png`} altText={playerName}
                                        imageWidth='50px'
                                        className={styles.profilePicture}
                                        isChecked={vote} onChange={() => handleVote(playerName, !vote)}
                                        disabled={butlerCannotVote}
                                    />
                                );
                            })
                        }
                    </GridList>

                    <span className={castVotes >= voteThreshold ? Team.GOOD : Team.EVIL}>{castVotes}/{totalVotes}</span>
                    <span className='row'>
                        {/* GOBBO */}
                        {isGobboNominated &&
                            <Tooltip placement='bottom'>
                                <TooltipTrigger>
                                    <button onClick={handleGobboClaim} disabled={invalidSelection}>
                                        <img src='/red-minaret/icons/roles/Slime Gel.png' alt='Gobbo Claim' className={styles.circleButton} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Gobbo Claim</TooltipContent>
                            </Tooltip>
                        }

                        <Tooltip placement='bottom'>
                            <TooltipTrigger>
                                <button onClick={endVote} disabled={invalidSelection}>
                                    <i className='ra ra-large-hammer' />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>End Vote</TooltipContent>
                        </Tooltip>
                    </span>
                </div>
            </div>
        );
    }
}

export default Voting;
