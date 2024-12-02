export const PlayState = {
    SETUP: 'setup',
    PLAYING: 'playing',
    DEFEAT: 'defeat',
    VICTORY: 'victory',
    SPECIAL: 'special',
} as const;

export type PlayStateType = typeof PlayState[keyof typeof PlayState];

export const PlayerType = {
    WEREWOLF: 'Werewolf',
    VILLAGER: 'Villager',
    MINION: 'Minion',
    OUTSIDER: 'Outsider',
} as const;

export type PlayerTypeType = typeof PlayerType[keyof typeof PlayerType];

export const Team = {
    GOOD: 'Good',
    EVIL: 'Evil',
} as const;
