import React from 'react';
import { FloatingPortal, Placement, autoUpdate, flip, offset, shift, useClick, useDismiss, useFloating, useHover, useInteractions, useMergeRefs, useRole } from '@floating-ui/react';

import '../../styles/tooltip.css';

interface TooltipOptions {
    initialOpen?: boolean;
    placement?: Placement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    enableHover?: boolean;
    enableClick?: boolean;
}

function useTooltip({
    initialOpen = false,
    placement = 'top',
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    enableHover = true,
    enableClick = false,
}: TooltipOptions = {}) {

    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = setControlledOpen ?? setUncontrolledOpen;

    const data = useFloating({
        placement,
        open,
        onOpenChange: setOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(5),
            flip({
                crossAxis: placement.includes('-'),
                fallbackAxisSideDirection: 'start',
                padding: 5
            }),
            shift({ padding: 5 })
        ]
    });


    const dismiss = useDismiss(data.context);
    const role = useRole(data.context, { role: 'tooltip' });

    const click = useClick(data.context, {
        event: 'click',
        enabled: enableClick,
    });
    const hover = useHover(data.context, {
        move: false,
        enabled: enableHover,
    });

    const interactions = useInteractions([dismiss, role, click, hover]);

    return React.useMemo(
        () => ({
            open,
            setOpen,
            ...interactions,
            ...data
        }),
        [open, setOpen, interactions, data]
    );

}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

const useTooltipContext = () => {
    const context = React.useContext(TooltipContext);

    if (context == null) {
        throw new Error('Tooltip components must be wrapped in <Tooltip />');
    }

    return context;
};

export function Tooltip({
    children,
    ...options
}: { children: React.ReactNode } & TooltipOptions) {
    const tooltip = useTooltip(options);
    return (
        <TooltipContext.Provider value={tooltip}>
            {children}
        </TooltipContext.Provider>
    );
}

export const TooltipTrigger = React.forwardRef<
    HTMLElement,
    React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(function TooltipTrigger({ children, asChild = false, ...props }, propRef) {
    const context = useTooltipContext();
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
        <span
            ref={ref}
            // the user can style the trigger based on the state
            data-state={context.open ? "open" : "closed"}
            style={{ cursor: "default", ...props.style }}
            {...context.getReferenceProps(props)}
        >
            {children}
        </span>
    );
});

export const TooltipContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLProps<HTMLDivElement>
>(function TooltipContent({ style, ...props }, propRef) {
    const context = useTooltipContext();
    const ref = useMergeRefs([context.refs.setFloating, propRef]);

    if (!context.open) return null;

    return (
        <FloatingPortal>
            <div className='Tooltip'
                ref={ref}
                style={{
                    ...context.floatingStyles,
                    ...style,
                    flexDirection: 'column',
                }}
                {...context.getFloatingProps(props)}
            />
        </FloatingPortal>
    );
});
