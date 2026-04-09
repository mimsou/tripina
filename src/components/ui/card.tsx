export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-terrain-stone/40 bg-snow/90 shadow-card backdrop-blur-glass dark:border-terrain-surface/50 dark:bg-terrain-deep/90 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
