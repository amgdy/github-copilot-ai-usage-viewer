import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const css = read('../src/index.css');
const fonts = read('../src/fonts.css');
const main = read('../src/main.tsx');
const html = read('../index.html');

/** The --theme-* colors of one mode, read from its rule in index.css. */
function palette(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--theme-([\w-]+): (#[0-9a-f]{6})\b/gi)].map((match) => [match[1], match[2].toLowerCase()]));
}

function contrast(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const channels = color.match(/[0-9a-f]{2}/gi)?.map((part) => parseInt(part, 16) / 255) ?? [];
    const [red, green, blue] = channels.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
}

const light = palette("html[data-theme='light']");
const dark = palette("html[data-theme='dark']");

describe('brand theme', () => {
  it('uses ink on warm paper with one petrol brand color in both modes', () => {
    expect(light).toMatchObject({ background: '#f5f4ef', surface: '#ffffff', text: '#1a1a17', accent: '#0e6e74', primary: '#1a1a17' });
    expect(dark).toMatchObject({ background: '#11110f', surface: '#191917', text: '#edece6', accent: '#4fc2c4', primary: '#edece6' });
    expect(css).not.toMatch(/metro-remix|metro-step|square corners/i);
    expect(html).not.toMatch(/metro-remix|data-theme-id/);
  });

  it('keeps every text color readable on the page, panels and soft panels', () => {
    for (const [mode, colors] of [['light', light], ['dark', dark]] as const) {
      for (const text of ['text', 'muted', 'subtle', 'accent', 'secondary', 'success', 'warning', 'danger']) {
        for (const surface of ['background', 'surface', 'surfaceSoft']) {
          expect(contrast(colors[text], colors[surface]), `${mode}: ${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(contrast(colors.onAccent, colors.accent), `${mode}: text on the brand color`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.onPrimary, colors.primary), `${mode}: text on primary buttons`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('draws the browser tab icon in the brand color of each mode', () => {
    expect(html).toContain(`%23${light.accent.slice(1)}`);
    expect(html).toContain(`%23${dark.accent.slice(1)}`);
  });

  it('uses small, even corners', () => {
    const radii = Object.fromEntries([...css.matchAll(/--radius-(\w+): ([\d.]+)rem;/g)].map((match) => [match[1], Number(match[2])]));
    expect(radii).toMatchObject({ xs: 0.125, sm: 0.1875, md: 0.25, lg: 0.375, xl: 0.5 });
    expect(Math.max(...Object.values(radii))).toBeLessThanOrEqual(1);
  });
});

describe('brand fonts', () => {
  it('bundles Mona Sans and IBM Plex Sans Arabic so the report looks the same offline', () => {
    expect(main.indexOf("import './fonts.css'")).toBeGreaterThan(-1);
    expect(main.indexOf("import './fonts.css'")).toBeLessThan(main.indexOf("import './index.css'"));
    for (const family of ['Mona Sans Variable', 'IBM Plex Sans Arabic']) expect(fonts).toContain(`font-family: '${family}'`);
    // "/*!" comments survive minifying, so the font license notice ships with the fonts in the built file.
    expect(fonts.startsWith('/*! Mona Sans: Copyright')).toBe(true);
    expect(fonts).toContain('IBM Plex Sans Arabic: Copyright');
    expect(fonts).toContain('SIL Open Font License');
    const files = [...fonts.matchAll(/url\('([^']+)'\)/g)].map((match) => match[1]);
    expect(files.length).toBeGreaterThanOrEqual(4);
    for (const file of files) {
      expect(file, 'fonts are never loaded from the internet').not.toMatch(/^(?:https?:)?\/\//);
      expect(existsSync(new URL(file, new URL('../src/', import.meta.url))), file).toBe(true);
    }
  });

  it('uses Mona Sans for English and IBM Plex Sans Arabic for Arabic', () => {
    expect(css).toMatch(/--font-sans: 'Mona Sans Variable'/);
    expect(css).toMatch(/--font-arabic: 'IBM Plex Sans Arabic'/);
    expect(css).toMatch(/html\[dir='rtl'\] body \{[^}]*font-family: var\(--font-arabic\)/);
  });
});
