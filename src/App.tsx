import { useEffect, useState } from 'react'

import Consortium from './components/consortium/Consortium'
import GameControls from './components/GameControls'
import { findPlayersNeighbours } from './game/utils'

import roles, { Role } from './data/roles'
import { Status } from './data/statuses'

import './App.css'
import './globals.css'
import { advanceTime, handleAction, togglePlayerAlive } from './game/core'

export type GameState = {
    day: number;
    time: number;
    state: 'setup' | 'playing' | 'defeat' | 'victory';

    players: Player[];

    nominations: string[];
    nominators: string[];
    choppingBlock?: string;
}

export type Player = {
    name: string;
    alive: boolean;
    role?: Role;
    statuses: Status[];
    ghostVotes: number;
}

const playerList = [
    'Steve', 'Marvin', 'Graham White', 'Boblin', 'Doblin', 'Gorgonzola', 'Otto', 'Ryker', 'Harran', 'Zazu', 'Hush', 'Billybob'
]

function defaultGameState(): GameState  {
    return {
        day: 0,
        time: 0,
        state: 'setup',
        players: playerList
            .sort(() => Math.random() - 0.5) // shuffle
            .slice(0, 5).map(name => ({
                name, alive:
                true, statuses: [],
                ghostVotes: 1,
            })),
        nominations: [],
        nominators: [],
    };
}

function App() {

    const [gameState, setGameState] = useState<GameState>(defaultGameState())

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
        loadGameState()
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
                gameState.state = 'victory';
            }
            else if (
                gameState.players.filter(player => player.role?.team === 'Evil' && player.alive).length
                    >= gameState.players.filter(player => player.role?.team === 'Good' && player.alive).length
            ) {
                gameState.state = 'defeat';
            }
        }
    }, [gameState, setup]);

    useEffect(() => {
        if (gameState.state === 'defeat') {
            alert('Werewolves win!');
        }
        else if (gameState.state === 'victory') {
            alert('Villagers win!');
        }
    }, [gameState.state, setup]);

    function loadGameState() {
        const cachedGameState = localStorage.getItem('gameState');
        if (cachedGameState) {
            setGameState(JSON.parse(cachedGameState));
        }
    }

    // function handleSettingsChange(event: React.ChangeEvent<HTMLInputElement>) {
    //     const { id, value } = event.target;
    //     setGameSettings((prev) => ({
    //         ...prev,
    //         [id]: value,
    //     }))
    // }

    function resetGameState(keepNames = false) {
        if (keepNames) {
            setGameState((prev) => ({
                ...defaultGameState(),
                players: prev.players.map(player => ({
                    ...player,
                    alive: true,
                    role: undefined,
                    statuses: [],
                    ghostVotes: 1,
                })),
            }));
        }
        else {
            setGameState(defaultGameState());
        }
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

    function handleActionCall(index: number) {
        handleAction(index, currentPlayer, gameState, selectedPlayers, setSelectedPlayers);
    }

    function togglePlayerAliveCall(name: string) {
        togglePlayerAlive(name, gameState, setGameState);
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
                <Consortium radius={200}
                    gameState={gameState} setGameState={setGameState}
                    currentPlayer={currentPlayer} selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers}
                    handleAction={handleActionCall} togglePlayerAlive={togglePlayerAliveCall}
                />

                {/* BOTTOM BOX */}
                <div className='control-box'>
                    <GameControls
                        gameState={gameState} setGameState={setGameState} resetGameState={resetGameState}
                        gameSettings={gameSettings}
                        advanceTime={() => advanceTime(gameState, setGameState, currentPlayer, setCurrentPlayer)} setCurrentPlayer={setCurrentPlayer}
                        villagerPool={villagerPool} outsiderPool={outsiderPool} werewolfPool={werewolfPool} minionPool={minionPool}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN */}
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
