"use client";

import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary:
    "bg-trail text-snow hover:bg-trail-glow focus-visible:ring-trail-glow shadow-card active:scale-[0.98]",
  secondary:
    "bg-summit text-snow hover:opacity-90 focus-visible:ring-summit active:scale-[0.98]",
  ghost:
    "bg-transparent text-foreground hover:bg-terrain-stone/20 dark:hover:bg-terrain-surface/60",
  outline:
    "border border-terrain-stone/40 bg-transparent hover:border-trail hover:text-trail dark:border-terrain-surface/60",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    loading?: boolean;
  }
>(({ className = "", variant = "primary", loading, children, disabled, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
    {...props}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
    {children}
  </button>
));

Button.displayName = "Button";
