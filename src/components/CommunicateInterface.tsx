import React, { useEffect, useState } from 'react';
import IconButton from './common/IconButton/IconButton';

import './CommunicateInterface.css';
import roles from '../data/roles';
import statuses from '../data/statuses';
import { Tooltip, TooltipClickContent, TooltipContent, TooltipHoverContent, TooltipTrigger } from './common/Tooltip/Tooltip';
import GridList from './common/GridList/GridList';
import CheckButton from './common/CheckButton/CheckButton';
import { GameState } from '../App';

interface CommunicateInterfaceProps {
    onClose: () => void;
    gameState: GameState;
    initOptions?: string[];
}

const CommunicateInterface: React.FC<CommunicateInterfaceProps> = ({ onClose, initOptions }) => {

    const [options, setOptions] = useState<string[]>(initOptions || []);

    useEffect(() => {
        if (initOptions) {
            setOptions(initOptions);
        }
    }, [initOptions]);

    function commButton(text: string, index: number) {
        return (
            <IconButton
                className='commButton'
                icon={<span>{getIcon(text)}<h1>{text}</h1></span>}
                label={[
                    <TooltipHoverContent key='hover'>Set Data</TooltipHoverContent>,
                    <TooltipClickContent key='click'>
                        <GridList columns={6}>{ selectionPanel(roles, index) }</GridList>
                        <hr/>
                        <GridList columns={6}>{ selectionPanel(Object.values(statuses), index) }</GridList>
                        {/* <hr/> */}
                        {/* <GridList columns={6}>{ selectionPanel(gameState.players, index) }</GridList> */}
                    </TooltipClickContent>,
                ]}
            />
        );
    }

    function selectionPanel(pool: any[], index: number) {
        return pool.map((item) => (
            <Tooltip>
                <TooltipTrigger>
                    <CheckButton
                        key={item.name}
                        image={`/red-minaret/icons/${item.icon}.png`} altText={item.name}
                        isChecked={false}
                        onChange={() => setOptions(prev => {
                            const newOptions = [...prev];
                            newOptions[index] = item.name;
                            return newOptions;
                        })}
                    />
                </TooltipTrigger>
                <TooltipContent>
                    {item.name}
                </TooltipContent>
            </Tooltip>
        ));
    }

    function getIcon(text: string): JSX.Element | null {
        const iconData = roles.find(r => r.name === text) ?? statuses[text];
        if (iconData?.icon) {
            return <img
                src={`/red-minaret/icons/${iconData?.icon}.png`}
                alt={`${iconData?.name ?? 'no role'}`}
                style={{ width: '64px', height: '64px' }}
            />;
        }

        return null;
    }

    return (
        <div className='dialogue-content' style={{ padding: '20px' }}>
            <div className='welcome'>
                <div className='button-group'>

                    {/* set buttons */}
                    {
                        options.map((text, i) => (
                            commButton(text, i)
                        ))
                    }

                    {/* additional buttons */}
                    {
                        options.length < 3 && (
                            Array.from({ length: 3 - options.length }).map((_, i) => {
                                const index = options.length + i;
                                return (
                                    commButton(`...`, index)
                                );
                            })
                        )
                    }

                </div>

                <span>
                    <IconButton
                        icon={<i className='ra ra-cancel' />}
                        onClick={onClose}
                        label='Close'
                    />
                </span>
            </div>
        </div>
    );
};

export default CommunicateInterface;
