import React, { useState } from 'react';

interface CheckButtonProps {
    image: string;
    imageWidth?: string;
    imageHeight?: string;
    altText?: string;
    isChecked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    styles?: React.CSSProperties;
}

const CheckButton: React.FC<CheckButtonProps> = ({ image, imageWidth, imageHeight, altText, isChecked, onChange, disabled, className, styles }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        onChange(!isChecked);
    };

    const buttonStyle: React.CSSProperties = {
        display: 'inline-block',
        padding: '0.5rem',
        border: 'none',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'none',
        filter: isChecked && !disabled ? 'none' : 'grayscale(100%)',
        opacity: !isChecked || disabled ? 0.5 : 1,
        borderBottom: isChecked ? `3px solid ${disabled ? '#333333' : '#007acc'}` : 'none',
        transition: 'filter 0.3s, border-bottom 0.3s',
        color: '#ffffff',
        ...(isHovered && !isChecked ? { filter: 'grayscale(0%) brightness(1.2)' } : {}),
        ...styles,
    };

    return (
        <button
            style={buttonStyle}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={disabled}
        >
            <img
                src={image} alt={altText || 'check-button'}
                className={className || ''}
                style={{
                    width: imageWidth || '100%', height: imageHeight || 'auto',
                    borderRadius: '20%',
                }}
            />
        </button>
    );
};

export default CheckButton;
