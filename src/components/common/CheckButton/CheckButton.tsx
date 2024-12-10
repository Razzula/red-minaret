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
        if (!disabled) {
            onChange(!isChecked);
        }
    };

    const buttonStyle: React.CSSProperties = {
        display: 'inline-block',
        padding: '0.5rem',
        border: 'none',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'none',
        opacity: !isChecked || disabled ? 0.5 : 1,
        borderBottom: isChecked ? `3px solid ${disabled ? '#333333' : '#007acc'}` : 'none',
        transition: 'filter 0.3s, border-bottom 0.3s',
        position: 'relative',
        ...styles,
    };

    const imageStyle: React.CSSProperties = {
        width: imageWidth || '100%',
        height: imageHeight || 'auto',
        borderRadius: '20%',
        filter: isChecked && !disabled ? 'none' : 'grayscale(100%)',
        ...(isHovered && !isChecked ? { filter: 'grayscale(0%) brightness(1.2)' } : {}),
    };

    return (
        <button
            style={buttonStyle}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={disabled}
        >
            <div style={{ position: 'relative' }}>

                <img
                    src={image} alt={altText || 'check-button'}
                    className={className || ''}
                    style={imageStyle}
                />

                {disabled && (
                    <div>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='red'
                            strokeWidth='4'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '90%',
                                height: '90%',
                            }}
                        >
                            <line x1='18' y1='6' x2='6' y2='18' />
                            <line x1='6' y1='6' x2='18' y2='18' />
                        </svg>
                    </div>
                )}

            </div>
        </button>
    );
};

export default CheckButton;
