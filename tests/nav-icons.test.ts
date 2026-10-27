import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NAV } from '../src/components/layout/nav';

describe('navigation icons', () => {
  it('gives every report page a distinct vector icon', () => {
    const icons = NAV.map(({ Icon }) => renderToStaticMarkup(createElement(Icon, { 'aria-hidden': true })));

    expect(new Set(icons).size).toBe(NAV.length);
    for (const icon of icons) expect(icon).toContain('<svg');
  });
});
