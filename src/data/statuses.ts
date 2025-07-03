export type Status = {
    name: string;
    description: string;
    expiration?: number;
    icon: string;
    intoxicated?: boolean;
    altDescription?: string;

    notes?: string[];
}

export const statuses: { [key: string]: Status } = {
    'Drunk': {
        name: 'Drunk',
        description: 'This player does not know, but they are the Drunk. They think they are a Villager, but are not. None of their abilities work.',
        icon: 'statuses/Beer',

        notes: [
            "A Drunk player's ability will not work. If they are an investigator role: feed them false information. If they perform an action: that action fails.",
        ],
    },
    'Red Herring': {
        name: 'Red Herring',
        description: 'This player registers as a Werewolf to the Seer.',
        icon: 'statuses/Fish Steak',
    },
    'Protected': {
        name: 'Protected',
        description: 'The Doctor has protected this player from the Werewolf.',
        expiration: 1, // expires at morning
        icon: 'roles/Red Potion 3',
        altDescription: 'The $ROLE$ has tried to protect this player from the Werewolf.'
    },
    'Targeted': {
        name: 'Targeted',
        description: 'The Werewolf has targeted to kill this player.',
        expiration: 1, // expires at morning
        icon: 'roles/Monster Meat',
        altDescription: 'The $ROLE$ has tried to kill this player.',
    },
    'Patron': {
        name: 'Patron',
        description: 'The Butler can only vote if this player is voting too.',
        expiration: 0, // expires at night
        icon: 'roles/Envelope',
        altDescription: 'The Butler has tried to select this player as their Patron.',
    },
    'Poisoned': {
        name: 'Poisoned',
        description: "This player's ability is nullified for the day.",
        expiration: 0, // expires at night
        icon: 'roles/Green Potion 2',

        notes: [
            "A Poisoned player's ability will not work. If they are an investigator role: feed them false information. If they perform an action: that action fails.",
        ],
    },
    'Grandchild': {
        name: 'Grandchild',
        description: "This player is the Nain's grandchild.",
        icon: 'roles/Wooden Staff',
    },
    'Goblin': {
        name: 'Goblin',
        description: 'This player has made a valid Goblin claim.',
        expiration: 0, // expires at night
        icon: 'roles/Slime Gel',
    },
    'Marionette': {
        name: 'Marionette',
        description: 'This player does not know, but they are the Marionette. They think they are a Good player, but are not. None of their abilities work.',
        icon: 'roles/Rope',

        notes: [
            "A Marionette player's ability will not work. If they are an investigator role: feed them false information. If they perform an action: that action fails.",
        ],
    },
    'Lunatic': {
        name: 'Lunatic',
        description: 'This player does not know, but they are the Lunatic. They think they are a Werewolf, but are not. None of their abilities work.',
        icon: 'roles/Mushroom',

        notes: [
            "A Lunatic player's ability will not work. If they are an investigator role: feed them false information. If they perform an action: that action fails.",
        ],
    },
}

export default statuses;
