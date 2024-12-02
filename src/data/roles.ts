import { PlayerType, Team } from "../enums";

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
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Seer Eye',
        night: 'Choose 2 players to investigate.',
        // note: ONE GOOD player must be set as a Red Herring
    },
    {
        name: 'Doctor', // Monk
        description: 'Each night*, choose a player (not yourself): they are safe from the Werewolf tonight.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Red Potion 3',
        night: 'Choose a player to protect.',
    },
    {
        name: 'Hunter', // Slayer
        description: 'Once per game, during the day, publicly choose a player: if they are the Werewolf, they die.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Bow',
        abilityUses: 1,
    },
    {
        name: 'Soldier',
        description: 'You cannot be killed by the Werewolf.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Iron Helmet',
    },
    {
        name: 'Empath',
        description: 'Each night, you learn how many of your 2 alive neighbours are evil.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Heart',
        night: 'Learn how many neighbours are evil.',
    },

    // OUTSIDERS
    {
        name: 'Drunk',
        description: 'You do not know you are the Drunk. You think you are a Villager, but you are not.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Beer',
    },
    {
        name: 'Saint',
        description: 'If you are lynched, you and the villagers lose.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Ruby Staff',
    },
    {
        name: 'Butler',
        description: 'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Envelope', // Yes it's spelt wrong
        night: 'Select a patron.',
    },

    // WEREWOLVES
    {
        name: 'Werewolf',
        description: 'do murders and stuff',
        team: Team.EVIL, type: PlayerType.WEREWOLF,
        icon: 'roles/Monster Meat',
        night: 'Choose a player to kill.',
    },

    // MINIONS
    {
        name: 'Poisoner',
        description: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
        team: Team.EVIL, type: PlayerType.MINION,
        icon: 'roles/Green Potion 2',
        night: 'Choose a player to poison.',
    },
]

export default roles;
