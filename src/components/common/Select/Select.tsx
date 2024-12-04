// import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, FloatingFocusManager, useInteractions, useClick, useDismiss, useRole, useListNavigation } from '@floating-ui/react';
// import React from 'react';

// import '../styles/select.css';

// interface SelectProps extends React.HTMLProps<HTMLElement> {
//     entries: { name: string; key: string; element: React.ReactNode }[],
//     handleSelect: (index: number) => void;
// }

// export const Select = React.forwardRef<
//     HTMLElement,
//     SelectProps
// >(function Select({ children, entries, handleSelect }) {

//     const [isOpen, setIsOpen] = React.useState(false);

//     const { refs, floatingStyles, context } = useFloating({
//         open: isOpen,
//         onOpenChange: setIsOpen,
//         placement: 'bottom',
//         middleware: [offset(10), flip(), shift()],
//         whileElementsMounted: autoUpdate,
//     });

//     const listRef = React.useRef<Array<HTMLElement | null>>([]);
//     // const listContentRef = React.useRef(temp);
//     // const isTypingRef = React.useRef(false);

//     const click = useClick(context, { event: "mousedown" });
//     const dismiss = useDismiss(context);
//     const role = useRole(context, { role: "listbox" });
//     const listNav = useListNavigation(context, {
//         listRef,
//         activeIndex: 0,
//         selectedIndex: 0,
//         onNavigate: () => {},
//         // This is a large list, allow looping.
//         loop: true,
//     });

//     const { getReferenceProps, getFloatingProps } = useInteractions(
//         [dismiss, role, listNav, click /*, typeahead */]
//     );

//     const handleSelection = (index: number) => {
//         handleSelect(index);
//         setIsOpen(false);
//     };

//     return (<>
//         <span
//             className='select-container'
//             ref={refs.setReference}
//             {...getReferenceProps()}
//         >
//             <span>
//                 {children}
//             </span>
//         </span>

//         {isOpen && (
//             <FloatingPortal>
//                 <FloatingFocusManager context={context} modal={false}>
//                     <div
//                         className='select-options'
//                         ref={refs.setFloating}
//                         style={{
//                             ...floatingStyles,
//                             overflowY: "auto",
//                             background: "--colour-button-background",
//                             minWidth: 100,
//                             borderRadius: 8,
//                             outline: 0,
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(5, 1fr)',
//                         }}
//                         {...getFloatingProps()}
//                     >
//                         {entries.map((entry, index) => (
//                             <div
//                                 key={entry.key}
//                                 style={{
//                                     cursor: 'pointer',
//                                 }}
//                                 onClick={() => handleSelection(index)}
//                             >
//                                 {entry.element}
//                             </div>
//                         ))}
//                     </div>
//                 </FloatingFocusManager>
//             </FloatingPortal>
//         )}

//     </>);
// });

// export default Select;
