import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyLocale } from '../src/i18n/core';
import { sortOptions } from '../src/components/ui/sortOptions';
import { FeatureIcon, GitHubCopilotIcon, VendorIcon } from '../src/components/icons/brand';
import { LINKS } from '../src/lib/links';
import { chartColors, themeObject } from '../src/components/charts/theme';
import { stackTooltip } from '../src/components/charts/helpers';

afterEach(() => {
  applyLocale('en', {});
  vi.unstubAllGlobals();
});

describe('shared chart presentation', () => {
  it('keeps CSS tokens during server-side rendering', () => {
    expect(chartColors().accent).toBe('var(--cp-accent)');
  });

  it('resolves every chart color from the active theme tokens', () => {
    const colors = chartColors((name) => `resolved(${name})`);
    expect(colors.accent).toBe('resolved(--cp-accent)');
    expect(colors.surface).toBe('resolved(--cp-surface)');
    expect(colors.palette.every((value) => value.startsWith('resolved(--cp-'))).toBe(true);
    expect(colors.palette).toHaveLength(12);
    expect(colors.ramp).toHaveLength(6);
    expect(themeObject(colors).dataZoom.fillerColor).toBe('resolved(--cp-highlight)');
    expect(() => chartColors(() => '')).toThrow('Missing chart theme color');
  });

  it('builds a six-step hex ramp for browser heatmaps and their contrast checks', () => {
    vi.stubGlobal('document', {});
    const colors = chartColors((name) => name === '--cp-accent' ? '#b11f4b' : '#f5f5f5');
    expect(colors.ramp).toHaveLength(6);
    expect(colors.ramp[0]).toBe('#f5f5f5');
    expect(colors.ramp[5]).toBe('#b11f4b');
    expect(colors.ramp.every((value) => /^#[0-9a-f]{6}$/.test(value))).toBe(true);
  });

  it('translates tooltip totals and hidden-series counts', () => {
    applyLocale('ar', { Total: 'الإجمالي', 'and {n} more': 'و{n} غيرها' });
    const html = stackTooltip(String, { max: 1 })([{ name: 'Day', seriesName: '<unsafe>', value: 2 }, { name: 'Day', value: 1 }]);
    expect(html).toContain('الإجمالي');
    expect(html).toContain('و1 غيرها');
    expect(html).toContain('&lt;unsafe&gt;');
    expect(html).not.toContain('<unsafe>');
  });
});

describe('display ordering', () => {
  it('sorts dropdown labels A to Z without changing the input', () => {
    const options = [
      { value: 'z', label: 'Zebra' },
      { value: 'all', label: 'All users' },
      { value: 'b', label: 'beta' },
      { value: 'a', label: 'Alpha' },
    ];
    expect(sortOptions(options, (option) => option.label).map((option) => option.value)).toEqual(['all', 'a', 'b', 'z']);
    expect(options.map((option) => option.value)).toEqual(['z', 'all', 'b', 'a']);
  });

  it('orders numeric labels naturally and keeps explicit scales intact', () => {
    const options = [{ value: 10, label: 'Group 10' }, { value: 2, label: 'Group 2' }];
    expect(sortOptions(options, (option) => option.label).map((option) => option.value)).toEqual([2, 10]);
    expect(sortOptions(options, (option) => option.label, 'given')).toEqual(options);
  });

  it('sorts Arabic labels using Arabic collation', () => {
    applyLocale('ar', {});
    const options = [{ value: 'b', label: 'باء' }, { value: 'a', label: 'ألف' }];
    expect(sortOptions(options, (option) => option.label).map((option) => option.value)).toEqual(['a', 'b']);
  });
});

describe('official links and vector icons', () => {
  it('uses only HTTPS links to GitHub or Microsoft', () => {
    const hosts = new Set(['docs.github.com', 'github.blog', 'github.com', 'resources.github.com', 'learn.microsoft.com']);
    for (const link of Object.values(LINKS)) {
      const url = new URL(link.url);
      expect(url.protocol, link.url).toBe('https:');
      expect(hosts.has(url.hostname), link.url).toBe(true);
    }
    expect(Object.values(LINKS).some((link) => link.source === 'Microsoft Learn')).toBe(true);
  });

  it('renders product, vendor and feature marks as offline SVG paths', () => {
    const icons = [
      createElement(GitHubCopilotIcon, { title: 'GitHub Copilot' }),
      createElement(VendorIcon, { vendor: 'Microsoft' }),
      createElement(VendorIcon, { vendor: 'OpenAI' }),
      createElement(FeatureIcon, { feature: 'codeReview' }),
    ];
    for (const icon of icons) {
      const html = renderToStaticMarkup(icon);
      expect(html).toContain('<svg');
      expect(html).toContain('<path');
      expect(html).not.toMatch(/<img|<image|https?:|data:image/);
    }
    expect(renderToStaticMarkup(icons[0])).toContain('aria-label="GitHub Copilot"');
  });
});
