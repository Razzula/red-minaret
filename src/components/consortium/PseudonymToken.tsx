import pseudonyms from '../../data/pseudonyms';
import { Tooltip, TooltipClickContent, TooltipContent, TooltipHoverContent, TooltipTrigger } from '../common/Tooltip/Tooltip';
import GridList from '../common/GridList/GridList';
import IconButton from '../common/IconButton/IconButton';
import { playSound } from '../../utils/soundManager';

import styles from './Consortium.module.scss';

type PseudonymTokenProps = {
    pseudonym: string;
    realName?: string;
    centreX: number;
    centreY: number;
    radius: number;
    angle: number;

    setPseudonym: (pseudonym: string) => void;
    renamePlayer: () => void;
};

const PseudonymToken: React.FC<PseudonymTokenProps> = ({pseudonym, realName, centreX, centreY, radius, angle, renamePlayer, setPseudonym}) => {

    const newX = centreX + (radius - 50) * Math.sin(angle);
    const newY = centreY - (radius - 50) * Math.cos(angle);

    function handleClick(event: React.MouseEvent<HTMLImageElement, MouseEvent>) {
        event.preventDefault();
        if (event.ctrlKey) {
            renamePlayer();
            event.stopPropagation();
        }
        else if (event.button !== 0) {
            if (['Graham White', 'Marvin'].includes(pseudonym)) {
                playSound('meow');
            }
            else if ('Steve' ===  pseudonym) {
                playSound('squeak');
            }
        }
    }

    return (
        <div
            className={styles.status}
            style={{
                left: `${newX}px`,
                top: `${newY}px`,
                position: 'absolute',
            }}
        >
            <Tooltip enableClick={true} enableHover={true}>
                <TooltipTrigger>
                    <div className={styles.profilePicture}>
                        <img
                            onMouseDown={handleClick}
                            src={`/red-minaret/characters/${pseudonym}.png`}
                            alt={pseudonym}
                            className={styles.profilePicture}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <TooltipHoverContent>
                        <div><strong>{pseudonym}</strong> ({realName})</div>
                    </TooltipHoverContent>
                    <TooltipClickContent>
                        <IconButton
                            icon={<i className='ra ra-quill-ink' />}
                            onClick={() => renamePlayer()}
                            label='Rename'
                            className='wide'
                        />
                        <hr />
                        <GridList columns={3}>
                            {
                                pseudonyms.map((newPseudonym) => (
                                    <Tooltip key={newPseudonym}
                                        enableHover={true}
                                    >
                                        <TooltipTrigger>
                                            <img key={newPseudonym}
                                                src={`/red-minaret/characters/${newPseudonym}.png`}
                                                alt={newPseudonym}
                                                className={styles.profilePicture}
                                                style={{
                                                    borderRadius: '20%',
                                                }}
                                                onClick={() => setPseudonym(newPseudonym)}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div><strong>{newPseudonym}</strong></div>
                                        </TooltipContent>
                                    </Tooltip>
                                ))
                            }
                        </GridList>
                    </TooltipClickContent>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default PseudonymToken;
