"use client";

type ChipProps = {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function Chip({ children, active, onClick, className = "" }: ChipProps) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center rounded-pill border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-trail bg-trail/15 text-trail dark:bg-trail/20"
          : "border-terrain-stone/50 bg-transparent text-foreground/80 hover:border-trail/60 dark:border-terrain-surface/60"
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </Comp>
  );
}
