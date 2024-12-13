import { useState } from 'react';

import { Dialog, DialogContent } from '../Dialog/Dialog';

export type PromptOptions = {
    title: string;
    message: string;
    type: 'text' | 'bool';
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    onCancel?: () => void;
};

export function usePrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<PromptOptions | null>(null);

    const showPrompt = (opts: PromptOptions) => {
        setOptions(opts);
        setInputValue('');
        setIsOpen(true);
    };

    const confirm = () => {
        options?.onConfirm(inputValue);
        setIsOpen(false);
    };

    const cancel = () => {
        options?.onCancel?.();
        setIsOpen(false);
    };

    const PromptDialog = isOpen && options ? (
        <Dialog open={isOpen}>
            <DialogContent>
                <div className='dialogue-content column'>
                    <div className='dialogue-header'>{options.title}</div>
                    <div className='dialogue-body'>{options.message}</div>
                    { options.type === 'text' &&
                        <input
                            type='text'
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className='dialogue-input'
                        />
                    }
                    <div className='dialogue-footer'>
                        <button className='good' onClick={confirm}>{ options.confirmText ?? 'Confirm' }</button>
                        <button className='evil' onClick={cancel}>{ options.cancelText ?? 'Cancel' }</button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    ) : null;

    return { showPrompt, PromptDialog };
}
