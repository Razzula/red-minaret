import { useEffect, useState } from 'react'

import CircleButtons from './CircleButtons'
import GameControls from './GameControls'

import './App.css'
import roles, { Role } from './roles'
import { findPlayersNeighbours, whenStatusExpire } from './utils'

export type GameState = {
    day: number;
    time: number;

    players: Player[];
}

export type Player = {
    name: string;
    alive: boolean;
    role?: Role;
    statuses?: string[];
}

const playerList = [
    'Tom', 'Josh', 'Zaki', 'Mia', 'Sam', 'Steve', 'Marvin', 'Graham White',
]

function App() {

    const [gameState, setGameState] = useState<GameState>({
        day: 0,
        time: 0,
        players: playerList.slice(0, 5).map(name => ({ name, alive: true })),
    })

    const [gameSettings, setGameSettings] = useState({})

    const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

    const [villagerPool, setVillagerPool] = useState<number[]>(roles.map((role, index) => role.type === 'Villager' ? index : null).filter(i => i !== null));
    const [outsiderPool, setOutsiderPool] = useState<number[]>(roles.map((role, index) => role.type === 'Outsider' ? index : null).filter(i => i !== null));
    const [werewolfPool, setWerewolfPool] = useState<number[]>(roles.map((role, index) => role.type === 'Werewolf' ? index : null).filter(i => i !== null));
    const [minionPool, setMinionPool] = useState<number[]>(roles.map((role, index) => role.type === 'Minion' ? index : null).filter(i => i !== null));

    const setup = gameState.day === 0 && gameState.time === 0
    const timeSymbol = getTimeSymbol();

    useEffect(() => {
        // loadGameState()
    }, []);

    useEffect(() => {
        if (gameState) {
            localStorage.setItem('gameState', JSON.stringify(gameState));
        }
    }, [gameState]);

    useEffect(() => {
        if (currentPlayer !== null) {
            // EMPATH
            if (gameState.players[currentPlayer].role?.name === 'Empath') {
                const neighbours = findPlayersNeighbours(gameState, currentPlayer);
                setSelectedPlayers(neighbours);
            }
            else {
                setSelectedPlayers([]);
            }
        }
        else {
            setSelectedPlayers([]);
        }
    }, [currentPlayer, gameState]);

    useEffect(() => {
        if (gameState.players.length > 0 && !setup) {
            if (!gameState.players.find(player => player.role?.team === 'Evil' && player.alive)) {
                alert('Villagers win!');
            }
            else if (
                gameState.players.filter(player => player.role?.team === 'Evil' && player.alive).length
                    >= gameState.players.filter(player => player.role?.team === 'Good' && player.alive).length
            ) {
                alert('Werewolves win!');
            }
        }
    }, [gameState, setup]);

    function loadGameState() {
        const cachedGameState = localStorage.getItem('gameState');
        if (cachedGameState) {
            setGameState(JSON.parse(cachedGameState));
        }
    }

    function handleSettingsChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { id, value } = event.target;
        setGameSettings((prev) => ({
            ...prev,
            [id]: value,
        }))
    }

    function getTimeSymbol() {
        switch (gameState.time) {
            case 0:
                if (currentPlayer === null) {
                    return '⚙';
                }
                return '🌙'
            case 1:
                return '☀️'
            case 2:
                return '🌆'
            default:
                return ''
        }
    }

    function getTimeBlurb() {
        switch (gameState.time) {
            case 0:
                if (currentPlayer === null) {
                    return 'Configure the game.';
                }
                return `It is ${currentPlayer + 1} a.m. (${gameState.players[currentPlayer].name}'s turn)`;
            case 1:
                return 'Disscussion';
            case 2:
                return 'Voting';
            default:
                return '';
        }
    }

    function advanceTime() {
        const tempGameState = { ...gameState };
        let { day, time } = tempGameState;

        if (time === 0) {
            if (currentPlayer === null) {
                setCurrentPlayer(0);
                return;
            }
            else if (currentPlayer < tempGameState.players.length - 1) {
                setCurrentPlayer((currentPlayer + 1));
                return;
            }
            else {
                setCurrentPlayer(null);
            }
        }

        time++;
        // MORNING
        if (time === 1) {
            // HANDLE MURDER
            tempGameState.players.forEach((player, index) => {
                if (player.statuses?.includes('Targeted') &&
                    !player.statuses?.includes('Protected') &&
                    player.role?.name !== 'Soldier'
                ) {
                    tempGameState.players[index].alive = false;
                }
            });
        }
        // NEW DAY
        else if (time > 2) {
            time = 0;
            day++;

            setCurrentPlayer(0);
        }

        tempGameState.players.forEach((player, index) => {
            if (player.statuses) {
                // reset
                tempGameState.players[index].statuses = updateStatuses(player.statuses, time);
                // TODO: this is too fast for morning!
            }
        });

        setGameState({ ...tempGameState, day, time });
    }

    function updateStatuses(statuses: string[], time: number) {
        const newStatuses = [];
        for (const status of statuses) {
            const expire = whenStatusExpire(status);
            if (expire === null || expire !== time) {
                newStatuses.push(status);
            }
        }
        return newStatuses;
    }

    function roleSettingsPanel(roleType: string, rolePool: number[], setRolePool: React.Dispatch<React.SetStateAction<number[]>>) {

        const updateRolePool = (index: number) => {
            if (rolePool.includes(index)) {
                setRolePool(rolePool.filter(i => i !== index));
            } else {
                setRolePool([...rolePool, index]);
            }
        }

        return roles.map((role, index) => {
            if (role.type !== roleType) {
                return;
            }
            return (
                <li key={index}>{role.name}
                    <input type='checkbox'
                        checked={rolePool.includes(index)}
                        onChange={() => updateRolePool(index)}
                    />
                </li>
            );
        });
    }

    function getNightInstruction() {
        if (currentPlayer === null) {
            return null;
        }

        let instruction;
        const player = gameState.players[currentPlayer];

        if (!player.alive) {
            return 'This player is dead.';
        }

        if (player.role?.night) {
            instruction = gameState.players[currentPlayer].role?.night;
        }
        else {
            return 'There is nothing for this player to do, right now...';
        }

        // EMPATH
        if (gameState.players[currentPlayer].role?.name === 'Empath') {
            let evilCount = 0;
            // check neighbours (skip over dead players)
            const neighbours = findPlayersNeighbours(gameState, currentPlayer);
            for (const neighbour of neighbours) {
                if (gameState.players[neighbour].role?.team === 'Evil') {
                    evilCount++;
                }
            }
            instruction = `${instruction} (${evilCount}).`;
        }

        // DRUNK
        if (gameState.players[currentPlayer].statuses?.includes('Drunk')) {
            instruction = `${instruction} Remember, this player is the Drunk!`;
        }

        return instruction;

    }

    function handleAction(index: number) {
        if (currentPlayer === null) {
            return;
        }

        const currentRole = gameState.players[currentPlayer].role;
        if (!currentRole) {
            return;
        }

        if (currentRole.name === 'Werewolf') {
            // WEREWOLF
            gameState.players[index].statuses?.push('Targeted');
            for (const selectedPlayer of selectedPlayers) {
                gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
            }
            setSelectedPlayers([index]);
            return;
        }

        if (currentRole.name === 'Doctor') {
            // DOCTOR
            gameState.players[index].statuses?.push('Protected');
            for (const selectedPlayer of selectedPlayers) {
                gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
            }
            setSelectedPlayers([index]);
            return;
        }

        if (currentRole.name === 'Seer') {
            // TODO
            return;
        }

        if (currentRole.name === 'Butler') {
            // BUTLER
            gameState.players[index].statuses?.push('Patron');
            for (const selectedPlayer of selectedPlayers) {
                gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
            }
            setSelectedPlayers([index]);
            return;
        }

        setSelectedPlayers([index]);
    }

    return (
        <div className='row'>
            {/* LEFT COLUMN */}
            <div className='sidebar'>
                { setup &&
                    <div>
                        <h1>Configuration</h1>
                        <h2><u>Roster</u></h2>

                        <h3>Villagers</h3>
                        <div className='column'>
                            {roleSettingsPanel('Villager', villagerPool, setVillagerPool)}
                        </div>

                        <h3>Outsiders</h3>
                        <div className='column'>
                            {roleSettingsPanel('Outsider', outsiderPool, setOutsiderPool)}
                        </div>

                        <h3>Werewolves</h3>
                        <div className='column'>
                            {roleSettingsPanel('Werewolf', werewolfPool, setWerewolfPool)}
                        </div>

                        <h3>Minions</h3>
                        <div className='column'>
                            {roleSettingsPanel('Minion', minionPool, setMinionPool)}
                        </div>

                        <h2><u>Settings</u></h2>
                    </div>
                }
            </div>

            {/* CENTRAL COLUMN */}
            <div className='column'>
                {/* TOP BOX */}
                <div className='control-box column'>
                    <h2>{timeSymbol}  { setup ? 'Setup' : `Day ${gameState.day}` }  {timeSymbol}</h2>
                    <p>{getTimeBlurb()}</p>

                    <span>
                        <p>
                        { currentPlayer !== null &&
                            <span>{getNightInstruction()}</span>
                        }
                        </p>
                    </span>
                </div>

                {/* CENTRE CIRCLE */}
                <CircleButtons radius={200}
                    gameState={gameState} setGameState={setGameState}
                    currentPlayer={currentPlayer} selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers}
                    handleAction={handleAction}
                />

                {/* BOTTOM BOX */}
                <div className='control-box'>
                    <GameControls
                        gameState={gameState} setGameState={setGameState}
                        gameSettings={gameSettings}
                        advanceTime={advanceTime} setCurrentPlayer={setCurrentPlayer}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                    />
                </div>
            </div>

            {/* RIGHTa COLUMN */}
            <div className='sidebar'>
                <h2>Players</h2>
                <ul>
                    {gameState.players.map((player, index) => (
                        <li key={index}>{player.name}</li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default App
