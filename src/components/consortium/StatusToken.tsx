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
    centrepieceRadius: number;
    playerX: number;
    playerY: number;
    consortiumRadius: number;
    playerRadius: number;
    angle: number;
    isPlayerActive: boolean;
    playerRole?: Role;
    removeStatus: (status: Status) => void;
};

const StatusToken: React.FC<StatusTokenProps> = ({
    status, index, centreX, centreY, centrepieceRadius, playerX, playerY, playerRadius, angle,
    isPlayerActive, playerRole, removeStatus
}) => {

    const maxStatusLength = 4;
    const t = index / (maxStatusLength - 1);

    // position of consortium centre, towards player; endpoint of status 'chain'
    const innerX = centreX + (1.5 * centrepieceRadius * Math.sin(angle));
    const innerY = centreY - (1.5 * centrepieceRadius * Math.cos(angle));
    
    // position of player centre, towards centre; endpoint of status 'chain'
    const outterX = playerX - (playerRadius * Math.sin(angle));
    const outterY = playerY + (playerRadius * Math.cos(angle));

    // const distanceMultiplier = 1;
    const newX = outterX + t * (innerX - outterX);
    const newY = outterY + t * (innerY - outterY);

    const fake = status.intoxicated;

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
