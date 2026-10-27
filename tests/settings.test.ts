import { afterEach, describe, expect, it, vi } from 'vitest';
import { planLabel } from '../src/lib/analytics/prepare';
import { budgetOf, DEFAULT_SETTINGS, mergeSettings, PLAN_CREDITS, PLAN_PRICE, planCredits, saveSettings, seatCredits, seatPrice, SETTINGS_STORAGE_KEY, type Settings } from '../src/lib/analytics/settings';
import { PRICE_CARD } from '../src/lib/pricing/card';
import type { LiveModel } from '../src/lib/pricing/docsParser';
import { applyLivePrices, checkLivePrices, summarizeLive } from '../src/pages/settings/livePrices';
import { parsePlan, parseRoster, planText } from '../src/pages/settings/roster';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    data,
    getItem: (key: string): string | null => data.get(key) ?? null,
    setItem: (key: string, value: string): void => void data.set(key, String(value)),
    removeItem: (key: string): void => void data.delete(key),
  };
}

describe('DEFAULT_SETTINGS', () => {
  it('has ordered thresholds', () => {
    const { tiers: tiers, engagement: engagement, pareto: pareto } = DEFAULT_SETTINGS;
    expect(0 < tiers.minimal && tiers.minimal < tiers.light && tiers.light < tiers.core && tiers.core < tiers.power).toBe(true);
    expect(engagement.daily > engagement.regular && engagement.regular > engagement.occasional && engagement.occasional > 0 && engagement.daily <= 1).toBe(true);
    expect(0 < pareto.a && pareto.a < pareto.b && pareto.b <= 1).toBe(true);
  });

  it('keeps shares inside (0, 1], and counts and amounts positive', () => {
    for (const shareKey of ['frontierHeavy', 'efficientShare', 'spikeShare', 'lowAuto', 'lowCacheHit', 'longContextShare', 'autoDiscount'] as const) {
      expect(DEFAULT_SETTINGS[shareKey], shareKey).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS[shareKey], shareKey).toBeLessThanOrEqual(1);
    }
    for (const countKey of ['lapsedDays', 'newUserDays', 'topN'] as const) {
      expect(Number.isInteger(DEFAULT_SETTINGS[countKey]) && DEFAULT_SETTINGS[countKey] > 0, countKey).toBe(true);
    }
    expect(DEFAULT_SETTINGS.activeThreshold).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.minSpendForTraits).toBeGreaterThan(0);
  });

  it('starts without a budget, roster, extra seats or model overrides', () => {
    expect(DEFAULT_SETTINGS.budgetMonthlyBilled).toBeNull();
    expect(DEFAULT_SETTINGS.roster).toEqual([]);
    expect(DEFAULT_SETTINGS.extraSeats).toEqual({ business: 0, enterprise: 0 });
    expect(DEFAULT_SETTINGS.modelOverrides).toEqual({});
  });

  it('survives a JSON round trip, which is how it is stored', () => {
    expect(JSON.parse(JSON.stringify(DEFAULT_SETTINGS))).toEqual(DEFAULT_SETTINGS);
  });
});

describe('mergeSettings', () => {
  it('returns the defaults for an empty object, as a deep copy that cannot touch DEFAULT_SETTINGS', () => {
    const before = structuredClone(DEFAULT_SETTINGS);
    const settings = mergeSettings({});
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings).not.toBe(DEFAULT_SETTINGS);
    for (const nestedKey of ['tiers', 'engagement', 'pareto', 'extraSeats', 'roster', 'modelOverrides'] as const) expect(settings[nestedKey], nestedKey).not.toBe(DEFAULT_SETTINGS[nestedKey]);
    settings.tiers.power = 99;
    settings.pareto.a = 0.1;
    settings.engagement.daily = 0;
    settings.extraSeats.business = 5;
    settings.roster.push({ user: 'x' });
    settings.modelOverrides['m'] = {};
    expect(DEFAULT_SETTINGS).toEqual(before);
    expect(mergeSettings({})).toEqual(before);
  });

  it('overrides top-level values and keeps the rest', () => {
    const settings = mergeSettings({ topN: 25, budgetMonthlyBilled: 500, activeThreshold: 0.2 });
    expect([settings.topN, settings.budgetMonthlyBilled, settings.activeThreshold]).toEqual([25, 500, 0.2]);
    expect(settings.lapsedDays).toBe(DEFAULT_SETTINGS.lapsedDays);
    expect(settings.tiers).toEqual(DEFAULT_SETTINGS.tiers);
  });

  it('merges nested groups key by key, so a file saved by an older version still gets the new keys', () => {
    const partial = { tiers: { minimal: 0.2 }, pareto: { a: 0.7 }, engagement: { daily: 0.5 }, extraSeats: { enterprise: 3 } } as unknown as Partial<Settings>;
    const settings = mergeSettings(partial);
    expect(settings.tiers).toEqual({ ...DEFAULT_SETTINGS.tiers, minimal: 0.2 });
    expect(settings.pareto).toEqual({ ...DEFAULT_SETTINGS.pareto, a: 0.7 });
    expect(settings.engagement).toEqual({ ...DEFAULT_SETTINGS.engagement, daily: 0.5 });
    expect(settings.extraSeats).toEqual({ business: 0, enterprise: 3 });
  });

  it('keeps the roster and model overrides it is given, and a null budget', () => {
    const roster = [{ user: 'a', plan: 'Business' }, { user: 'b' }];
    const modelOverrides = { 'GPT-6 Astra': { long: null } };
    const settings = mergeSettings({ roster, modelOverrides, budgetMonthlyBilled: null });
    expect(settings.roster).toEqual(roster);
    expect(settings.modelOverrides).toEqual(modelOverrides);
    expect(settings.budgetMonthlyBilled).toBeNull();
  });

  it('does not change its argument, and merging a merged result changes nothing', () => {
    const input: Partial<Settings> = { topN: 3, tiers: { ...DEFAULT_SETTINGS.tiers, core: 1.5 } };
    const snapshot = structuredClone(input);
    const once = mergeSettings(input);
    expect(input).toEqual(snapshot);
    expect(mergeSettings(once)).toEqual(once);
  });
});

describe('saveSettings', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the settings under the key that earlier versions used, so saved settings are not lost', () => {
    expect(SETTINGS_STORAGE_KEY).toBe('ghcu.settings.v1');
  });

  it('writes the settings as JSON under one key, and the stored text merges back to the same settings', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    const custom = mergeSettings({
      topN: 7,
      budgetMonthlyBilled: 123.45,
      roster: [{ user: 'a', plan: 'Business' }, { user: 'b', plan: 'Enterprise' }],
      extraSeats: { business: 2, enterprise: 1 },
      modelOverrides: { 'GPT-6 Astra': { vendor: 'OpenAI', long: null } },
    });
    saveSettings(custom);
    expect([...storage.data.keys()]).toEqual([SETTINGS_STORAGE_KEY]);
    expect(mergeSettings(JSON.parse(storage.data.get(SETTINGS_STORAGE_KEY) as string))).toEqual(custom);
  });

  it('replaces the previous value instead of adding to it, and does not change what it saves', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    const first = mergeSettings({ topN: 3 });
    const second = mergeSettings({ topN: 4 });
    const snapshot = structuredClone(second);
    saveSettings(first);
    saveSettings(second);
    expect(storage.data.size).toBe(1);
    expect(JSON.parse(storage.data.get(SETTINGS_STORAGE_KEY) as string).topN).toBe(4);
    expect(second).toEqual(snapshot);
  });

  it('does not throw when the storage refuses (private mode, quota) or does not exist', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('quota');
      },
    });
    expect(() => saveSettings(mergeSettings({}))).not.toThrow();
    vi.stubGlobal('localStorage', undefined);
    expect(() => saveSettings(mergeSettings({}))).not.toThrow();
  });
});

describe('plans and seat prices', () => {
  it('lists the two seat plans with the documented credits and prices', () => {
    expect(PLAN_CREDITS).toEqual({ Business: 1900, Enterprise: 3900 });
    expect(PLAN_PRICE).toEqual({ Business: 19, Enterprise: 39 });
  });

  it('prices a seat exactly at the value of its included credits (1 credit = $0.01)', () => {
    for (const plan of Object.keys(PLAN_CREDITS)) {
      expect(PLAN_PRICE[plan], plan).toBeCloseTo(PLAN_CREDITS[plan] * 0.01, 9);
      expect(seatPrice(PLAN_CREDITS[plan]), plan).toBe(PLAN_PRICE[plan]);
    }
  });

  it('prices any other quota at the credit value, and never decreases with the quota', () => {
    expect(seatPrice(2500)).toBeCloseTo(25, 9);
    expect(seatPrice(1)).toBeCloseTo(0.01, 12);
    expect(seatPrice(0)).toBe(0);
    let prev = -1;
    for (let quota = 0; quota <= 5000; quota += 7) {
      const price = seatPrice(quota);
      expect(price, `quota ${quota}`).toBeGreaterThanOrEqual(prev);
      prev = price;
    }
  });

  it('uses the same plan names as the plan labels of the data layer', () => {
    for (const plan of Object.keys(PLAN_CREDITS)) expect(planLabel(PLAN_CREDITS[plan]), plan).toBe(plan);
  });
});

describe('budgetOf', () => {
  it('is the amount for a positive budget and null for anything else', () => {
    expect(budgetOf({ budgetMonthlyBilled: 150 })).toBe(150);
    expect(budgetOf({ budgetMonthlyBilled: 0.01 })).toBe(0.01);
    for (const budget of [null, 0, -1, Number.NaN, -Infinity]) expect(budgetOf({ budgetMonthlyBilled: budget }), String(budget)).toBeNull();
  });
});

describe('planCredits and seatCredits', () => {
  it('reads Business and Enterprise in any case and inside longer names', () => {
    for (const text of ['Business', 'business', ' BUSINESS ', 'Copilot Business', 'GitHub Copilot Business (monthly)']) {
      expect(planCredits(text), text).toBe(1900);
    }
    for (const text of ['Enterprise', 'enterprise', 'Copilot Enterprise', 'ENTERPRISE seat']) {
      expect(planCredits(text), text).toBe(3900);
    }
  });

  it('reads a number of 1,000 or more as credits and a smaller one as dollars of included credits', () => {
    expect(planCredits('3900')).toBe(3900);
    expect(planCredits('1,900')).toBe(1900);
    expect(planCredits('2500')).toBe(2500);
    expect(planCredits('19')).toBe(1900);
    expect(planCredits('$39')).toBe(3900);
    expect(planCredits('0.5')).toBeCloseTo(50, 9);
  });

  it('returns NaN for text that is not a plan', () => {
    for (const text of ['', '   ', 'free', 'none', '0', '-5', 'abc123']) expect(planCredits(text), JSON.stringify(text)).toBeNaN();
    expect(planCredits(undefined)).toBeNaN();
    expect(planCredits(null)).toBeNaN();
  });

  it('counts a seat without a readable plan as the fallback', () => {
    expect(seatCredits(undefined, 1900)).toBe(1900);
    expect(seatCredits(null, 3900)).toBe(3900);
    expect(seatCredits('free', 2500)).toBe(2500);
    expect(seatCredits('Copilot Enterprise', 1900)).toBe(3900);
    expect(seatCredits('19', 3900)).toBe(1900);
  });
});

describe('live price check', () => {
  const asLive = (): LiveModel[] => PRICE_CARD.map((cardEntry) => structuredClone({ name: cardEntry.name, vendor: cardEntry.vendor, category: cardEntry.category, base: cardEntry.base, long: cardEntry.long, longThreshold: cardEntry.longThreshold }));

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('finds no difference when the page matches the price card', () => {
    const check = summarizeLive(asLive());
    expect([check.changed, check.added, check.missing, check.warnings]).toEqual([0, 0, 0, 0]);
  });

  it('counts changed, new and missing models', () => {
    const live = asLive();
    const changed = live[0];
    changed.base = { ...changed.base, output: changed.base.output * 2 };
    const dropped = live.pop()!;
    live.push({ name: 'Test Model X', vendor: 'OpenAI', category: 'Versatile', base: { input: 1, cachedInput: 0.1, cacheWrite: 0, output: 4 } });
    const check = summarizeLive(live, 2);
    expect([check.changed, check.added, check.missing, check.warnings]).toEqual([1, 1, 1, 2]);
    expect(check.diffs[0]).toMatchObject({ name: changed.name, kind: 'changed', fields: ['output'] });
    expect(check.diffs.find((difference) => difference.kind === 'missing')?.name).toBe(dropped.name);
  });

  it('saves prices only for report models whose live price differs, once', () => {
    const live = asLive();
    live[0].base = { ...live[0].base, input: live[0].base.input + 1 };
    live.push({ name: 'Test Model X', vendor: 'OpenAI', category: 'Versatile', base: { input: 1, cachedInput: 0.1, cacheWrite: 0, output: 4 } });
    const report = [live[0].name, live[1].name, 'Test Model X', 'Not On The Page'];
    const first = applyLivePrices(report, live, {});
    expect(first.count).toBe(2);
    expect(Object.keys(first.overrides).sort()).toEqual([live[0].name, 'Test Model X'].sort());
    expect(first.overrides['Test Model X']).toMatchObject({ category: 'Versatile', base: { input: 1, output: 4 } });
    expect(applyLivePrices(report, live, first.overrides).count).toBe(0);
  });

  it('reads a GitHub Docs page from a stubbed fetch', async () => {
    const markdown = ['## OpenAI', '| Model | Category | Input | Cached input | Output |', '|---|---|---|---|---|', '| Test Model X | Versatile | $1 | $0.1 | $4 |'].join('\n');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(markdown, { status: 200 })));
    const check = await checkLivePrices();
    expect(check.added).toBe(1);
    expect(check.missing).toBe(PRICE_CARD.length);
    expect(check.live[0]).toMatchObject({ name: 'Test Model X', vendor: 'OpenAI', category: 'Versatile', base: { input: 1, cachedInput: 0.1, output: 4 } });
  });

  it('throws when GitHub Docs cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503, statusText: 'Service Unavailable' })));
    await expect(checkLivePrices()).rejects.toThrow(/503/);
  });
});

describe('plans in the license list', () => {
  it('keeps reading Business, Enterprise, credits and dollars as before', () => {
    expect(parsePlan('Business')).toBe('Business');
    expect(parsePlan('GitHub Copilot Enterprise')).toBe('Enterprise');
    expect(parsePlan('3900')).toBe('Enterprise');
    expect(parsePlan('1,900 credits')).toBe('Business');
    expect(parsePlan('$39')).toBe('Enterprise');
    expect(parsePlan('19')).toBe('Business');
    expect(parsePlan('2500')).toBe('2500');
    expect(parsePlan('$25')).toBe('2500');
    expect(parsePlan('500 credits')).toBe('5');
    expect(parsePlan('')).toBeUndefined();
    expect(parsePlan('premium')).toBeNull();
    expect(parsePlan('-5')).toBeNull();
  });

  it('reads the label the report gives a custom plan as its credits', () => {
    expect(parsePlan('Custom (2,500 credits)')).toBe('2500');
    expect(parsePlan('"Custom (2,500 credits)"')).toBe('2500');
    expect(parsePlan('custom (500 credits)')).toBe('5');
    expect(parsePlan('Custom (1,900 credits)')).toBe('Business');
    expect(parsePlan('Custom (0 credits)')).toBeNull();
    for (const credits of [500, 1000, 2500, 12000]) {
      const plan = parsePlan(planLabel(credits));
      expect(typeof plan, String(credits)).toBe('string');
      expect(planCredits(plan as string), String(credits)).toBe(credits);
    }
  });

  it('imports custom plan labels from pasted lines and CSV files, and shows them by their credits', () => {
    const pasted = parseRoster('alice,Custom (2,500 credits)\nbob Custom (1,000 credits)\ncarol;Business\ndave 19');
    expect(pasted.entries).toEqual([
      { user: 'alice', plan: '2500' },
      { user: 'bob', plan: '1000' },
      { user: 'carol', plan: 'Business' },
      { user: 'dave', plan: 'Business' },
    ]);
    expect(pasted.unreadablePlans).toBe(0);
    expect(pasted.ignoredCount).toBe(0);

    const csv = parseRoster('username,plan\nerin,"Custom (2,500 credits)"\nfrank,Enterprise');
    expect(csv.headerSkipped).toBe(true);
    expect(csv.entries).toEqual([
      { user: 'erin', plan: '2500' },
      { user: 'frank', plan: 'Enterprise' },
    ]);
    expect(planText('2500')).toBe('Custom (2,500 credits)');
    expect(planText('Custom (2,500 credits)')).toBe('Custom (2,500 credits)');
  });

  it('still leaves out a line whose second word is not a plan', () => {
    const parsed = parseRoster('john smith');
    expect(parsed.entries).toEqual([]);
    expect(parsed.ignoredCount).toBe(1);
  });
});
