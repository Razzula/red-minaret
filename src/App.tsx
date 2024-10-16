import { useEffect, useState } from 'react'

import CircleButtons from './CircleButtons'
import GameControls from './GameControls'

import './App.css'

export type GameState = {
    day: number;
    time: number;

    players: Player[];
}

export type Player = {
    name: string;
    alive: boolean;
    role?: 'Villager' | 'Werewolf';
    statuses?: string[];
}

function App() {

    const [gameState, setGameState] = useState<GameState>({
        day: 0,
        time: 0,
        players: [
            { name: 'Tom', alive: true },
            { name: 'Josh', alive: true },
            { name: 'Zaki', alive: true },
            { name: 'Mia', alive: true },
            { name: 'Sam', alive: true },
        ],
    })

    const [gameSettings, setGameSettings] = useState({
        drunkProb: 0.5,
    })

    const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);

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
                    return 'Setup';
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

    return (
        <div className='main'>
            <div className='control-box column'>
                <h2>{timeSymbol}  { setup ? 'Setup' : `Day ${gameState.day}` }  {timeSymbol}</h2>
                <h3>{getTimeBlurb()}</h3>

            </div>

            <CircleButtons radius={200}
                gameState={gameState} setGameState={setGameState}
                currentPlayer={currentPlayer}
            />

            { setup &&
                <div className='control-box'>
                    <label htmlFor='drunkProb'>Drunk Probability</label>
                    <input type='number' id='drunkProb' value={gameSettings.drunkProb} onChange={handleSettingsChange} />
                </div>
            }

            <div className='control-box'>
                <GameControls
                    gameState={gameState} setGameState={setGameState}
                    gameSettings={gameSettings}
                    advanceTime={advanceTime} setCurrentPlayer={setCurrentPlayer}
                />
            </div>
        </div>
    )
}

export default App
