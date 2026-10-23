import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as SelectPrimitive from '@radix-ui/react-select'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ————————————————————————— Button ————————————————————————— */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13.5px] font-medium transition-all duration-200 tap disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-0 active:scale-[.985] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-ink-950 shadow-[0_10px_28px_-14px_hsl(var(--accent-glow))] hover:brightness-[1.06] hover:shadow-[0_14px_34px_-14px_hsl(var(--accent-glow))]',
        soft: 'bg-accent/14 text-accent-soft border border-accent/26 hover:bg-accent/22 hover:text-paper',
        glass:
          'glass !rounded-xl text-paper hover:border-line-strong hover:bg-ink-800/60',
        ghost: 'text-paper-soft hover:bg-paper/[.06] hover:text-paper',
        outline: 'border border-line-strong text-paper-soft hover:border-accent/40 hover:text-paper',
        danger: 'bg-danger/16 text-danger border border-danger/28 hover:bg-danger/24',
      },
      size: {
        sm: 'h-8 px-3 text-[12.5px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-[14.5px]',
        icon: 'h-9 w-9',
        iconSm: 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'

/* ————————————————————————— Input ————————————————————————— */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-line bg-ink-900/60 px-3.5 text-[13.5px] text-paper',
        'placeholder:text-paper-faint transition-colors duration-200',
        'hover:border-line-strong focus:border-accent/50 focus:bg-ink-900/80 focus:outline-none',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full resize-none rounded-xl border border-line bg-ink-900/60 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-paper',
      'placeholder:text-paper-faint transition-colors duration-200',
      'hover:border-line-strong focus:border-accent/50 focus:bg-ink-900/80 focus:outline-none',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('label-xs block mb-2 !normal-case !tracking-[.08em] !text-[11.5px]', className)}
    {...props}
  />
))
Label.displayName = 'Label'

/* ————————————————————————— Dialog ————————————————————————— */

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }
>(({ className, children, hideClose, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-ink-950/72 backdrop-blur-[6px]',
        'data-[state=open]:animate-scaleIn data-[state=open]:opacity-100'
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-[min(94vw,540px)] -translate-x-1/2 -translate-y-1/2',
        'max-h-[88vh] overflow-y-auto rounded-3xl border border-line-strong/70 bg-ink-850/92 p-6',
        'shadow-[0_40px_120px_-40px_rgba(0,0,0,.9)] backdrop-blur-2xl',
        'data-[state=open]:animate-scaleIn',
        'focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          aria-label="关闭"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-paper-faint transition-colors hover:bg-paper/[.07] hover:text-paper"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = 'DialogContent'

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-5 space-y-1.5 pr-8', className)} {...props} />
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('serif text-[19px] font-semibold tracking-[.01em] text-paper', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('hint', className)} {...props} />
))
DialogDescription.displayName = 'DialogDescription'

/* ————————————————————————— Select ————————————————————————— */

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-line bg-ink-900/60 px-3.5 text-[13.5px] text-paper',
      'transition-colors hover:border-line-strong focus:border-accent/50 focus:outline-none',
      'data-[placeholder]:text-paper-faint',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-paper-faint" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        'z-[60] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line-strong/70',
        'bg-ink-850/96 backdrop-blur-2xl shadow-[0_28px_70px_-30px_rgba(0,0,0,.9)]',
        'data-[state=open]:animate-scaleIn',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-[13px] text-paper-soft outline-none',
      'data-[highlighted]:bg-accent/14 data-[highlighted]:text-paper',
      'data-[state=checked]:text-accent-soft',
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 grid place-items-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'

/* ————————————————————————— Switch ————————————————————————— */

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200',
      'border-line-strong bg-ink-800 data-[state=checked]:border-accent/50 data-[state=checked]:bg-accent/34',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-[16px] w-[16px] rounded-full bg-paper-soft shadow-sm transition-transform duration-200',
        'translate-x-[3px] data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-paper'
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = 'Switch'

/* ————————————————————————— Separator / Badge ————————————————————————— */

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-line',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    {...props}
  />
))
Separator.displayName = 'Separator'

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'accent' | 'danger' | 'ok' }) {
  const tones = {
    neutral: 'border-line-strong bg-paper/[.04] text-paper-mute',
    accent: 'border-accent/30 bg-accent/12 text-accent-soft',
    danger: 'border-danger/30 bg-danger/12 text-danger',
    ok: 'border-ok/30 bg-ok/12 text-ok',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium tracking-[.02em]',
        tones[tone],
        className
      )}
      {...props}
    />
  )
}

/* ————————————————————————— Tooltip ————————————————————————— */

export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <TooltipPrimitive.Root delayDuration={260}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          className="z-[70] max-w-[240px] rounded-lg border border-line-strong/70 bg-ink-850/97 px-2.5 py-1.5 text-[11.5px] leading-relaxed text-paper-soft shadow-[0_18px_44px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl data-[state=delayed-open]:animate-scaleIn"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/* ————————————————————————— DropdownMenu ————————————————————————— */

export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[70] min-w-[184px] overflow-hidden rounded-xl border border-line-strong/70 bg-ink-850/97 p-1.5',
        'shadow-[0_28px_70px_-30px_rgba(0,0,0,.9)] backdrop-blur-2xl data-[state=open]:animate-scaleIn',
        className
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { danger?: boolean }
>(({ className, danger, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] outline-none transition-colors',
      danger
        ? 'text-danger/90 data-[highlighted]:bg-danger/14 data-[highlighted]:text-danger'
        : 'text-paper-soft data-[highlighted]:bg-accent/14 data-[highlighted]:text-paper',
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-line', className)} {...props} />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Label
    ref={ref}
    className={cn('px-2.5 py-1.5 text-[10.5px] uppercase tracking-[.14em] text-paper-faint', className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

/* ————————————————————————— RadioGroup（周期/币种） ————————————————————————— */

export const RadioGroup = RadioGroupPrimitive.Root

export function SegOption({
  value,
  label,
  sub,
}: {
  value: string
  label: string
  sub?: string
}) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(
        'group flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-line bg-ink-900/40 px-2 py-2 transition-all duration-200',
        'hover:border-line-strong hover:bg-ink-800/60',
        'data-[state=checked]:border-accent/48 data-[state=checked]:bg-accent/13 data-[state=checked]:text-paper',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50'
      )}
    >
      <span className="text-[12.5px] font-medium text-paper-soft group-data-[state=checked]:text-paper">
        {label}
      </span>
      {sub && <span className="text-[10px] text-paper-faint">{sub}</span>}
    </RadioGroupPrimitive.Item>
  )
}
