import { useId } from 'react';

/**
 * The app mark: a coffee mug holds the shared pool of included credits, usage bars rise inside it and a lens
 * brings them into focus. Outlines take the text color and the pool takes the accent, so it follows the theme.
 * With `animated`, the pool level rises and falls while the lens scans the bars (see `.brand-mark-*` in
 * index.css; motion stops for reduced motion and print). index.html holds the static drawing as the favicon,
 * and docs/brand holds the exported logo files.
 */
export function BrandMark({
  size = 24,
  className,
  title,
  animated = false,
}: {
  size?: number;
  className?: string;
  title?: string;
  animated?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const vesselId = `${id}-vessel`;
  const focusId = `${id}-focus`;
  const clearanceId = `${id}-clearance`;
  const scan = animated ? 'brand-mark-scan' : undefined;
  const counterScan = animated ? 'brand-mark-counter-scan' : undefined;
  const liquid = animated ? 'brand-mark-liquid' : undefined;
  const ink = { stroke: 'currentColor' };
  const accent = { fill: 'var(--cp-accent)' };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <clipPath id={vesselId}>
          <path d="M59 61H169V177Q169 197 149 197H79Q59 197 59 177Z" />
        </clipPath>
        <clipPath id={focusId}>
          <circle cx="158" cy="130" r="41" />
        </clipPath>
        <mask id={clearanceId} maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256">
          <path fill="#fff" d="M0 0H256V256H0Z" />
          <g className={scan} fill="#000">
            <circle cx="158" cy="130" r="59" />
            <path d="M193 165L224 196" fill="none" stroke="#000" strokeWidth="31" strokeLinecap="round" />
          </g>
        </mask>
      </defs>
      <g mask={`url(#${clearanceId})`}>
        <path d="M51 83H34C6 83 6 143 34 143H51" fill="none" style={ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <g clipPath={`url(#${vesselId})`} style={accent}>
          <g className={liquid}>
            <path opacity=".18" d="M48 143C72 159 96 133 119 141S153 151 178 135V230H48Z" />
          </g>
          <path d="M76 139H94V188H76ZM103 115H121V188H103ZM130 91H148V188H130Z" />
        </g>
        <g fill="none" style={ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M51 56V177Q51 208 82 208H146Q177 208 177 177V56" />
          <ellipse cx="114" cy="56" rx="63" ry="18" />
        </g>
      </g>
      <g className={scan}>
        <g clipPath={`url(#${focusId})`} style={accent}>
          <g className={counterScan}>
            <g className={liquid}>
              <path opacity=".18" d="M72 135C99 151 124 126 148 135S188 143 230 127V230H72Z" />
            </g>
            <path d="M97 156H116V210H97ZM124 132H143V210H124ZM151 108H170V210H151ZM178 84H197V210H178Z" />
          </g>
        </g>
        <path d="M193 165L224 196" fill="none" style={ink} strokeWidth="15" strokeLinecap="round" />
        <circle cx="158" cy="130" r="48" fill="none" style={ink} strokeWidth="10" />
      </g>
    </svg>
  );
}
