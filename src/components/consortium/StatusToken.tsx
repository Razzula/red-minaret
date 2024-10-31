import classNames from 'classnames';

import { Tooltip, TooltipContent, TooltipTrigger } from "../common";

import { Status } from '../../data/statuses';
import { Role } from "../../data/roles";

import styles from './Consortium.module.scss';

type StatusTokenProps = {
    status: Status;
    index: number;
    centreX: number;
    centreY: number;
    radius: number;
    angle: number;
    isPlayerActive: boolean;
    playerRole?: Role;
};

const StatusToken: React.FC<StatusTokenProps> = ({status, index, centreX, centreY, radius, angle, isPlayerActive, playerRole}) => {

    const distanceMultiplier = (2 - index) / 3;
    const newX = centreX + radius * distanceMultiplier * Math.sin(angle);
    const newY = centreY - radius * distanceMultiplier * Math.cos(angle);

    const fake = status.drunk || status.poisoned;

    return (
        <div key={index}
            className={styles.status}
            style={{
                left: `${newX}px`,
                top: `${newY}px`,
                position: 'absolute',
            }}
        >
            <Tooltip>
                <TooltipTrigger>
                    <button
                        className={classNames(
                          styles.circleButton,
                          styles.statusCircle,
                          {
                              [styles.fake]: fake,
                              [styles.inactive]: isPlayerActive,
                          } as never,
                        )}
                        key={index}
                        disabled={playerRole === undefined}
                    >
                        <img
                            src={`/red-minaret/icons/${status.icon}.png`}
                            alt={status.name}
                            className={styles.statusCircleImg}
                        />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <div><strong>{status.name}</strong></div>
                    {fake && status.altDescription ? status.altDescription : status.description}
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default StatusToken;
