import { PlayerType, PlayerTypeType, Team, TeamType } from "../enums";

export type Role  = {
    name: string;
    altName?: string;
    description: string;

    team: string;
    type: string;

    icon: string;

    night?: string;
    day?: string;

    abilityUses?: number;
    useType?: string;
    condition?: string;
    delay?: number;

    order?: RoleOrder;
    prereqRoles?: {
        key: 'type' | 'name' | 'team';
        value: PlayerTypeType | TeamType;
        count: number;
    }[];
    prereqStatus?: {
        value: string;
        count: number;
    }[];

    notes?: string[];
}

export type RoleOrder = {
    type:
        'first' | 'last'
        | 'early' | 'late'
        | 'before' | 'after';
    relative?: string;
}

export const roles: Role[] = [

    // VILLAGERS
    {
        name: 'Washerwoman',
        description: 'Start with knowledge that one (of two) players is a particular Villager role.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Leather Armour',
        night: 'Learn that one (of two) players is a particular Villager role.',
        abilityUses: 1,

        prereqRoles: [
            { key: 'type', value: PlayerType.VILLAGER, count: 2 },
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
    {
        name: 'Chef',
        description: 'Start with knowledge of how many pairs of evil players there are.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Cheese',
        night: 'Learn how many pairs of evil players there are.',
        abilityUses: 1,

        prereqRoles: [
            { key: 'team', value: Team.EVIL, count: 2 },
        ],
    },
    {
        name: 'Empath',
        description: 'Each night, you learn how many of your two alive neighbours are evil.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Heart',
        night: 'Learn how many neighbours are evil.',
    },
    {
        name: 'Seer', altName: 'Fortune Teller',
        description: 'Each night, choose two players: you learn if either is a Werewolf. There is a Good player that registers as a Werewolf to you.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Seer Eye',
        night: 'Choose two players to investigate.',

        // ONE GOOD player must be set as a Red Herring
        prereqStatus: [
            { value: 'Red Herring', count: 1 },
        ],
    },
    {
        name: 'Undertaker',
        description: 'At night, learn the role of the player lynched during the day.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Shovel',
        night: 'Learn which role was lynched today (if any).',
        delay: 1,

    },
    {
        name: 'Doctor', altName: 'Monk',
        description: 'Each night*, choose a player (not yourself): they are safe from the Werewolf tonight.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Red Potion 3',
        night: 'Choose a player to protect.',
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
        name: 'Virgin',
        description: 'The first time you are nominated to be lynched, if the nominator is a Villager, they are executed immediately.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Diamond',
        abilityUses: 1,
    },
    {
        name: 'Hunter', altName: 'Slayer',
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
        name: 'Mayor',
        description: 'If only three players live, and no execution occurs: your team wins. If you die at night, another player might die instead.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Golden Key',
    },

    {
        name: 'Gambler',
        description: 'Each night*, choose a player & guess their role: if you guess wrong, you die.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Copper Coin',
        night: "Guess a player's role.",
        delay: 1,
    },
    {
        name: 'Fool',
        description: "The first time this player dies, they don't!",
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Coal',
        abilityUses: 1,
    },
    {
        name: 'Artist',
        description: 'Once per game, during the day, privately ask the Storyteller a yes/no question, which they must answer truthfully.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Paper',
        abilityUses: 1,
    },
    {
        name: 'Nain', altName: 'Grandmother',
        description: "Start knowing a Good player's role. If the Werewolf kills them: you die.",
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Wooden Staff',
        night: "Learn the Grandchild's identity and role.",
        abilityUses: 1,

        prereqStatus: [
            { value: 'Grandchild', count: 1 },
        ],
    },
    {
        name: 'Farmer',
        description: 'When you die at night, a living Good player becomes a Farmer.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Wool',
    },
    {
        name: 'Tea Lady',
        description: 'If both of your alive neighbours are Good, they cannot die.',
        team: Team.GOOD, type: PlayerType.VILLAGER,
        icon: 'roles/Tea From Yorkshire',
    },

    // OUTSIDERS
    {
        name: 'Butler',
        description: 'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Envelope', // Yes it's spelt wrong
        night: 'Select a patron.',

        notes:  [
            'As a Butler can never 100% confirm they are Posioned, they should never be allowed to ignore their patron.',
        ],
    },
    {
        name: 'Drunk',
        description: 'You do not know you are the Drunk. You think you are a Villager, but you are not.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'statuses/Beer',
    },
    {
        name: 'Recluse',
        description: 'You might register as evil - as a Minion or Werewolf - even if dead.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Candle',
    },
    {
        name: 'Saint',
        description: 'If you are lynched, you and the Villagers lose.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Ruby Staff',
    },
    {
        name: 'Zealot',
        description: 'If there are 5 or more players alive, you must vote for every nomination.',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        icon: 'roles/Golden Sword',
    },
    {
        name: 'Lunatic',
        description: 'You think you are a Werewolf, but you are not. The Werewolf knows who you are and who you choose at night..',
        team: Team.GOOD, type: PlayerType.OUTSIDER,
        order: { type: 'before', relative: 'Werewolf' },
        icon: 'roles/Mushroom',
    },

    // WEREWOLVES
    {
        name: 'Werewolf', altName: 'Imp',
        description: 'Each night*, choose a player to kill. If you kill yourself this way, a Minion becomes the Werewolf.',
        team: Team.EVIL, type: PlayerType.WEREWOLF,
        order: { type: 'early' },
        icon: 'roles/Monster Meat',
        night: 'Choose a player to kill.',
        delay: 1,
    },
    {
        name: 'Bloodhound', altName: 'Ojo',
        description: 'Each night*, choose a role to kill. If they are not in play, the Storyteller chooses who dies.',
        team: Team.EVIL, type: PlayerType.WEREWOLF,
        order: { type: 'early' },
        icon: 'roles/Monster Eye',
        night: 'Choose a role to kill. (If role not in play, Storyteller decides).',
        delay: 1,
    },

    // MINIONS
    {
        name: 'Poisoner',
        description: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
        team: Team.EVIL, type: PlayerType.MINION,
        order: { type: 'first' },
        icon: 'roles/Green Potion 2',
        night: 'Choose a player to poison.',
    },
    {
        name: 'Spy',
        description: 'At night, learn the role of a player. Also, you might register as good & as a Townsfolk or Outsider, even if dead.', // BotC's Spy is too overpowered; this version is nerfed.
        team: Team.EVIL, type: PlayerType.MINION,
        icon: 'roles/Leather Helmet',
        night: 'Learn which role a player has.',
    },
    {
        name: 'Baron',
        description: 'There are extra (+2) Outsiders in play.',
        team: Team.EVIL, type: PlayerType.MINION,
        icon: 'roles/Iron Key',

        prereqRoles: [
            { key: 'type', value: PlayerType.OUTSIDER, count: 3 },
        ],
    },
    {
        name: 'Scarlet Woman',
        description: 'If there are 5 or more players alive & the Werewolf dies, you become the Werewolf.',
        team: Team.EVIL, type: PlayerType.MINION,
        icon: 'roles/Cut Ruby',
    },
    {
        name: 'Gobbo', altName: 'Goblin',
        description: 'If you are nominated and publicly claim "Me Boblin!" before votes are cast, and are then executed, your team wins. You must speak like a goblin (or caveman) all game, or you may die.',
        team: Team.EVIL, type: PlayerType.MINION,
        icon: 'roles/Slime Gel',
    },
    {
        name: 'Marionette',
        description: 'You think you are a good character, but you are not. The Werewolf knows who you are; you neighbour them.',
        team: Team.EVIL, type: PlayerType.MINION,
        icon: 'roles/Rope',
    },
]

export default roles;
