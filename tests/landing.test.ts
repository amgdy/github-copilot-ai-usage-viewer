import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Landing } from '../src/components/Landing';

/** The start page has two ways in: your own files, or a sample report made from invented data. */
describe('start page', () => {
  const html = renderToStaticMarkup(createElement(Landing));
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  it('lets people choose or drop their own files', () => {
    expect(text).toContain('Drop one or more CSV files here');
    expect(text).toContain('Choose files');
    expect(html).toMatch(/<input[^>]*type="file"[^>]*multiple/);
  });

  it('offers one sample report and says it is made up', () => {
    expect(text.match(/View a sample report/g)).toHaveLength(1);
    expect(text).toContain('The sample uses made-up people and numbers.');
  });

  it('puts your own files first and the sample second', () => {
    expect(text.indexOf('Choose files')).toBeLessThan(text.indexOf('View a sample report'));
  });

  it('puts the ways to open a report right after the title, so phones show them first', () => {
    expect(text.indexOf('See where your GitHub Copilot AI credits go')).toBeLessThan(text.indexOf('Choose files'));
    expect(text.indexOf('View a sample report')).toBeLessThan(text.indexOf('What you get'));
  });

  it('never names or links files from the samples folder', () => {
    expect(html).not.toMatch(/samples\/|AIUsageReport_/);
  });
});
