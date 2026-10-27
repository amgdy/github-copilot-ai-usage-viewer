/**
 * The app mark: a ring with a petrol "pool level" inside. It stands for the shared pool of included credits
 * and how full it is. The ring takes the text color, the level takes the accent, so it follows the theme.
 * index.html holds the same drawing as the favicon.
 */
export function BrandMark({ size = 24, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path className="fill-accent" d="M4.77 10A7.5 7.5 0 1 0 19.23 10Z" />
    </svg>
  );
}
