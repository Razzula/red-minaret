export type Pseudonym = {
    name: string;
    sound?: string;
}

export const pseudonyms: Pseudonym[] = [

    // Swinbourne Bois
    { name: 'Steve', sound: 'squeak' },
    { name: 'Marvin', sound: 'meow' },
    { name: 'Graham White', sound: 'meow' },
    { name: 'Grapes', sound: 'quack' },

    // D&DBeans
        // Mains
    { name: 'Boblin', sound: 'rAAAAllaaaAAAaaagghhh' },
    { name: 'Hush' },
    { name: 'Sabrina' },
    { name: 'Hanthur' },
    // { name: 'Ryker' },
    { name: 'Chortle' },

        // Extra
    // { name: 'Harran' },
    // { name: 'Billybob' },
    // { name: 'John' },
    { name: 'Baglin' },

        // NPCS
    // { name: 'Doblin' },
    // { name: 'Sir. Reginald Cheese' },
    // { name: 'Gorgonzola' },
    { name: 'Otto', sound: 'magic-bells' },
    // { name: 'Zazu' },
    // { name: 'Damien' },
    // { name: "Ku'Zaak" },

    // ...
    { name: 'Jerry' },

]

export default pseudonyms;
