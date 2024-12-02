import { Tooltip, TooltipContent, TooltipTrigger } from "../common";

import styles from './Consortium.module.scss';

type PseudonymTokenProps = {
    pseudonym: string;
    realName?: string;
    centreX: number;
    centreY: number;
    radius: number;
    angle: number;
};

const PseudonymToken: React.FC<PseudonymTokenProps> = ({pseudonym, realName, centreX, centreY, radius, angle}) => {

    const distanceMultiplier = 4 / 3;
    const newX = centreX + radius * distanceMultiplier * Math.sin(angle);
    const newY = centreY - radius * distanceMultiplier * Math.cos(angle);

    return (
        <div
            className={styles.status}
            style={{
                left: `${newX}px`,
                top: `${newY}px`,
                position: 'absolute',
            }}
        >
            <Tooltip>
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
                    <div><strong>{pseudonym}</strong> ({realName})</div>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default PseudonymToken;
