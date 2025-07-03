export type Script = {
    name: string;
    description: string;
    icon: string;
    roles: string[];
}

export const TroubleBrewing: string[] = [
    'Washerwoman',
    'Librarian',
    'Investigator',
    'Chef',
    'Empath',
    'Seer',
    'Undertaker',
    'Doctor',
    'Ravenkeeper',
    'Virgin',
    'Hunter',
    'Soldier',
    'Mayor',
    'Butler',
    'Drunk',
    'Recluse',
    'Saint',
    'Poisoner',
    'Spy',
    'Scarlet Woman',
    'Baron',
    'Werewolf',
]

const TajGardens: string[] = [
    'Seer',
    'Doctor',
    'Hunter',
    'Soldier',
    'Empath',
    'Washerwoman',
    'Librarian',
    'Undertaker',
    'Ravenkeeper',
    'Butler',
    'Recluse',
    'Werewolf',
    'Spy',
    'Scarlet Woman',
]

const TajMausoleum: string[] = [
    ...TajGardens,
    'Chef',
    'Investigator',
    'Virgin',
    'Mayor',
    'Gambler',
    'Fool',
    'Artist',
    'Nain',
    'Drunk',
    'Saint',
    'Poisoner',
    'Baron',
]

export const scripts: Script[] = [
    {
        'name': 'Trouble Brewing',
        'description': 'Beginner. Recommended for players and Storytellers new to Blood on the Clocktower or to social deception games.',
        'icon': 'statuses/Beer',
        'roles': TroubleBrewing,
    },
    {
        'name': 'Taj Gardens',
        'description': 'Early, accessible, gentle — the outer beauty and calm of the Charbagh gardens. Left-hand side of the initial Taj Mahal sheet.',
        'icon': 'roles/Shovel',
        'roles': TajGardens,
    },
    {
        'name': 'Taj Mausoleum',
        'description': 'Core experience — the main structure, rich with intrigue and depth. Initial sheet of the Taj Mahal.',
        'icon': 'roles/Golden Key',
        'roles': TajMausoleum,
    },
]
