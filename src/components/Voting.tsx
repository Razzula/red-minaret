import { useState } from "react";

import { GameState, Player } from "../App";
import { DialogClose, useDialogContext } from "./common";
import { enactVote } from "../game/core";

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

    const invalidSelection = (
        nominatedPlayer === nominatingPlayer
        || !nominatedPlayer || !nominatingPlayer
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
        setVotes((prev) => ({
            ...prev,
            [playerName]: vote,
        }));
    }

    function endVote() {
        if (voting) {
            setOpen(false);

            if (nominatedPlayer && nominatingPlayer) {
                enactVote(gameState, setGameState, nominatingPlayer, nominatedPlayer, votes);
            }
        }
    }

    if (!voting) {
        // NOMINATIONS
        return (
            <div className='dialogue-content'>

                <DialogClose className='dialogue-x'>
                    <span>close</span>
                </DialogClose>

                <div className='column'>
                    <div className='row'>
                        <select
                            value={nominatingPlayer}
                            onChange={(e) => setNominatingPlayer(e.target.value)}
                        >
                            <option disabled selected></option>
                            {gameState.players.filter(player => isPlayerEligibleToNominate(player)).map((player) => {
                                return (
                                    <option key={player.name} value={player.name}>{player.name}</option>
                                );
                            })}
                        </select>
                        <span>nominates</span>
                        <select
                            value={nominatedPlayer}
                            onChange={(e) => setNominatedPlayer(e.target.value)}
                        >
                            <option disabled selected></option>
                            {gameState.players.filter(player => isPlayerEligibleToBeNominated(player)).map((player) => {
                                return (
                                    <option key={player.name} value={player.name}>{player.name}</option>
                                );
                            })}
                        </select>
                    </div>


                    <button onClick={() => setVoting(true)} disabled={invalidSelection}>ok</button>
                </div>

            </div>
        );
    }
    else {
        // VOTING PROPER
        return (
            <div className='dialogue-content'>
                <div className='column'>
                    <span>{nominatingPlayer} nominates {nominatedPlayer}</span>

                    {
                        Object.entries(votes).map(([playerName, vote]) => {
                            return (
                                <div key={playerName} className='row'>
                                    <span>{playerName}</span>
                                    <input type='checkbox' checked={vote} onChange={() => handleVote(playerName, !vote)} />
                                </div>
                            );
                        })
                    }

                    <span className={castVotes >= voteThreshold ? 'good' : 'evil'}>{castVotes}/{totalVotes}</span>
                    <button onClick={endVote} disabled={invalidSelection}>end vote</button>
                </div>
            </div>
        );
    }
}

export default Voting;
