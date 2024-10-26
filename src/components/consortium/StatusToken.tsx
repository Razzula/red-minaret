import { Tooltip, TooltipContent, TooltipTrigger } from "../common/Tooltip";
import { Status } from '../../data/statuses';
import { Role } from "../../data/roles";

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
            className='status'
            style={{
                left: `${newX}px`,
                top: `${newY}px`,
                position: 'absolute',
            }}
        >
            <Tooltip>
                <TooltipTrigger>
                    <button
                        className={`circle-button status-circle ${fake ? 'fake' : ''} ${status} ${isPlayerActive}`}
                        key={index}
                        disabled={playerRole === undefined}
                    >
                        <img
                            src={`/red-minaret/iconpack/${status.icon}.png`}
                            alt={status.name}
                            className={`status-circle-img`}
                        />
                    </button>
                </TooltipTrigger>
                <TooltipContent>{fake ? status.altDescription : status.description}</TooltipContent>
            </Tooltip>
        </div>
    );
};

export default StatusToken;
