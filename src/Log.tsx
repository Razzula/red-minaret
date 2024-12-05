import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from './components/common/Tooltip/Tooltip';
import { LogEvent } from './App';

interface LogProps {
    events: LogEvent[];
}

const Log: React.FC<LogProps> = ({ events }) => {
    return (
        <div className='log'>
            { events.length > 0 ?
                events.map((entry, index) => (
                    <div key={index} className='logMessage'
                        style={{
                            marginLeft: entry.indent ? `${entry.indent * 20}px` : '0',
                        }}
                    >
                        <span className={entry.type}>{entry.message}</span>
                        { entry.extra &&
                            <Tooltip>
                                <TooltipTrigger>
                                    <i className='private ra ra-help' style={{ margin: 10, cursor: 'help' }} />
                                </TooltipTrigger>
                                <TooltipContent>{entry.extra}</TooltipContent>
                            </Tooltip>
                        }
                    </div>
                ))
                :
                <div className='logMessage'><i>Nothing to report...</i></div>
            }
        </div>
    );
};

export default Log;
