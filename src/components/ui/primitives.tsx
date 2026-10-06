/**
 * Small styled building blocks on top of Radix primitives.
 */
import { Dialog as RDialog, Popover as RPopover, Slider as RSlider, Switch as RSwitch, Tooltip as RTooltip } from 'radix-ui';
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

// ── Button ───────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'icon' | 'icon-sm';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-crust hover:brightness-110 active:brightness-95 shadow-[0_6px_24px_-8px_var(--accent)] font-semibold',
  secondary: 'bg-surface0 text-text hover:bg-surface1 active:bg-surface0',
  ghost: 'text-subtext1 hover:text-text hover:bg-surface0/70',
  outline: 'border border-surface1 text-subtext1 hover:text-text hover:border-surface2 hover:bg-surface0/40',
  danger: 'text-red hover:bg-red/10',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[0.8125rem] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-xl',
  icon: 'size-9 rounded-xl justify-center',
  'icon-sm': 'size-7 rounded-lg justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center whitespace-nowrap transition-[color,background,filter,border-color] duration-150 disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

// ── Tooltip ──────────────────────────────────────────────────────────────────

export function Tip({ label, children, side = 'top', kbd }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right'; kbd?: string }) {
  return (
    <RTooltip.Root delayDuration={350}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 flex items-center gap-2 rounded-lg border border-surface1 bg-crust px-2.5 py-1.5 text-xs text-text shadow-xl shadow-black/30 data-[state=delayed-open]:animate-in"
        >
          {label}
          {kbd && <span className="kbd">{kbd}</span>}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

export const TooltipProvider = RTooltip.Provider;

// ── Popover ──────────────────────────────────────────────────────────────────

export function Popover({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  className,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          align={align}
          side={side}
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            'z-50 max-h-[min(80vh,var(--radix-popover-content-available-height))] overflow-auto rounded-2xl border border-surface1 bg-mantle p-3 text-sm text-text shadow-2xl shadow-black/40 outline-none',
            className,
          )}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

export const PopoverClose = RPopover.Close;

// ── Dialog ───────────────────────────────────────────────────────────────────

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-crust/70 backdrop-blur-sm" />
        <RDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-surface1 bg-mantle p-5 text-text shadow-2xl shadow-black/50 outline-none sm:p-6',
            className,
          )}
        >
          <RDialog.Title className="text-lg font-semibold tracking-tight">{title}</RDialog.Title>
          {description && <RDialog.Description className="mt-1 text-sm text-subtext0">{description}</RDialog.Description>}
          <div className="mt-4">{children}</div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

// ── Form controls ────────────────────────────────────────────────────────────

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label?: string; id?: string }) {
  return (
    <RSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-surface1 transition-colors data-[state=checked]:bg-accent"
    >
      <RSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-text shadow transition-transform data-[state=checked]:translate-x-[1.125rem] data-[state=checked]:bg-crust" />
    </RSwitch.Root>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  return (
    <RSlider.Root
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
      aria-label={label}
      className="relative flex h-5 w-full touch-none select-none items-center"
    >
      <RSlider.Track className="relative h-1.5 grow rounded-full bg-surface1">
        <RSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RSlider.Track>
      <RSlider.Thumb className="block size-4 rounded-full border-2 border-accent bg-base shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" />
    </RSlider.Root>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(function Input(
  { className, mono, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      spellCheck={false}
      autoComplete="off"
      className={cn(
        'h-9 w-full min-w-0 rounded-xl border border-surface1 bg-base px-3 text-sm text-text placeholder:text-overlay0 transition-colors focus:border-accent focus:outline-none',
        mono && 'font-mono text-[0.8125rem]',
        className,
      )}
      {...props}
    />
  );
});

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-surface1 bg-base pl-3 pr-8 text-sm text-text transition-colors focus:border-accent focus:outline-none"
        {...props}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-overlay1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex rounded-xl bg-crust/60 p-0.5 ring-1 ring-surface0', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-[0.625rem] font-medium transition-colors',
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[0.8125rem]',
            value === o.value ? 'bg-surface0 text-text shadow-sm' : 'text-overlay2 hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, help, htmlFor }: { label: ReactNode; children: ReactNode; help?: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-subtext0">
        {label}
      </label>
      {children}
      {help && <p className="text-[0.7rem] leading-snug text-overlay1">{help}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'green' | 'yellow' | 'red' | 'blue'; className?: string }) {
  const tones = {
    neutral: 'bg-surface0 text-subtext1',
    accent: 'bg-accent/15 text-accent',
    green: 'bg-green/15 text-green',
    yellow: 'bg-yellow/15 text-yellow',
    red: 'bg-red/15 text-red',
    blue: 'bg-blue/15 text-blue',
  } as const;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}
