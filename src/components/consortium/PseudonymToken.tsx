import { Tooltip, TooltipClickContent, TooltipContent, TooltipHoverContent, TooltipTrigger } from "../common";

import styles from './Consortium.module.scss';

type PseudonymTokenProps = {
    pseudonym: string;
    realName?: string;
    centreX: number;
    centreY: number;
    radius: number;
    angle: number;

    renamePlayer: () => void;
};

const PseudonymToken: React.FC<PseudonymTokenProps> = ({pseudonym, realName, centreX, centreY, radius, angle, renamePlayer}) => {

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
                        <button onClick={renamePlayer}>rename</button>
                    </TooltipClickContent>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default PseudonymToken;
