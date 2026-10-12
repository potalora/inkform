// Adapted from shadcn/ui base-nova Button and Dialog (MIT).
// Inkform owns the glass theme; Base UI owns keyboard and dialog behavior.
import React from 'react';
import {Button as ButtonPrimitive} from '@base-ui/react/button';
import {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {cva} from 'class-variance-authority';
import {cn} from 'cn';
import {X} from 'lucide-react';

const buttonVariants = cva('ui-button inline-flex items-center justify-center disabled:pointer-events-none disabled:opacity-50', {
  variants: {variant: {
    primary: 'primary', default: 'primary', secondary: 'secondary', outline: 'secondary',
    ghost: 'ghost', destructive: 'destructive', '': '',
  }},
  defaultVariants: {variant: 'secondary'},
});
export function Button({variant = 'secondary', className, type = 'button', ...props}) {
  return <ButtonPrimitive data-slot="button" type={type} className={cn(buttonVariants({variant}), className)} {...props} />;
}
export function Field({label, className, children, ...props}) {
  return <label className={cn('field', className)} {...props}>{label}{children}</label>;
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

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({className, children, showCloseButton = true, ...props}) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Backdrop className="ui-dialog-backdrop fixed inset-0 z-50" />
    <DialogPrimitive.Popup data-slot="dialog-content" className={cn('ui-dialog glass-surface', className)} {...props}>
      {children}
      {showCloseButton && <DialogPrimitive.Close render={<Button variant="ghost" className="dialog-close" />} aria-label="Close">
        <X size={18} aria-hidden="true" /><span className="sr-only">Close</span>
      </DialogPrimitive.Close>}
    </DialogPrimitive.Popup>
  </DialogPrimitive.Portal>;
}
