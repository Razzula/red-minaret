import { Howl } from 'howler';

const sounds = {
    meow: new Howl({ src: ['/red-minaret/audio/meow.mp3'], preload: true }),
    squeak: new Howl({ src: ['/red-minaret/audio/squeak.mp3'], preload: true }),
};

export const playSound = (key: keyof typeof sounds) => {
    sounds[key]?.play();
};
