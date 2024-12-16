import { useState } from 'react';
import { Dialog, DialogContent } from '../Dialog/Dialog';

export type PromptOptions = {
    title: string;
    message: string;
    extras?: string[];
    type: 'text' | 'bool' | 'select';
    confirmText?: string;
    cancelText?: string;
    options?: string[];
};

export function usePrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<PromptOptions | null>(null);
    const [resolver, setResolver] = useState<((value: string | boolean | null) => void) | null>(null);

    const showPrompt = (opts: PromptOptions): Promise<string | boolean | null> => {
        setOptions(opts);
        setIsOpen(true);

        if (opts.type === 'select') {
            setInputValue(opts.options?.[0] ?? '');
        }
        else {
            setInputValue('');
        }

        return new Promise((resolve) => {
            setResolver(() => resolve);
        });
    };

    const confirm = () => {
        const result = (() => {
            switch (options?.type) {
                case 'text':
                case 'select':
                    return inputValue;
                case 'bool':
                    return true;
                default:
                    return null;
            }
        })();

        resolver?.(result); // resolve with the determined result
        setIsOpen(false);
    };


    const cancel = () => {
        resolver?.(null); // resolve with null if cancelled
        setIsOpen(false);
    };

    const PromptDialog = isOpen && options ? (
        <Dialog open={isOpen}>
            <DialogContent>
                <div className='dialogue-content column'>
                    <div className='dialogue-header'>{options.title}</div>
                    <div className='dialogue-body'>{options.message}</div>

                    {/* EXTRAS */}
                    { options.extras &&
                        options.extras.map((extra, index) => (
                            <div key={index} className='dialogue-body private'>{extra}</div>
                        ))
                    }

                    {/* INPUT */}
                    { options.type === 'text' && (
                        <input
                            type='text'
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className='dialogue-input'
                        />
                    )}
                    { options.type === 'select' && (
                        <select
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className='dialogue-input'
                        >
                            {options.options?.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    )}

                    {/* BUTTONS */}
                    <div className='dialogue-footer'>
                        <button className='good' onClick={confirm}>
                            {options.confirmText ?? 'Confirm'}
                        </button>
                        <button className='evil' onClick={cancel}>
                            {options.cancelText ?? 'Cancel'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    ) : null;

    return { showPrompt, PromptDialog };
}
