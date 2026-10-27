import { PRICE_CARD, type CardEntry } from '../pricing/card.ts';
import { dayFromYMD, dowOf, isoDate } from '../utils/date.ts';

/**
 * Deterministic synthetic GitHub Copilot AI-credit report. It mirrors the real export format and the real billing
 * rules: gross = list price of the tokens (10% less for requests handled by Auto model selection), the monthly pool
 * (the sum of the seats' included credits) covers usage first-come-first-served, and whatever is left over is billed.
 */

/** Share of the list price that Auto model selection bills, as in a real export: the discount is inside `quantity`. */
const AUTO_PRICE_FACTOR = 0.9;

export interface DemoOptions {
  seed?: number;
  /** Inclusive first and last day, as ISO dates. */
  start?: string;
  end?: string;
}

export interface DemoResult {
  csv: string;
  rows: number;
  users: number;
  start: string;
  end: string;
}

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const normal = (r: Rng): number => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const logNormal = (r: Rng, median: number, sigma: number): number => median * Math.exp(sigma * normal(r));
const between = (r: Rng, lo: number, hi: number): number => lo + (hi - lo) * r();
const chance = (r: Rng, p: number): boolean => r() < p;

function pickWeighted<T>(r: Rng, items: [T, number][]): T {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let x = r() * total;
  for (const [v, w] of items) {
    x -= w;
    if (x <= 0) return v;
  }
  return items[items.length - 1][0];
}

type MixId = 'frontier' | 'heavy' | 'balanced' | 'efficient';

const MIXES: Record<MixId, [string, number][]> = {
  frontier: [
    ['Claude Opus 5.5', 0.4],
    ['GPT-6 Astra', 0.16],
    ['Claude Opus 5', 0.14],
    ['GPT-6.1 Sol', 0.1],
    ['Claude Sonnet 5.5', 0.12],
    ['GPT-5.6 Luna', 0.08],
  ],
  heavy: [
    ['GPT-6 Astra', 0.5],
    ['Claude Opus 5.5', 0.25],
    ['GPT-6.1 Sol', 0.15],
    ['GPT-5.6 Sol', 0.1],
  ],
  balanced: [
    ['Claude Sonnet 5.5', 0.3],
    ['GPT-5.6 Terra', 0.2],
    ['Claude Opus 5.5', 0.2],
    ['GPT-6 Sol', 0.1],
    ['Gemini 3.8 Flash', 0.1],
    ['Claude Haiku 4.5', 0.1],
  ],
  efficient: [
    ['GPT-5.6 Luna', 0.25],
    ['Claude Haiku 5.5', 0.2],
    ['Gemini 3.8 Flash', 0.2],
    ['MAI-Code-1.1-Flash', 0.1],
    ['GPT-6 Luna', 0.1],
    ['Grok 4.7', 0.15],
  ],
};

interface Persona {
  id: string;
  count: number;
  /** Target monthly utilization of the user's included credits (low, high). */
  util: [number, number];
  /** Probability of using GitHub Copilot on a workday / weekend day. */
  pWork: [number, number];
  pWeekend: number;
  sigma: number;
  mix: [MixId, number][];
  autoRate: [number, number];
  cacheGood: number;
  longFrac: [number, number];
  /** Month-over-month growth of the user's spend (end of period vs start). */
  growth: [number, number];
}

const PERSONAS: Persona[] = [
  { id: 'champion', count: 8, util: [1.0, 2.1], pWork: [0.85, 0.98], pWeekend: 0.12, sigma: 0.55, mix: [['balanced', 3], ['frontier', 1]], autoRate: [0.3, 0.8], cacheGood: 0.9, longFrac: [0, 0.01], growth: [0.9, 1.3] },
  { id: 'core', count: 8, util: [0.5, 0.95], pWork: [0.6, 0.85], pWeekend: 0.05, sigma: 0.6, mix: [['balanced', 5], ['efficient', 1], ['frontier', 1]], autoRate: [0, 0.6], cacheGood: 0.8, longFrac: [0, 0.01], growth: [0.85, 1.3] },
  { id: 'steady', count: 16, util: [0.12, 0.38], pWork: [0.4, 0.8], pWeekend: 0.03, sigma: 0.65, mix: [['balanced', 3], ['efficient', 3], ['frontier', 1]], autoRate: [0, 0.5], cacheGood: 0.7, longFrac: [0, 0], growth: [0.85, 1.3] },
  { id: 'light', count: 4, util: [0.1, 0.3], pWork: [0.1, 0.2], pWeekend: 0.01, sigma: 0.7, mix: [['efficient', 2], ['balanced', 1]], autoRate: [0, 0.4], cacheGood: 0.7, longFrac: [0, 0], growth: [0.8, 1.2] },
  { id: 'burst', count: 7, util: [0.25, 0.9], pWork: [0.08, 0.2], pWeekend: 0.02, sigma: 1.15, mix: [['frontier', 2], ['balanced', 1]], autoRate: [0, 0.2], cacheGood: 0.5, longFrac: [0, 0.03], growth: [0.8, 1.5] },
  { id: 'dormant', count: 7, util: [0.005, 0.07], pWork: [0.03, 0.1], pWeekend: 0, sigma: 0.6, mix: [['efficient', 1]], autoRate: [0, 0.2], cacheGood: 0.5, longFrac: [0, 0], growth: [0.7, 1] },
  { id: 'runaway', count: 3, util: [5, 9], pWork: [0.8, 0.95], pWeekend: 0.25, sigma: 0.5, mix: [['heavy', 1]], autoRate: [0, 0.05], cacheGood: 0.2, longFrac: [0.25, 0.6], growth: [1.1, 1.8] },
  { id: 'new', count: 4, util: [0.3, 0.9], pWork: [0.6, 0.9], pWeekend: 0.05, sigma: 0.6, mix: [['balanced', 1]], autoRate: [0, 0.6], cacheGood: 0.7, longFrac: [0, 0], growth: [1, 1.6] },
  { id: 'lapsed', count: 3, util: [0.3, 0.8], pWork: [0.5, 0.8], pWeekend: 0.03, sigma: 0.6, mix: [['balanced', 1], ['efficient', 1]], autoRate: [0, 0.4], cacheGood: 0.7, longFrac: [0, 0], growth: [0.6, 1] },
];

const FIRST = [
  'ava', 'liam', 'noah', 'mia', 'zoe', 'omar', 'lena', 'ravi', 'chloe', 'ethan', 'sofia', 'jack', 'nina', 'yuki', 'amir', 'ella', 'hugo', 'ivy', 'kai', 'luca',
  'maya', 'nico', 'olive', 'pablo', 'quinn', 'rosa', 'sam', 'tara', 'uma', 'vik', 'wren', 'xena', 'yara', 'zane', 'abel', 'bea', 'cole', 'dara', 'eli', 'fay',
  'gus', 'hana', 'ian', 'jade', 'kofi', 'lila', 'milo', 'nora', 'otto', 'pia', 'remy', 'sana', 'theo', 'una', 'vera', 'will', 'xavi', 'yana', 'zack', 'anya',
];
const LAST = [
  'nguyen', 'patel', 'garcia', 'kim', 'rossi', 'khan', 'silva', 'novak', 'olsen', 'meyer', 'sato', 'ali', 'cohen', 'dubois', 'fischer', 'gupta', 'haas', 'ito', 'jones', 'klein',
  'lopez', 'moreau', 'nakamura', 'ortiz', 'petrov', 'quist', 'reyes', 'singh', 'tan', 'ueda', 'vogel', 'wong', 'xu', 'yilmaz', 'zhou', 'adler', 'baker', 'chen', 'diaz', 'evans',
  'ford', 'grant', 'hill', 'ibarra', 'joshi', 'kaur', 'lund', 'mori', 'noor', 'owens', 'park', 'reid', 'shah', 'tran', 'usman', 'voss', 'ward', 'yamada', 'zahn', 'berg',
];

const ORGS: { name: string; weight: number; centers: string[] }[] = [
  { name: 'northwind-platform', weight: 4, centers: ['Platform Services', 'Security Operations'] },
  { name: 'northwind-apps', weight: 3.4, centers: ['Mobile Studio', 'Web Storefront', 'Release Quality'] },
  { name: 'northwind-data', weight: 2.6, centers: ['Analytics Lab'] },
];

const REPOS = ['billing-api', 'storefront-ui', 'ios-client', 'etl-jobs', 'deploy-scripts', 'login-service', 'model-lab'];

interface DemoUser {
  name: string;
  persona: Persona;
  org: string;
  /** Second billing organization for users who work across two orgs. */
  org2: string | null;
  costCenter: string;
  quota: number;
  first: number;
  last: number;
  base: number; // median spend per active day (USD) at the start of the period
  growth: number;
  pWork: number;
  pWeekend: number;
  mix: MixId;
  autoRate: number;
  cacheGood: boolean;
  longFrac: number;
  sigma: number;
}

interface Row {
  day: number;
  user: string;
  product: string;
  sku: string;
  model: string;
  quota: number;
  org: string;
  repo: string;
  costCenter: string;
  gross: number;
  qty: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  seq: number;
}

const round9 = (x: number): number => Math.round(x * 1e9) / 1e9;
const CARD = new Map<string, CardEntry>(PRICE_CARD.map((c) => [c.name, c]));

function tokenCost(rate: CardEntry['base'], i: number, cr: number, cw: number, o: number): number {
  return (i * rate.input + cr * rate.cachedInput + cw * rate.cacheWrite + o * rate.output) / 1e6;
}

interface Priced {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** List price of the tokens. */
  cost: number;
}

/** List price of the tokens; a share `longFrac` of them is billed at the long-context rates. */
function listCost(card: CardEntry, t: Omit<Priced, 'cost'>, longFrac: number): number {
  let cost = tokenCost(card.base, t.input, t.cacheRead, t.cacheWrite, t.output);
  if (longFrac > 0 && card.long) {
    cost = (1 - longFrac) * cost + longFrac * tokenCost(card.long, t.input, t.cacheRead, t.cacheWrite, t.output);
  }
  return cost;
}

/** Builds one daily usage row for a model so that the token counts add up to roughly `targetUsd` at list price. */
function priceRow(r: Rng, card: CardEntry, targetUsd: number, cacheGood: boolean, longFrac: number): Priced {
  const rate = card.base;
  let sIn = cacheGood ? between(r, 0.01, 0.04) : between(r, 0.1, 0.16);
  let sCr = cacheGood ? between(r, 0.4, 0.62) : between(r, 0.02, 0.05);
  let sCw = cacheGood ? between(r, 0.1, 0.22) : between(r, 0.45, 0.58);
  if (rate.cacheWrite === 0) {
    sCr += sCw * 0.7;
    sIn += sCw * 0.3;
    sCw = 0;
  }
  const sOut = Math.max(0.05, 1 - sIn - sCr - sCw);
  const t = Math.max(targetUsd, 1e-6);
  const input = Math.round((t * sIn * 1e6) / rate.input);
  const cacheRead = Math.round((t * sCr * 1e6) / rate.cachedInput);
  const cacheWrite = rate.cacheWrite > 0 ? Math.round((t * sCw * 1e6) / rate.cacheWrite) : 0;
  const output = Math.round((t * sOut * 1e6) / rate.output);
  const tokens = { input, output, cacheRead, cacheWrite };
  return { ...tokens, cost: listCost(card, tokens, longFrac) };
}

/** Auto bills a fixed share of the list price, so a row that lands on its target amount carries more tokens: scale them up to match. */
function throughAuto(card: CardEntry, t: Priced, longFrac: number): Priced {
  const k = 1 / AUTO_PRICE_FACTOR;
  const tokens = {
    input: Math.round(t.input * k),
    output: Math.round(t.output * k),
    cacheRead: Math.round(t.cacheRead * k),
    cacheWrite: Math.round(t.cacheWrite * k),
  };
  return { ...tokens, cost: listCost(card, tokens, longFrac) };
}

function buildUsers(r: Rng, firstDay: number, lastDay: number): DemoUser[] {
  const users: DemoUser[] = [];
  const nameKeys = new Set<string>();
  const total = PERSONAS.reduce((a, p) => a + p.count, 0);
  const span = lastDay - firstDay;
  let idx = 0;
  for (const persona of PERSONAS) {
    for (let k = 0; k < persona.count; k++) {
      let name = '';
      do {
        name = `${FIRST[Math.floor(r() * FIRST.length)]}-${LAST[Math.floor(r() * LAST.length)]}`;
      } while (nameKeys.has(name));
      nameKeys.add(name);
      const org = pickWeighted(r, ORGS.map((o) => [o, o.weight] as [(typeof ORGS)[number], number]));
      const enterprise = chance(r, persona.id === 'runaway' ? 0.4 : 0.34);
      const quota = enterprise ? 3900 : 1900;
      const util = between(r, persona.util[0], persona.util[1]);
      const pWork = between(r, persona.pWork[0], persona.pWork[1]);
      const expectedDays = Math.max(0.5, 21.7 * pWork + 8.7 * persona.pWeekend);
      const base = (util * quota * 0.01) / (expectedDays * Math.exp((persona.sigma * persona.sigma) / 2));
      let first = firstDay;
      let last = lastDay;
      if (persona.id === 'new') first = lastDay - Math.floor(between(r, 3, 12));
      if (persona.id === 'lapsed') last = lastDay - Math.floor(between(r, 9, 30));
      if (persona.id === 'burst' && chance(r, 0.3)) first = firstDay + Math.floor(between(r, 3, span / 2));
      const noCostCenter = persona.id !== 'runaway' && chance(r, 0.09);
      users.push({
        name,
        persona,
        org: org.name,
        org2: !noCostCenter && chance(r, 0.04) ? ORGS.find((o) => o.name !== org.name)!.name : null,
        costCenter: noCostCenter ? '' : org.centers[Math.floor(r() * org.centers.length)],
        quota,
        first,
        last,
        base,
        growth: between(r, persona.growth[0], persona.growth[1]),
        pWork,
        pWeekend: persona.pWeekend,
        mix: pickWeighted(r, persona.mix),
        autoRate: between(r, persona.autoRate[0], persona.autoRate[1]),
        cacheGood: chance(r, persona.cacheGood),
        longFrac: between(r, persona.longFrac[0], persona.longFrac[1]),
        sigma: persona.sigma,
      });
      idx++;
    }
  }
  if (idx !== total) throw new Error('persona counts do not add up');
  return users;
}

const q = (s: string): string => `"${s.replace(/"/g, '""')}"`;
const num = (x: number): string => String(Number(x.toFixed(9)));

export function generateDemo(opts: DemoOptions = {}): DemoResult {
  const r = mulberry32(opts.seed ?? 20261026);
  const [sy, sm, sd] = (opts.start ?? '2026-09-01').split('-').map(Number);
  const [ey, em, ed] = (opts.end ?? '2026-10-26').split('-').map(Number);
  const firstDay = dayFromYMD(sy, sm - 1, sd);
  const lastDay = dayFromYMD(ey, em - 1, ed);
  const users = buildUsers(r, firstDay, lastDay);
  const rows: Row[] = [];
  let seq = 0;
  const span = Math.max(1, lastDay - firstDay);
  // Team-wide spike days (e.g. a hackathon): everybody uses a bit more.
  const spikeDays = new Set<number>([firstDay + Math.floor(span * 0.45), firstDay + Math.floor(span * 0.78)]);

  /** One active day of one user: one to three model rows. */
  const emitUserDay = (rng: Rng, u: DemoUser, day: number, spike: boolean): void => {
    const growth = 1 + (u.growth - 1) * ((day - firstDay) / span);
    const dayTarget = logNormal(rng, u.base * growth * (spike ? 2.4 : 1), u.sigma);
    const k = 1 + (chance(rng, 0.45) ? 1 : 0) + (chance(rng, 0.15) ? 1 : 0);
    const used = new Set<string>();
    const weights = Array.from({ length: k }, () => 0.25 + rng());
    const wSum = weights.reduce((a, b) => a + b, 0);
    for (let m = 0; m < k; m++) {
      let model = pickWeighted(rng, MIXES[u.mix]);
      let guard = 0;
      while (used.has(model) && guard++ < 6) model = pickWeighted(rng, MIXES[u.mix]);
      if (used.has(model)) continue;
      used.add(model);
      const card = CARD.get(model);
      if (!card) continue;
      const target = (dayTarget * weights[m]) / wSum;
      const long = u.longFrac > 0 && card.long && card.category === 'Powerful' && chance(rng, 0.7) ? u.longFrac : 0;
      const priced = priceRow(rng, card, target, u.cacheGood, long);
      const auto = chance(rng, u.autoRate);
      const t = auto ? throughAuto(card, priced, long) : priced;
      const billed = auto ? t.cost * AUTO_PRICE_FACTOR : t.cost;
      const billingOrg = u.org2 && chance(rng, 0.3) ? u.org2 : u.org;
      rows.push({
        day,
        user: u.name,
        product: 'copilot',
        sku: 'copilot_ai_credit',
        model: auto ? `Auto: ${model}` : model,
        quota: u.quota,
        org: billingOrg,
        repo: '',
        costCenter: u.costCenter,
        gross: billed,
        qty: billed / 0.01,
        input: t.input,
        output: t.output,
        cacheRead: t.cacheRead,
        cacheWrite: t.cacheWrite,
        seq: seq++,
      });
    }
  };

  const active = new Set<DemoUser>();
  for (let day = firstDay; day <= lastDay; day++) {
    const weekday = dowOf(day) < 5;
    const spike = spikeDays.has(day);
    for (const u of users) {
      if (day < u.first || day > u.last) continue;
      const p = (weekday ? u.pWork : u.pWeekend) * (spike && weekday ? 1.25 : 1);
      if (!chance(r, Math.min(0.99, p))) continue;
      active.add(u);
      emitUserDay(r, u, day, spike);
    }
    // Repository-level products (no user): code quality and code security scans.
    if (weekday && chance(r, 0.55)) {
      const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const security = chance(r, 0.35);
        const model = security ? 'GPT-5.3-Codex' : 'GPT-5.6 Terra';
        const card = CARD.get(model)!;
        const t = priceRow(r, card, between(r, 0.002, 0.06), true, 0);
        rows.push({
          day,
          user: '',
          product: security ? 'ghas' : 'code_quality',
          sku: security ? 'code_security_ai_credit' : 'code_quality_ai_credit',
          model,
          quota: 0,
          org: ORGS[Math.floor(r() * ORGS.length)].name,
          repo: REPOS[Math.floor(r() * REPOS.length)],
          costCenter: '',
          gross: t.cost,
          qty: t.cost / 0.01,
          input: t.input,
          output: t.output,
          cacheRead: t.cacheRead,
          cacheWrite: t.cacheWrite,
          seq: seq++,
        });
      }
    }
  }

  // A seat that never used GitHub Copilot does not appear in an export, but every planned seat should show up. A seat that stayed silent by chance
  // gets one working day. It draws from its own random stream, so the rest of the file is unchanged.
  const rescue = mulberry32(((opts.seed ?? 20261026) ^ 0x9e3779b9) >>> 0);
  for (const u of users) {
    if (active.has(u)) continue;
    const days: number[] = [];
    for (let d = Math.max(u.first, firstDay); d <= Math.min(u.last, lastDay); d++) if (dowOf(d) < 5) days.push(d);
    if (days.length === 0) continue;
    const day = days[Math.floor(rescue() * days.length)];
    emitUserDay(rescue, u, day, spikeDays.has(day));
  }

  // Pool per calendar month = sum of the included credits of every seat seen that month; it drains in date order.
  rows.sort((a, b) => a.day - b.day || a.seq - b.seq);
  const monthOf = (day: number): string => isoDate(day).slice(0, 7);
  const pool = new Map<string, number>();
  const seen = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.user) continue;
    const mk = monthOf(row.day);
    let s = seen.get(mk);
    if (!s) seen.set(mk, (s = new Set()));
    if (!s.has(row.user)) {
      s.add(row.user);
      pool.set(mk, (pool.get(mk) ?? 0) + row.quota * 0.01);
    }
  }

  const head = [
    'date', 'username', 'product', 'sku', 'model', 'quantity', 'unit_type', 'applied_cost_per_quantity', 'gross_amount', 'discount_amount', 'net_amount',
    'total_monthly_quota', 'organization', 'app_client_id', 'repository', 'cost_center_name', 'aic_quantity', 'aic_gross_amount', 'input', 'output', 'cache_read', 'cache_write',
  ];
  const lines: string[] = [head.map(q).join(',')];
  for (const row of rows) {
    const mk = monthOf(row.day);
    const qty = round9(row.qty);
    const gross = round9(qty * 0.01);
    const left = pool.get(mk) ?? 0;
    const discount = round9(Math.min(gross, left));
    pool.set(mk, left - discount);
    const net = round9(gross - discount);
    lines.push(
      [
        isoDate(row.day),
        row.user,
        row.product,
        row.sku,
        row.model,
        num(qty),
        'ai-credits',
        '0.01',
        num(gross),
        num(discount),
        num(net),
        String(row.quota),
        row.org,
        '',
        row.repo,
        row.costCenter,
        '0',
        '0',
        String(row.input),
        String(row.output),
        String(row.cacheRead),
        String(row.cacheWrite),
      ]
        .map(q)
        .join(','),
    );
  }
  return {
    csv: `\uFEFF${lines.join('\n')}\n`,
    rows: rows.length,
    users: new Set(rows.filter((row) => row.user !== '').map((row) => row.user)).size,
    start: isoDate(firstDay),
    end: isoDate(lastDay),
  };
}

export const DEMO_FILE_NAME = 'demo-usage-report.csv';
