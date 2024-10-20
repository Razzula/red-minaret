import { useState } from "react";

import { Player } from "../App";

type VotingProps = {
    players: Player[];
    togglePlayerAlive: (index: number) => void;
};

export function Voting({ players, togglePlayerAlive }: VotingProps) {

    const [nominatedPlayer, setNominatedPlayer] = useState<number>(0);

    return (
        <div className='dialogue-content'>
            <select value={nominatedPlayer} onChange={(e) => setNominatedPlayer(Number(e.target.value))}>
                {players.filter(player => player.alive).map((player, index) => {
                    return (
                        <option key={index} value={index}>{player.name}</option>
                    );
                })}
            </select>
            <button onClick={() => togglePlayerAlive(nominatedPlayer)}>Vote</button>
        </div>
    );
}

export default Voting;
