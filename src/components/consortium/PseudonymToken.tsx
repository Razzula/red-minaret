import pseudonyms from "../../data/pseudonyms";
import { Tooltip, TooltipClickContent, TooltipContent, TooltipHoverContent, TooltipTrigger } from "../common";
import GridList from "../common/GridList/GridList";

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
                        <div>
                            <button onClick={() => renamePlayer()}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <i className='ra ra-quill-ink' />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Rename
                                    </TooltipContent>
                                </Tooltip>
                            </button>
                        </div>
                            <GridList columns={3}>
                                {
                                    pseudonyms.map((newPseudonym) => (
                                        <Tooltip key={newPseudonym}
                                            enableHover={true}
                                        >
                                            <TooltipTrigger>
                                                <img key={newPseudonym}
                                                    src={`/red-minaret/characters/${newPseudonym}.png`}
                                                    alt={pseudonym}
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
