import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, mergeSettings } from '../src/lib/analytics/settings';
import { buildTaxonomy, engagementItems, tierItems, TIER_ORDER, ENGAGEMENT_ORDER, type TaxonomyItem } from '../src/lib/analytics/taxonomy';

describe('taxonomy labels', () => {
  it('writes the default thresholds as whole percents', () => {
    const tiers = tierItems(DEFAULT_SETTINGS);
    expect(tiers.map((tier) => tier.id)).toEqual(TIER_ORDER);
    expect(tiers[0].label).toBe(`Minimal (under ${DEFAULT_SETTINGS.tiers.minimal * 100}%)`);
    for (const item of tiers) expect(item.label + item.description, item.id).not.toMatch(/\d\.\d|NaN|undefined/);
  });

  it('keeps the decimals of a threshold that is not a whole percent', () => {
    const settings = mergeSettings({ tiers: { ...DEFAULT_SETTINGS.tiers, minimal: 0.125, light: 0.3333 } });
    const [minimal, light] = tierItems(settings);
    expect(minimal.label).toBe('Minimal (under 12.5%)');
    expect(light.label).toBe('Light (12.5% to 33.33%)');
    expect(minimal.description).toContain('12.5%');
  });

  it('does not print float noise for thresholds such as 7% or 29%', () => {
    const settings = mergeSettings({ tiers: { ...DEFAULT_SETTINGS.tiers, minimal: 0.07, light: 0.29 } });
    expect(tierItems(settings)[0].label).toBe('Minimal (under 7%)');
    expect(tierItems(settings)[1].label).toBe('Light (7% to 29%)');
  });

  it('uses the engagement cutoffs in the descriptions', () => {
    const settings = mergeSettings({ engagement: { occasional: 0.125, regular: 0.4, daily: 0.8 } });
    const byId = new Map(engagementItems(settings).map((item) => [item.id, item]));
    expect(byId.get('daily')!.description).toContain('80%');
    expect(byId.get('regular')!.description).toContain('40% to 80%');
    expect(byId.get('occasional')!.description).toContain('12.5% to 40%');
    expect(byId.get('rare')!.description).toContain('12.5%');
    expect(ENGAGEMENT_ORDER.every((id) => byId.has(id))).toBe(true);
  });

  it('has an item with a label, a description and an action for every id', () => {
    const taxonomy = buildTaxonomy(DEFAULT_SETTINGS);
    for (const [group, items] of Object.entries(taxonomy) as [string, TaxonomyItem[]][]) {
      expect(items.length, group).toBeGreaterThan(0);
      expect(new Set(items.map((item) => item.id)).size, `${group}: ids are unique`).toBe(items.length);
      for (const item of items) {
        expect(item.label.length, `${group}/${item.id} label`).toBeGreaterThan(0);
        expect(item.description.length, `${group}/${item.id} description`).toBeGreaterThan(0);
        expect(item.action.length, `${group}/${item.id} action`).toBeGreaterThan(0);
        expect(item.color, `${group}/${item.id} color`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});
