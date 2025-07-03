import * as React from "react";
import {
    useFloating,
    useClick,
    // useDismiss,
    useRole,
    useInteractions,
    useMergeRefs,
    FloatingPortal,
    FloatingFocusManager,
    FloatingOverlay,
} from "@floating-ui/react";

import styles from './Dialogue.module.scss';

interface DialogueOptions {
    initialOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function useDialogue({
    initialOpen = false,
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: DialogueOptions = {}) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);
    const [labelId, setLabelId] = React.useState<string | undefined>();
    const [descriptionId, setDescriptionId] = React.useState<
        string | undefined
    >();

    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = setControlledOpen ?? setUncontrolledOpen;

    const data = useFloating({
        open,
        onOpenChange: setOpen
    });

    const context = data.context;

    const click = useClick(context, {
        enabled: controlledOpen == null
    });
    // const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
    const role = useRole(context);

    const interactions = useInteractions([click, /*dismiss,*/ role]);

    return React.useMemo(
        () => ({
            open,
            setOpen,
            ...interactions,
            ...data,
            labelId,
            descriptionId,
            setLabelId,
            setDescriptionId
        }),
        [open, setOpen, interactions, data, labelId, descriptionId]
    );
}

type ContextType =
    | (ReturnType<typeof useDialogue> & {
        setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
        setDescriptionId: React.Dispatch<
            React.SetStateAction<string | undefined>
        >;
    })
    | null;

const DialogueContext = React.createContext<ContextType>(null);

export const useDialogueContext = () => {
    const context = React.useContext(DialogueContext);

    if (context == null) {
        throw new Error("Dialogue components must be wrapped in <Dialogue />");
    }

    return context;
};

export function Dialogue({
    children,
    ...options
}: {
    children: React.ReactNode;
} & DialogueOptions) {
    const Dialogue = useDialogue(options);
    return (
        <DialogueContext.Provider value={Dialogue}>{children}</DialogueContext.Provider>
    );
}

interface DialogueTriggerProps {
    children: React.ReactNode;
    asChild?: boolean;
}

export const DialogueTrigger = React.forwardRef<
    HTMLElement,
    React.HTMLProps<HTMLElement> & DialogueTriggerProps
>(function DialogueTrigger({ children, asChild = false, ...props }, propRef) {
    const context = useDialogueContext();
    const childrenRef = (children as any).ref;
    const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

    // `asChild` allows the user to pass any element as the anchor
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(
            children,
            context.getReferenceProps({
                ref,
                ...props,
                ...children.props,
                "data-state": context.open ? "open" : "closed"
            })
        );
    }

    return (
        <div
            ref={ref}
            // type="button"
            // The user can style the trigger based on the state
            className="floating-button"
            data-state={context.open ? "open" : "closed"}
            {...context.getReferenceProps(props)}
            style={{ left: '4.25rem' }}
        >
            {children}
        </div>
    );
});

type DialogueContentProps = React.HTMLProps<HTMLDivElement> & {
    overlayopacity?: number;
};

export const DialogueContent = React.forwardRef<HTMLDivElement, DialogueContentProps>(
    function DialogueContent(props , propRef) {
        const { overlayopacity = 0.5, children, ...rest } = props;
        console.warn('overlayopacity', overlayopacity);

        const { context: floatingContext, ...context } = useDialogueContext();
        const ref = useMergeRefs([context.refs.setFloating, propRef]);

        if (!floatingContext.open) return null;

        return (
            <FloatingPortal>
                <FloatingOverlay
                    className={styles.DialogueOverlay}
                    lockScroll
                    style={{ '--dialogue-overlay-opacity': overlayopacity } as React.CSSProperties}
                >
                    <FloatingFocusManager context={floatingContext}>
                        <div
                            ref={ref}
                            aria-labelledby={context.labelId}
                            aria-describedby={context.descriptionId}
                            {...context.getFloatingProps(rest)}
                        >
                            {children}
                        </div>
                    </FloatingFocusManager>
                </FloatingOverlay>
            </FloatingPortal>
        );
    }
);

export const DialogueClose = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(function DialogueClose(props, ref) {
    const { setOpen } = useDialogueContext();
    return (
        <button type="button" {...props} ref={ref} onClick={() => setOpen(false)} />
    );
});
