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
    role?: 'Villager' | 'Werewolf';
}

function App() {

    const [gameState, setGameState] = useState<GameState>({
        day: 0,
        time: 0,
        players: [
            { name: 'Tom' },
            { name: 'Josh' },
            { name: 'Zaki' },
            { name: 'Mia' },
            { name: 'Sam' },
        ],
    })

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

    return (
        <>
            <CircleButtons gameState={gameState} setGameState={setGameState} radius={200} />
            <GameControls gameState={gameState} setGameState={setGameState} />
        </>
    )
}

export default App
