import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip/Tooltip';

interface IconButtonProps {
    icon: JSX.Element;
    onClick?: () => void;
    disabled?: boolean;
    label: string | JSX.Element;
    className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onClick,
    disabled = false,
    label,
    className,
}) => {
    return (
        <Tooltip enableHover={true} restMs={100}>
            <TooltipTrigger>
                <button
                    className={className || ''}
                    onClick={onClick}
                    disabled={disabled}
                >
                    {icon}
                </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
};

export default IconButton;
