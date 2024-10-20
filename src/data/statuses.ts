export type Status = {
    name: string;
    description: string;
    expiration?: number;
}

export const statuses: { [key: string]: Status } = {
    'Drunk': {
        name: 'Drunk',
        description: 'This player does not know that they are the Drunk. They think they are a Villager, but are not.',
    },
    'Red Herring': {
        name: 'Red Herring',
        description: 'This player registers as a Werewolf to the Seer.',
    },
    'Protected': {
        name: 'Protected',
        description: 'The Doctor has protected this player from the Werewolf.',
        expiration: 1, // expires at morning
    },
    "'Protected'": {
        name: "'Protected'",
        description: 'The Drunk has tried to protect this player from the Werewolf.',
        expiration: 1, // expires at morning
    },
    'Targeted': {
        name: 'Targeted',
        description: 'The Werewolf has targeted to kill this player.',
        expiration: 1, // expires at morning
    },
    'Patron': {
        name: 'Patron',
        description: 'The Butler can only vote if this player is voting too.',
        expiration: 0, // expires at night
    },
}

export default statuses;
