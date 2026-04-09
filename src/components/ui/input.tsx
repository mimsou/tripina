import { forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ className = "", label, error, id, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground/80">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-md border border-terrain-stone/50 bg-snow/80 px-3 py-2 text-sm text-terrain-night placeholder:text-terrain-night/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trail dark:border-terrain-surface/60 dark:bg-terrain-deep dark:text-terrain-mist dark:placeholder:text-terrain-mist/40 ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
});

Input.displayName = "Input";
