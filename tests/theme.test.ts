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
/** A color set (high contrast, colorblind) changes only some colors; the rest come from the default set of the mode. */
const variant = (mode: 'light' | 'dark', name: string) => ({ ...(mode === 'light' ? light : dark), ...palette(`html[data-theme='${mode}'][data-palette='${name}']`) });
const COLOR_SETS = [
  ['light', light],
  ['dark', dark],
  ['light high contrast', variant('light', 'contrast')],
  ['dark high contrast', variant('dark', 'contrast')],
  ['light colorblind', variant('light', 'colorblind')],
  ['dark colorblind', variant('dark', 'colorblind')],
] as const;

describe('brand theme', () => {
  it('uses GitHub Primer colors: gray page, blue brand and green main action in both modes', () => {
    expect(light).toMatchObject({ background: '#f2f4f7', surface: '#ffffff', text: '#1f2328', accent: '#0969da', primary: '#1f883d' });
    expect(dark).toMatchObject({ background: '#0d1117', surface: '#151b23', text: '#f0f6fc', accent: '#4493f8', primary: '#238636' });
    expect(css).not.toMatch(/metro-remix|metro-step|square corners/i);
    expect(html).not.toMatch(/metro-remix|data-theme-id/);
  });

  it('keeps every text color readable on the page, panels and soft panels', () => {
    for (const [mode, colors] of COLOR_SETS) {
      for (const text of ['text', 'muted', 'subtle', 'accent', 'secondary', 'success', 'warning', 'danger']) {
        for (const surface of ['background', 'surface', 'surfaceSoft']) {
          expect(contrast(colors[text], colors[surface]), `${mode}: ${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(contrast(colors.onAccent, colors.accent), `${mode}: text on the brand color`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.onPrimary, colors.primary), `${mode}: text on primary buttons`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('offers high contrast and colorblind friendly color sets, like GitHub does', () => {
    for (const name of ['contrast', 'colorblind']) {
      for (const mode of ['light', 'dark']) expect(css).toContain(`html[data-theme='${mode}'][data-palette='${name}'] {`);
      expect(html, 'the saved color set is applied before the first paint').toContain(`'${name}'`);
    }
    // Colorblind friendly: good and bad are never green and red.
    for (const mode of ['light', 'dark'] as const) {
      const colors = variant(mode, 'colorblind');
      expect(colors.success).toMatch(/^#(0969da|58a6ff)$/);
      expect(colors.danger).toMatch(/^#(b34400|f0883e)$/);
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
