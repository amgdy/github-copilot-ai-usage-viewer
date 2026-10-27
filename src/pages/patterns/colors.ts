import type { ChartColors } from '../../components/charts/theme';

function rgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const hexDigits = match[1].length === 3 ? match[1].replace(/./g, (digit) => digit + digit) : match[1];
  const colorValue = parseInt(hexDigits, 16);
  return [(colorValue >> 16) & 255, (colorValue >> 8) & 255, colorValue & 255];
}

function luminance(hex: string): number {
  const channels = rgb(hex);
  if (!channels) return 0.5;
  const linearize = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(channels[0]) + 0.7152 * linearize(channels[1]) + 0.0722 * linearize(channels[2]);
}

export function contrast(a: string, b: string): number {
  const luminanceA = luminance(a);
  const luminanceB = luminance(b);
  return (Math.max(luminanceA, luminanceB) + 0.05) / (Math.min(luminanceA, luminanceB) + 0.05);
}

/** The chart text color or the surface color, whichever reads better on `fill`. */
export function readableOn(colors: ChartColors, fill: string): string {
  return contrast(colors.text, fill) >= contrast(colors.surface, fill) ? colors.text : colors.surface;
}
