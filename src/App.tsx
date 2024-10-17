import { useEffect, useState } from 'react'

import CircleButtons from './CircleButtons'
import GameControls from './GameControls'

import './App.css'
import roles, { Role } from './roles'

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

    const [villagerPool, setVillagerPool] = useState<number[]>(roles.map((role, index) => role.type === 'Villager' ? index : null).filter(i => i !== null));
    const [outsiderPool, setOutsiderPool] = useState<number[]>(roles.map((role, index) => role.type === 'Outsider' ? index : null).filter(i => i !== null));
    const [werewolfPool, setWerewolfPool] = useState<number[]>(roles.map((role, index) => role.type === 'Werewolf' ? index : null).filter(i => i !== null));
    const [minionPool, setMinionPool] = useState<number[]>(roles.map((role, index) => role.type === 'Minion' ? index : null).filter(i => i !== null));

    const setup = gameState.day === 0 && gameState.time === 0
    const timeSymbol = getTimeSymbol();

    useEffect(() => {
        // loadGameState()
    }, [])

    useEffect(() => {
        if (gameState) {
            localStorage.setItem('gameState', JSON.stringify(gameState));
        }
    }, [gameState])

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
        let { day, time } = gameState;

        if (time === 0) {
            if (currentPlayer === null) {
                setCurrentPlayer(0);
                return;
            }
            else if (currentPlayer < gameState.players.length - 1) {
                setCurrentPlayer((currentPlayer + 1));
                return;
            }
            else {
                setCurrentPlayer(null);
            }
        }

        time++;
        if (time > 2) {
            time = 0;
            day++;

            setCurrentPlayer(0);
        }
        setGameState({ ...gameState, day, time });
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

    return (
        <div className='row'>
            {/* LEFT COLUMN */}
            <div className='sidebar'>
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

            {/* CENTRAL COLUMN */}
            <div className='column'>
                {/* TOP BOX */}
                <div className='control-box column'>
                    <h2>{timeSymbol}  { setup ? 'Setup' : `Day ${gameState.day}` }  {timeSymbol}</h2>
                    <h3>{getTimeBlurb()}</h3>

                    <span>
                        <h4>
                        { currentPlayer !== null &&
                            <span>{gameState.players[currentPlayer].role?.night || 'There is nothing for this player to do, right now...'}</span>
                        }
                        </h4>
                    </span>
                </div>

                {/* CENTRE CIRCLE */}
                <CircleButtons radius={200}
                    gameState={gameState} setGameState={setGameState}
                    currentPlayer={currentPlayer}
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
