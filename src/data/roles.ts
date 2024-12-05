import { PlayerType, PlayerTypeType, Team } from "../enums";

export type Role  = {
    name: string;
    description: string;

    team: string;
    type: string;

    icon: string;

    night?: string;
    day?: string;

    abilityUses?: number;
    useType?: string;
    condition?: string;

    order?: number; // low number = early
    prereqRoles?: {
        key: 'type' | 'name';
        value: PlayerTypeType;
        count: number;
    }[];
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
        description: 'Each night, you learn how many of your two alive neighbours are evil.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Heart',
        night: 'Learn how many neighbours are evil.',
    },
    {
        name: 'Virgin',
        description: 'The first time you are nominated to be lynched, if the nominator is a Villager, they are executed immediately.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Diamond',
        abilityUses: 1,
    },
    {
        name: 'Ravenkeeper',
        description: "Upon your death, you can learn one player's role during the following night.",
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Feather',
        night: "Learn a player's role",
        condition: 'dead',
        abilityUses: 1,
    },
    {
        name: 'Undertaker',
        description: 'At night, learn the role of the player lynched during the day.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Shovel',
        night: 'Learn which role was lynched today (if any).',

    },
    {
        name: 'Washerwoman',
        description: 'Start with knowledge that one (of two) players is a particular Villager role.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Leather Armour',
        night: 'Learn that one (of two) players is a particular Villager role.',
        abilityUses: 1,

        prereqRoles: [
            { key: 'type', value: PlayerType.VILLAGER, count: 1 },
        ],
    },
    {
        name: 'Librarian',
        description: 'Start with knowledge that one (of two) players is a particular Outsider role.', // if no Outsiders, then they learn this
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Book',
        night: 'Learn that one (of two) players is a particular Outsider role.',
        abilityUses: 1,

        prereqRoles: [
            { key: 'type', value: PlayerType.OUTSIDER, count: 1 },
        ],
    },
    {
        name: 'Investigator',
        description: 'Start with knowledge that one (of two) players is a particular Minion role.', // if no Minions, then they learn this
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Scroll',
        night: 'Learn that one (of two) players is a particular Minion role.',
        abilityUses: 1,

        prereqRoles: [
            { key: 'type', value: PlayerType.MINION, count: 1 },
        ],
    },

    // OUTSIDERS
    {
        name: 'Drunk',
        description: 'You do not know you are the Drunk. You think you are a Villager, but you are not.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'statuses/Beer',
    },
    {
        name: 'Saint',
        description: 'If you are lynched, you and the Villagers lose.',
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
    {
        name: 'Recluse',
        description: 'You might register as evil - as a Minion or Wereolf - even if dead.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Candle',
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
        order: 10,
        icon: 'roles/Green Potion 2',
        night: 'Choose a player to poison.',
    },
    {
        name: 'Spy',
        description: 'TBD',
        team: Team.EVIL, type: PlayerType.MINION,
        icon: 'roles/Leather Helmet',
        night: 'TBD',
    },
]

export default roles;
