/** Small HTML pieces for chart tooltips, matching the axis tooltips in `components/charts/helpers.ts`. */

export const tipHead = (text: string): string => `<div style="font-weight:600;margin-bottom:4px">${text}</div>`;

export const tipRow = (label: string, value: string, marker = ''): string =>
  `<div style="display:flex;justify-content:space-between;gap:16px"><span>${marker}${label}</span><b>${value}</b></div>`;

export const tipNote = (text: string): string =>
  `<div style="margin-top:4px;max-width:240px;white-space:normal;opacity:.75">${text}</div>`;

export const dot = (color: string): string =>
  `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-inline-end:6px;background:${color}"></span>`;
