import classNames from 'classnames';

import { Tooltip, TooltipContent, TooltipHoverContent, TooltipTrigger } from '../common/Tooltip/Tooltip';

import { Status } from '../../data/statuses';
import { Role } from '../../data/roles';

import styles from './Consortium.module.scss';
import IconButton from '../common/IconButton/IconButton';

type StatusTokenProps = {
    status: Status;
    index: number;
    centreX: number;
    centreY: number;
    radius: number;
    angle: number;
    isPlayerActive: boolean;
    playerRole?: Role;
    removeStatus: (status: Status) => void;
};

const StatusToken: React.FC<StatusTokenProps> = ({status, index, centreX, centreY, radius, angle, isPlayerActive, playerRole, removeStatus}) => {

    const maxStatuses = 3;
    const distanceMultiplier = (maxStatuses - (index + 1)) / maxStatuses;
    const newX = centreX + (radius - 50) * distanceMultiplier * Math.sin(angle);
    const newY = centreY - (radius - 50) * distanceMultiplier * Math.cos(angle);

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
            <Tooltip enableHover={true} enableClick={true}>
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
                    <TooltipHoverContent>
                        <div
                            style={{
                                maxWidth: '400px',
                            }}
                        >
                            <div><strong>{status.name}</strong></div>
                            {fake && status.altDescription ? status.altDescription : status.description}
                        </div>
                    </TooltipHoverContent>
                    <hr />
                    <IconButton
                        icon={<i className='ra ra-cancel' />}
                        onClick={() => removeStatus(status)}
                        label='Remove Status'
                    />
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default StatusToken;
