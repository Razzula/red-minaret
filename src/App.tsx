import { useEffect, useState } from 'react'

import CircleButtons from './components/CircleButtons'
import GameControls from './components/GameControls'
import { findPlayersNeighbours } from './utils/utils'

import roles, { Role } from './data/roles'
import statuses, { Status } from './data/statuses'

import './styles/App.css'

export type GameState = {
    day: number;
    time: number;

    players: Player[];
}

export type Player = {
    name: string;
    alive: boolean;
    role?: Role;
    statuses: Status[];
}

const playerList = [
    'Steve', 'Marvin', 'Graham White', 'Boblin', 'Doblin', 'Gorgonzola', 'Otto', 'Ryker', 'Harran', 'Zazu', 'Hush', 'Billybob'
]

function App() {

    const [gameState, setGameState] = useState<GameState>({
        day: 0,
        time: 0,
        players: playerList
            .sort(() => Math.random() - 0.5) // shuffle
            .slice(0, 5).map(name => ({ name, alive: true, statuses: [] })),
    })

    const [gameSettings, /*setGameSettings*/] = useState({})

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

    // function loadGameState() {
    //     const cachedGameState = localStorage.getItem('gameState');
    //     if (cachedGameState) {
    //         setGameState(JSON.parse(cachedGameState));
    //     }
    // }

    // function handleSettingsChange(event: React.ChangeEvent<HTMLInputElement>) {
    //     const { id, value } = event.target;
    //     setGameSettings((prev) => ({
    //         ...prev,
    //         [id]: value,
    //     }))
    // }

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
            // at night, advance through players
            // TODO: order should be role-based (use codenames), not 'chronological'
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
                if (player.statuses?.find(status => status.name === 'Targeted') &&
                    !player.statuses?.find(status => status.name === 'Protected') &&
                    player.role?.name !== 'Soldier'
                ) {
                    // TODO: handle SAINT
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

    function updateStatuses(statuses: Status[], time: number) {
        const newStatuses = [];
        for (const status of statuses) {
            if (status.expiration === undefined || status.expiration !== time) {
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

        let poolEnabled = true;
        if (roleType === 'Minion' && gameState.players.length < 6) {
            poolEnabled = false;
        }

        return roles.map((role, index) => {
            if (role.type !== roleType) {
                return;
            }
            return (
                <li key={index}>{role.name}
                    <input type='checkbox'
                        disabled={!poolEnabled}
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
        if (gameState.players[currentPlayer].statuses?.find(status => status.name === 'Drunk')) {
            instruction = `${instruction} Remember, this player is the Drunk!`;
        }

        return instruction;

    }

    function handleAction(index: number) {
        if (currentPlayer === null) {
            return;
        }

        const isPlayerDrunk = gameState.players[currentPlayer].statuses?.find(status => status.name === 'Drunk') ? true : false;

        const currentRole = gameState.players[currentPlayer].role;
        if (!currentRole) {
            return;
        }

        if (currentRole.name === 'Werewolf') {
            // WEREWOLF
            gameState.players[index].statuses?.push(statuses['Targeted']);
            for (const selectedPlayer of selectedPlayers) {
                gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
            }
            setSelectedPlayers([index]);
            return;
        }

        if (currentRole.name === 'Doctor') {
            // DOCTOR
            const statusToApply = isPlayerDrunk ? statuses["'Protected'"] : statuses['Protected'];

            gameState.players[index].statuses?.push(statusToApply);
            for (const selectedPlayer of selectedPlayers) {
                gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
            }
            setSelectedPlayers([index]);
            return;
        }

        if (currentRole.name === 'Seer') {
            const newSelectedPlayers = [...selectedPlayers];
            if (newSelectedPlayers.includes(index)) {
                // deselect this player
                newSelectedPlayers.splice(newSelectedPlayers.indexOf(index), 1);
            }
            else {
                // select this player
                if (newSelectedPlayers.length === 2) {
                    // deselect the first player
                    newSelectedPlayers.shift();
                }
                newSelectedPlayers.push(index);
            }
            setSelectedPlayers(newSelectedPlayers);
            return;
        }

        if (currentRole.name === 'Butler') {
            // BUTLER
            gameState.players[index].statuses?.push(statuses['Patron']);
            for (const selectedPlayer of selectedPlayers) {
                gameState.players[selectedPlayer].statuses = []; // TODO: this clears 'Drunk', etc.
            }
            setSelectedPlayers([index]);
            return;
        }

        setSelectedPlayers([index]);
    }

    function togglePlayerAlive(index: number) {
        const tempGameState = { ...gameState };
        tempGameState.players[index].alive = !tempGameState.players[index].alive;
        setGameState(tempGameState);
    }

    /**
     * TODO:
     * - Taj Mahal background
     *      - bonus points to have sky reflect day/evening/night
     */

    return (
        <div className='row'>
            {/* LEFT COLUMN */}
            <div className='sidebar'>
                { setup ?
                    <div>
                        {/* TODO: make this its own component? */}
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
                    : <div>TODO: show a list of all roles, and what they do, here (like <a href='https://preview.redd.it/various-custom-full-scripts-7-15-players-3-core-14-custom-v0-77x00glowt691.jpg?width=640&crop=smart&auto=webp&s=fb9ac07d0ab9f51558b49c9b08ec3318396bec4c'>here</a>)</div>
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
                    handleAction={handleAction} togglePlayerAlive={togglePlayerAlive}
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
                <span>TODO: put something actually useful here (game log?)</span>
            </div>
        </div>
    )
}

export default App
