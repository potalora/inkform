// Adapted from shadcn/ui base-nova Button and Dialog (MIT).
// Inkform owns the glass theme; Base UI owns keyboard and dialog behavior.
import React, {createContext, useContext, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Button as ButtonPrimitive} from '@base-ui/react/button';
import {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {Select as SelectPrimitive} from '@base-ui/react/select';
import {cva} from 'class-variance-authority';
import {cn} from 'cn';
import {Check, ChevronDown, X} from 'lucide-react';
import {useStudioReducedMotion, UI_SPRING} from './motion.jsx';

const buttonVariants = cva('ui-button inline-flex items-center justify-center disabled:pointer-events-none disabled:opacity-50', {
  variants: {variant: {
    primary: 'primary', default: 'primary', secondary: 'secondary', outline: 'secondary',
    ghost: 'ghost', destructive: 'destructive', plain: '',
  }},
  defaultVariants: {variant: 'secondary'},
});
export function Button({variant = 'secondary', className, type = 'button', ...props}) {
  const reducedMotion = useStudioReducedMotion();
  return <ButtonPrimitive data-slot="button" type={type} className={cn(buttonVariants({variant: variant || 'plain'}), className)}
    render={<motion.button whileTap={reducedMotion || props.disabled ? undefined : {scale: .97}} transition={UI_SPRING} />} {...props} />;
}
export function Field({label, className, children, ...props}) {
  return <label className={cn('field', className)} {...props}>{label}{children}</label>;
}
/** The same keyboard, typeahead and focus behavior for every studio picker. */
export function Select({id, value, items, disabled, onValueChange, className, ...props}) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useStudioReducedMotion();
  const choices = items.flatMap(item => item.items || [item]);
  const option = item => <SelectPrimitive.Item key={item.value} value={item.value} disabled={item.disabled} className="select-option">
    <SelectPrimitive.ItemIndicator className="select-check"><Check size={15} aria-hidden="true" /></SelectPrimitive.ItemIndicator>
    <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>;
  return <SelectPrimitive.Root open={open} onOpenChange={setOpen} value={value} items={choices} disabled={disabled} onValueChange={next => { if (next !== null) onValueChange(next); }}>
    <SelectPrimitive.Trigger id={id} className={cn('select-trigger', className)} {...props}>
      <SelectPrimitive.Value className="select-value" />
      <SelectPrimitive.Icon className="select-chevron" render={<motion.span animate={{rotate: open ? 180 : 0}} transition={reducedMotion ? {duration: 0} : UI_SPRING} />}><ChevronDown size={14} aria-hidden="true" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    {/* Base UI force-mounts hidden items for closed-trigger typeahead. Its
        closing lifecycle detects the Motion opacity animation automatically. */}
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner className="select-positioner" align="start" sideOffset={6} collisionPadding={8} alignItemWithTrigger={false}>
        <SelectPrimitive.Popup className="select-popup glass-surface" render={<motion.div
          initial={reducedMotion ? false : {opacity: 0, y: -3, scale: .985}}
          animate={{opacity: open ? 1 : 0, y: open ? 0 : -3, scale: open ? 1 : .985}}
          transition={reducedMotion ? {duration: 0} : {duration: .16, ease: [.2, .8, .2, 1]}} />}>
          <SelectPrimitive.List className="select-list">
            {items.map(item => item.items
              ? <SelectPrimitive.Group key={item.label}><SelectPrimitive.GroupLabel className="select-group-label">{item.label}</SelectPrimitive.GroupLabel>{item.items.map(option)}</SelectPrimitive.Group>
              : option(item))}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
/** Return focus to the visible disclosure before an action opens another surface. */
export function closeMenuThen(event, action) {
  const menu = event.currentTarget.closest('details');
  menu?.removeAttribute('open');
  menu?.querySelector(':scope > summary')?.focus();
  return action();
}
export function RangeControl({id, label, value, min, max, step, disabled, format = String, onChange, onCommit}) {
  return <div className="range-control">
    <label htmlFor={id}>{label}</label><output id={`${id}-value`} htmlFor={id}>{format(value)}</output>
    <input id={id} type="range" value={value} min={min} max={max} step={step} disabled={disabled} aria-valuetext={format(value)}
      onChange={event => onChange(Number(event.target.value))} onBlur={onCommit} onPointerUp={onCommit} onKeyUp={onCommit} />
  </div>;
}

const DialogOpenContext = createContext(false);
export function Dialog({open: controlledOpen, defaultOpen = false, onOpenChange, children, ...props}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  return <DialogOpenContext.Provider value={open}>
    <DialogPrimitive.Root open={open} onOpenChange={(next, details) => {
      if (controlledOpen === undefined) setLocalOpen(next);
      onOpenChange?.(next, details);
    }} {...props}>{children}</DialogPrimitive.Root>
  </DialogOpenContext.Provider>;
}
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({className, children, showCloseButton = true, ...props}) {
  const open = useContext(DialogOpenContext);
  const reducedMotion = useStudioReducedMotion();
  const transition = reducedMotion ? {duration: 0} : {duration: .18, ease: [.2, .8, .2, 1]};
  return <AnimatePresence>{open && <DialogPrimitive.Portal keepMounted>
    <DialogPrimitive.Backdrop className="ui-dialog-backdrop fixed inset-0 z-50" render={<motion.div
      initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={transition} />} />
    <DialogPrimitive.Popup data-slot="dialog-content" className={cn('ui-dialog glass-surface', className)}
      render={<motion.div initial={reducedMotion ? false : {opacity: 0, y: 8, scale: .985}}
        animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: 4, scale: .985}} transition={transition} />} {...props}>
      {children}
      {showCloseButton && <DialogPrimitive.Close render={<Button variant="ghost" className="dialog-close" />} aria-label="Close">
        <X size={18} aria-hidden="true" /><span className="sr-only">Close</span>
      </DialogPrimitive.Close>}
    </DialogPrimitive.Popup>
  </DialogPrimitive.Portal>}</AnimatePresence>;
}
