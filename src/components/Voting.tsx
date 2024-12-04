import { useState } from "react";

import { GameState, Player } from "../App";
import { DialogClose, Tooltip, TooltipContent, TooltipTrigger, useDialogContext } from "./common";
import { enactVote } from "../game/core";
import { Team } from "../enums";
import CheckButton from "./common/CheckButton/CheckButton";
import GridList from "./common/GridList/GridList";

import styles from './consortium/Consortium.module.scss';

type VotingProps = {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    togglePlayerAlive: (index: string) => void;
};

export function Voting({ gameState, setGameState }: VotingProps) {

    const [voting, setVoting] = useState(false);

    const [nominatedPlayer, setNominatedPlayer] = useState<string>();
    const [nominatingPlayer, setNominatingPlayer] = useState<string>();

    const [votes, setVotes] = useState<Record<string, boolean>>(getEligibleVoters());

    const { setOpen } = useDialogContext();

    const totalVotes = Object.keys(votes).length; // TODO: dead players shouldn't be counted in the threshold
    const castVotes = Object.values(votes).reduce((count, value) => (value ? count + 1 : count), 0);
    const voteThreshold = Math.ceil(totalVotes / 2);

    const butler = gameState.players.find(player => player.role?.name === 'Butler')?.name;
    const patron = gameState.players.find(player => {
        const patronStatus = player.statuses.find(status => status.name === 'Patron');
        return patronStatus !== undefined && !patronStatus.poisoned;
    })?.name;

    const invalidSelection = (
        !nominatedPlayer || !nominatingPlayer
    );

    function isPlayerEligibleToNominate(player: Player) {
        return player.alive && !gameState.nominators.includes(player.name);
    }

    function isPlayerEligibleToBeNominated(player: Player) {
        return player.alive && !gameState.nominations.includes(player.name);
    }

    function getEligibleVoters() {
        const eligibleVoters: Record<string, boolean> = {};
        gameState.players.forEach(player => {
            if (player.alive || player.ghostVotes) {
                eligibleVoters[player.name] = false;
            }
        });
        return eligibleVoters;
    }

    function handleVote(playerName: string, vote: boolean) {
        const tempVotes = { ...votes };
        tempVotes[playerName] = vote;

        //  BUTLER
        if (butler && playerName === patron) {
            tempVotes[butler] = false;
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

    function profileSelect(selectedPlayer: string | undefined, selectablePlayers: string[], setPlayer: React.Dispatch<React.SetStateAction<string | undefined>>) {
        return (
            <Tooltip enableClick={true} enableHover={false}>
                <TooltipTrigger>
                    { selectedPlayer ?
                        <img
                            src={`/red-minaret/characters/${selectedPlayer}.png`} alt={selectedPlayer}
                            className={styles.circleButton}
                            width={50} height={50}
                            style={{ margin: '5px' }}
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

                { gameState.nominations.length < gameState.players.length && gameState.nominators.length < gameState.players.length ? (
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
                                    <button onClick={() => setVoting(true)} disabled={invalidSelection}><i className='ra ra-large-hammer' /></button>
                                </TooltipTrigger>
                                <TooltipContent>Begin Voting</TooltipContent>
                            </Tooltip>

                            <Tooltip placement='bottom'>
                                <TooltipTrigger>
                                    <DialogClose><i className='ra ra-cancel' /></DialogClose>
                                </TooltipTrigger>
                                <TooltipContent>Close</TooltipContent>
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
        return (
            <div className='dialogue-content'>
                <div className='column'>
                    <span>{nominatingPlayer} nominates {nominatedPlayer}</span>

                    <GridList columns={3}>
                        {
                            Object.entries(votes).map(([playerName, vote]) => {

                                const butlerCannotVote = (
                                    playerName === butler // BUTLER
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
                    <Tooltip placement='bottom'>
                        <TooltipTrigger>
                            <button onClick={endVote} disabled={invalidSelection}>
                                <i className='ra ra-large-hammer' />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>End Vote</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        );
    }
}

export default Voting;
