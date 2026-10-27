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
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const normal = (random: Rng): number => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
const logNormal = (random: Rng, median: number, sigma: number): number => median * Math.exp(sigma * normal(random));
const between = (random: Rng, low: number, high: number): number => low + (high - low) * random();
const chance = (random: Rng, probability: number): boolean => random() < probability;

function pickWeighted<T>(random: Rng, items: [T, number][]): T {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let remaining = random() * total;
  for (const [choice, weight] of items) {
    remaining -= weight;
    if (remaining <= 0) return choice;
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

const round9 = (value: number): number => Math.round(value * 1e9) / 1e9;
const CARD = new Map<string, CardEntry>(PRICE_CARD.map((card) => [card.name, card]));

function tokenCost(rate: CardEntry['base'], inputTokens: number, cacheReadTokens: number, cacheWriteTokens: number, outputTokens: number): number {
  return (inputTokens * rate.input + cacheReadTokens * rate.cachedInput + cacheWriteTokens * rate.cacheWrite + outputTokens * rate.output) / 1e6;
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
function listCost(card: CardEntry, tokens: Omit<Priced, 'cost'>, longFrac: number): number {
  let cost = tokenCost(card.base, tokens.input, tokens.cacheRead, tokens.cacheWrite, tokens.output);
  if (longFrac > 0 && card.long) {
    cost = (1 - longFrac) * cost + longFrac * tokenCost(card.long, tokens.input, tokens.cacheRead, tokens.cacheWrite, tokens.output);
  }
  return cost;
}

/** Builds one daily usage row for a model so that the token counts add up to roughly `targetUsd` at list price. */
function priceRow(random: Rng, card: CardEntry, targetUsd: number, cacheGood: boolean, longFrac: number): Priced {
  const rate = card.base;
  let inputShare = cacheGood ? between(random, 0.01, 0.04) : between(random, 0.1, 0.16);
  let cacheReadShare = cacheGood ? between(random, 0.4, 0.62) : between(random, 0.02, 0.05);
  let cacheWriteShare = cacheGood ? between(random, 0.1, 0.22) : between(random, 0.45, 0.58);
  if (rate.cacheWrite === 0) {
    cacheReadShare += cacheWriteShare * 0.7;
    inputShare += cacheWriteShare * 0.3;
    cacheWriteShare = 0;
  }
  const outputShare = Math.max(0.05, 1 - inputShare - cacheReadShare - cacheWriteShare);
  const target = Math.max(targetUsd, 1e-6);
  const input = Math.round((target * inputShare * 1e6) / rate.input);
  const cacheRead = Math.round((target * cacheReadShare * 1e6) / rate.cachedInput);
  const cacheWrite = rate.cacheWrite > 0 ? Math.round((target * cacheWriteShare * 1e6) / rate.cacheWrite) : 0;
  const output = Math.round((target * outputShare * 1e6) / rate.output);
  const tokens = { input, output, cacheRead, cacheWrite };
  return { ...tokens, cost: listCost(card, tokens, longFrac) };
}

/** Auto bills a fixed share of the list price, so a row that lands on its target amount carries more tokens: scale them up to match. */
function throughAuto(card: CardEntry, priced: Priced, longFrac: number): Priced {
  const scale = 1 / AUTO_PRICE_FACTOR;
  const tokens = {
    input: Math.round(priced.input * scale),
    output: Math.round(priced.output * scale),
    cacheRead: Math.round(priced.cacheRead * scale),
    cacheWrite: Math.round(priced.cacheWrite * scale),
  };
  return { ...tokens, cost: listCost(card, tokens, longFrac) };
}

function buildUsers(random: Rng, firstDay: number, lastDay: number): DemoUser[] {
  const users: DemoUser[] = [];
  const nameKeys = new Set<string>();
  const total = PERSONAS.reduce((sum, persona) => sum + persona.count, 0);
  const span = lastDay - firstDay;
  let userCount = 0;
  for (const persona of PERSONAS) {
    for (let k = 0; k < persona.count; k++) {
      let name = '';
      do {
        name = `${FIRST[Math.floor(random() * FIRST.length)]}-${LAST[Math.floor(random() * LAST.length)]}`;
      } while (nameKeys.has(name));
      nameKeys.add(name);
      const org = pickWeighted(random, ORGS.map((orgOption) => [orgOption, orgOption.weight] as [(typeof ORGS)[number], number]));
      const enterprise = chance(random, persona.id === 'runaway' ? 0.4 : 0.34);
      const quota = enterprise ? 3900 : 1900;
      const utilization = between(random, persona.util[0], persona.util[1]);
      const pWork = between(random, persona.pWork[0], persona.pWork[1]);
      const expectedDays = Math.max(0.5, 21.7 * pWork + 8.7 * persona.pWeekend);
      const base = (utilization * quota * 0.01) / (expectedDays * Math.exp((persona.sigma * persona.sigma) / 2));
      let first = firstDay;
      let last = lastDay;
      if (persona.id === 'new') first = lastDay - Math.floor(between(random, 3, 12));
      if (persona.id === 'lapsed') last = lastDay - Math.floor(between(random, 9, 30));
      if (persona.id === 'burst' && chance(random, 0.3)) first = firstDay + Math.floor(between(random, 3, span / 2));
      const noCostCenter = persona.id !== 'runaway' && chance(random, 0.09);
      users.push({
        name,
        persona,
        org: org.name,
        org2: !noCostCenter && chance(random, 0.04) ? ORGS.find((otherOrg) => otherOrg.name !== org.name)!.name : null,
        costCenter: noCostCenter ? '' : org.centers[Math.floor(random() * org.centers.length)],
        quota,
        first,
        last,
        base,
        growth: between(random, persona.growth[0], persona.growth[1]),
        pWork,
        pWeekend: persona.pWeekend,
        mix: pickWeighted(random, persona.mix),
        autoRate: between(random, persona.autoRate[0], persona.autoRate[1]),
        cacheGood: chance(random, persona.cacheGood),
        longFrac: between(random, persona.longFrac[0], persona.longFrac[1]),
        sigma: persona.sigma,
      });
      userCount++;
    }
  }
  if (userCount !== total) throw new Error('persona counts do not add up');
  return users;
}

const quote = (cell: string): string => `"${cell.replace(/"/g, '""')}"`;
const formatNumber = (value: number): string => String(Number(value.toFixed(9)));

export function generateDemo(options: DemoOptions = {}): DemoResult {
  const random = mulberry32(options.seed ?? 20261026);
  const [startYear, startMonth, startDayOfMonth] = (options.start ?? '2026-09-01').split('-').map(Number);
  const [endYear, endMonth, endDayOfMonth] = (options.end ?? '2026-10-26').split('-').map(Number);
  const firstDay = dayFromYMD(startYear, startMonth - 1, startDayOfMonth);
  const lastDay = dayFromYMD(endYear, endMonth - 1, endDayOfMonth);
  const users = buildUsers(random, firstDay, lastDay);
  const rows: Row[] = [];
  let sequence = 0;
  const span = Math.max(1, lastDay - firstDay);
  // Team-wide spike days (e.g. a hackathon): everybody uses a bit more.
  const spikeDays = new Set<number>([firstDay + Math.floor(span * 0.45), firstDay + Math.floor(span * 0.78)]);

  /** One active day of one user: one to three model rows. */
  const emitUserDay = (randomStream: Rng, user: DemoUser, day: number, spike: boolean): void => {
    const growth = 1 + (user.growth - 1) * ((day - firstDay) / span);
    const dayTarget = logNormal(randomStream, user.base * growth * (spike ? 2.4 : 1), user.sigma);
    const modelCount = 1 + (chance(randomStream, 0.45) ? 1 : 0) + (chance(randomStream, 0.15) ? 1 : 0);
    const used = new Set<string>();
    const weights = Array.from({ length: modelCount }, () => 0.25 + randomStream());
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    for (let modelIndex = 0; modelIndex < modelCount; modelIndex++) {
      let model = pickWeighted(randomStream, MIXES[user.mix]);
      let guard = 0;
      while (used.has(model) && guard++ < 6) model = pickWeighted(randomStream, MIXES[user.mix]);
      if (used.has(model)) continue;
      used.add(model);
      const card = CARD.get(model);
      if (!card) continue;
      const target = (dayTarget * weights[modelIndex]) / totalWeight;
      const long = user.longFrac > 0 && card.long && card.category === 'Powerful' && chance(randomStream, 0.7) ? user.longFrac : 0;
      const priced = priceRow(randomStream, card, target, user.cacheGood, long);
      const auto = chance(randomStream, user.autoRate);
      const usage = auto ? throughAuto(card, priced, long) : priced;
      const billed = auto ? usage.cost * AUTO_PRICE_FACTOR : usage.cost;
      const billingOrg = user.org2 && chance(randomStream, 0.3) ? user.org2 : user.org;
      rows.push({
        day,
        user: user.name,
        product: 'copilot',
        sku: 'copilot_ai_credit',
        model: auto ? `Auto: ${model}` : model,
        quota: user.quota,
        org: billingOrg,
        repo: '',
        costCenter: user.costCenter,
        gross: billed,
        qty: billed / 0.01,
        input: usage.input,
        output: usage.output,
        cacheRead: usage.cacheRead,
        cacheWrite: usage.cacheWrite,
        seq: sequence++,
      });
    }
  };

  const active = new Set<DemoUser>();
  for (let day = firstDay; day <= lastDay; day++) {
    const weekday = dowOf(day) < 5;
    const spike = spikeDays.has(day);
    for (const user of users) {
      if (day < user.first || day > user.last) continue;
      const probability = (weekday ? user.pWork : user.pWeekend) * (spike && weekday ? 1.25 : 1);
      if (!chance(random, Math.min(0.99, probability))) continue;
      active.add(user);
      emitUserDay(random, user, day, spike);
    }
    // Repository-level products (no user): code quality and code security scans.
    if (weekday && chance(random, 0.55)) {
      const scanCount = 1 + Math.floor(random() * 3);
      for (let i = 0; i < scanCount; i++) {
        const security = chance(random, 0.35);
        const model = security ? 'GPT-5.3-Codex' : 'GPT-5.6 Terra';
        const card = CARD.get(model)!;
        const usage = priceRow(random, card, between(random, 0.002, 0.06), true, 0);
        rows.push({
          day,
          user: '',
          product: security ? 'ghas' : 'code_quality',
          sku: security ? 'code_security_ai_credit' : 'code_quality_ai_credit',
          model,
          quota: 0,
          org: ORGS[Math.floor(random() * ORGS.length)].name,
          repo: REPOS[Math.floor(random() * REPOS.length)],
          costCenter: '',
          gross: usage.cost,
          qty: usage.cost / 0.01,
          input: usage.input,
          output: usage.output,
          cacheRead: usage.cacheRead,
          cacheWrite: usage.cacheWrite,
          seq: sequence++,
        });
      }
    }
  }

  // A seat that never used GitHub Copilot does not appear in an export, but every planned seat should show up. A seat that stayed silent by chance
  // gets one working day. It draws from its own random stream, so the rest of the file is unchanged.
  const rescue = mulberry32(((options.seed ?? 20261026) ^ 0x9e3779b9) >>> 0);
  for (const user of users) {
    if (active.has(user)) continue;
    const days: number[] = [];
    for (let candidateDay = Math.max(user.first, firstDay); candidateDay <= Math.min(user.last, lastDay); candidateDay++) if (dowOf(candidateDay) < 5) days.push(candidateDay);
    if (days.length === 0) continue;
    const day = days[Math.floor(rescue() * days.length)];
    emitUserDay(rescue, user, day, spikeDays.has(day));
  }

  // Pool per calendar month = sum of the included credits of every seat seen that month; it drains in date order.
  rows.sort((a, b) => a.day - b.day || a.seq - b.seq);
  const monthOf = (day: number): string => isoDate(day).slice(0, 7);
  const pool = new Map<string, number>();
  const seen = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.user) continue;
    const month = monthOf(row.day);
    let seenUsers = seen.get(month);
    if (!seenUsers) seen.set(month, (seenUsers = new Set()));
    if (!seenUsers.has(row.user)) {
      seenUsers.add(row.user);
      pool.set(month, (pool.get(month) ?? 0) + row.quota * 0.01);
    }
  }

  const head = [
    'date', 'username', 'product', 'sku', 'model', 'quantity', 'unit_type', 'applied_cost_per_quantity', 'gross_amount', 'discount_amount', 'net_amount',
    'total_monthly_quota', 'organization', 'app_client_id', 'repository', 'cost_center_name', 'aic_quantity', 'aic_gross_amount', 'input', 'output', 'cache_read', 'cache_write',
  ];
  const lines: string[] = [head.map(quote).join(',')];
  for (const row of rows) {
    const month = monthOf(row.day);
    const quantity = round9(row.qty);
    const gross = round9(quantity * 0.01);
    const left = pool.get(month) ?? 0;
    const discount = round9(Math.min(gross, left));
    pool.set(month, left - discount);
    const net = round9(gross - discount);
    lines.push(
      [
        isoDate(row.day),
        row.user,
        row.product,
        row.sku,
        row.model,
        formatNumber(quantity),
        'ai-credits',
        '0.01',
        formatNumber(gross),
        formatNumber(discount),
        formatNumber(net),
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
        .map(quote)
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
