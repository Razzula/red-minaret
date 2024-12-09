import { Howl } from 'howler';
import sounds from '../data/sounds';

const howls = sounds.reduce((acc, sound) => {
    acc[sound.name] = new Howl({
        src: [`/red-minaret/audio/${sound.name}.mp3`],
        preload: true,
    });
    return acc;
}, {} as Record<string, Howl>);
console.log(howls);

export const playSound = (key: keyof typeof howls) => {
    howls[key]?.play();
};
