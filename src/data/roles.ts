export type Role  = {
    name: string;
    description: string;

    team: string;
    type: string;

    icon: string;

    night?: string;
    day?: string;

    abilityUses?: number;
}

export const roles: Role[] = [

    // VILLAGERS
    {
        name: 'Seer', // Fortune Teller
        description: 'Each night, choose 2 players: you learn if either is a Werewolf. There is a good player that registers as a Werewolf to you.',
        team:'Good', type: 'Villager',
        icon: 'roles/Seer Eye',
        night: 'Choose 2 players to investigate.',
        // note: ONE GOOD player must be set as a Red Herring
    },
    {
        name: 'Doctor', // Monk
        description: 'Each night*, choose a player (not yourself): they are safe from the Werewolf tonight.',
        team: 'Good', type: 'Villager',
        icon: 'roles/Red Potion 3',
        night: 'Choose a player to protect.',
    },
    {
        name: 'Hunter', // Slayer
        description: 'Once per game, during the day, publicly choose a player: if they are the Werewolf, they die.',
        team: 'Good', type: 'Villager',
        icon: 'roles/Bow',
        abilityUses: 1,
    },
    {
        name: 'Soldier',
        description: 'You cannot be killed by the Werewolf.',
        team: 'Good', type: 'Villager',
        icon: 'roles/Iron Helmet',
    },
    {
        name: 'Empath',
        description: 'Each night, you learn how many of your 2 alive neighbours are evil.',
        team: 'Good', type: 'Villager',
        icon: 'roles/Heart',
        night: 'Learn how many neighbours are evil.',
    },

    // OUTSIDERS
    {
        name: 'Drunk',
        description: 'You do not know you are the Drunk. You think you are a Villager, but you are not.',
        team: 'Good', type: 'Outsider',
        icon: 'roles/Beer',
    },
    {
        name: 'Saint',
        description: 'If you are lynched, you and the villagers lose.',
        team: 'Good', type: 'Outsider',
        icon: 'roles/Ruby Staff',
    },
    {
        name: 'Butler',
        description: 'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
        team: 'Good', type: 'Outsider',
        icon: 'roles/Envelope', // Yes it's spelt wrong
        night: 'Select a patron.',
    },

    // WEREWOLVES
    {
        name: 'Werewolf',
        description: 'do murders and stuff',
        team:'Evil', type:'Werewolf',
        icon: 'roles/Monster Meat',
        night: 'Choose a player to kill.',
    },

    // MINIONS
    {
        name: 'Poisoner',
        description: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
        team: 'Evil', type: 'Minion',
        icon: 'roles/Green Potion 2',
        night: 'Choose a player to poison.',
    },
]

export default roles;
