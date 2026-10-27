import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, mergeSettings } from '../src/lib/analytics/settings';
import { buildTaxonomy, engagementItems, tierItems, TIER_ORDER, ENGAGEMENT_ORDER, type TaxonomyItem } from '../src/lib/analytics/taxonomy';

describe('taxonomy labels', () => {
  it('writes the default thresholds as whole percents', () => {
    const t = tierItems(DEFAULT_SETTINGS);
    expect(t.map((i) => i.id)).toEqual(TIER_ORDER);
    expect(t[0].label).toBe(`Minimal (under ${DEFAULT_SETTINGS.tiers.minimal * 100}%)`);
    for (const item of t) expect(item.label + item.description, item.id).not.toMatch(/\d\.\d|NaN|undefined/);
  });

  it('keeps the decimals of a threshold that is not a whole percent', () => {
    const s = mergeSettings({ tiers: { ...DEFAULT_SETTINGS.tiers, minimal: 0.125, light: 0.3333 } });
    const [minimal, light] = tierItems(s);
    expect(minimal.label).toBe('Minimal (under 12.5%)');
    expect(light.label).toBe('Light (12.5% to 33.33%)');
    expect(minimal.description).toContain('12.5%');
  });

  it('does not print float noise for thresholds such as 7% or 29%', () => {
    const s = mergeSettings({ tiers: { ...DEFAULT_SETTINGS.tiers, minimal: 0.07, light: 0.29 } });
    expect(tierItems(s)[0].label).toBe('Minimal (under 7%)');
    expect(tierItems(s)[1].label).toBe('Light (7% to 29%)');
  });

  it('uses the engagement cutoffs in the descriptions', () => {
    const s = mergeSettings({ engagement: { occasional: 0.125, regular: 0.4, daily: 0.8 } });
    const byId = new Map(engagementItems(s).map((i) => [i.id, i]));
    expect(byId.get('daily')!.description).toContain('80%');
    expect(byId.get('regular')!.description).toContain('40% to 80%');
    expect(byId.get('occasional')!.description).toContain('12.5% to 40%');
    expect(byId.get('rare')!.description).toContain('12.5%');
    expect(ENGAGEMENT_ORDER.every((id) => byId.has(id))).toBe(true);
  });

  it('has an item with a label, a description and an action for every id', () => {
    const tax = buildTaxonomy(DEFAULT_SETTINGS);
    for (const [group, items] of Object.entries(tax) as [string, TaxonomyItem[]][]) {
      expect(items.length, group).toBeGreaterThan(0);
      expect(new Set(items.map((i) => i.id)).size, `${group}: ids are unique`).toBe(items.length);
      for (const i of items) {
        expect(i.label.length, `${group}/${i.id} label`).toBeGreaterThan(0);
        expect(i.description.length, `${group}/${i.id} description`).toBeGreaterThan(0);
        expect(i.action.length, `${group}/${i.id} action`).toBeGreaterThan(0);
        expect(i.color, `${group}/${i.id} color`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});
