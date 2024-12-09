import { playSound } from '../utils/soundManager';
import sounds from '../data/sounds';
import IconButton from './common/IconButton/IconButton';

const Soundboard = () => {
    return (
        <div>
            {
                sounds
                    .filter((sound) => !sound.secret)
                    .map((sound) => (
                        <IconButton
                            key={sound.name}
                            icon={ sound.icon ? <i className={sound.icon} /> : sound.name}
                            onClick={() => playSound(sound.name)}
                            label={sound.name}
                        />
                    ))
            }
        </div>
    );
};

export default Soundboard;
