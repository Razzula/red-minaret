export type Role  = {
    name: string;
    description: string;

    team: string;
    type: string;

    night?: string;
    day?: string;
}

export const roles: Role[] = [
    {
        name: 'Seer', // Fortune Teller
        description: 'Each night, choose 2 players: you learn if either is a Werewolf. There is a good player that registers as a Werewolf to you.',
        team:'Good', type: 'Villager',

        night: 'Choose 2 players to investigate.',
        // note: ONE GOOD player must be set as a Red Herring
    },
    {
        name: 'Doctor', // Monk
        description: 'Each night*, choose a player (not yourself): they are safe from the Werewolf tonight.',
        team: 'Good', type: 'Villager',

        night: 'Choose a player to protect.',
    },
    {
        name: 'Hunter', // Slayer
        description: 'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
        team: 'Good', type: 'Villager',
    },
    {
        name: 'Soldier',
        description: 'You cannot be killed by the Werewolf.',
        team: 'Good', type: 'Villager',
    },
    {
        name: 'Empath',
        description: 'Each night, you learn how many of your 2 alive neighbors are evil.',
        team: 'Good', type: 'Villager',

        night: 'Learn how many neighbours are evil.',
    },

    {
        name: 'Drunk',
        description: 'You do not know you are the Drunk. You think you are a Villager, but you are not.',
        team: 'Good', type: 'Outsider',
    },
    {
        name: 'Saint',
        description: 'If you are lynched, you and the villagers lose.',
        team: 'Good', type: 'Outsider',
    },
    {
        name: 'Butler',
        description: 'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
        team: 'Good', type: 'Outsider',

        night: 'Select a patron.',
    },

    {
        name: 'Werewolf',
        description: 'do murders and stuff',
        team:'Evil', type:'Werewolf',

        night: 'Choose a player to kill.',
    },

    {
        name: 'Poisoner',
        description: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
        team: 'Evil', type: 'Minion',

        night: 'Choose a player to poison.',
    },
]

export default roles;
