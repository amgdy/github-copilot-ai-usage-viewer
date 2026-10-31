import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { collectionLicenseParse, pickBudget, readCollection } from '../src/lib/collection';
import { GH_DEFAULT_API_VERSION, MOCK_HOST, MOCK_TOKEN, startMockGitHub, type MockGitHub, type RecordedRequest } from './collectorMock';

/*
 * Runs the collector scripts with the real GitHub CLI and curl against a pretend GitHub (tests/collectorMock.ts).
 * Only on Linux with gh, curl, openssl and bash installed; otherwise the tests are skipped. The PowerShell script is
 * compared with the bash script when pwsh is installed.
 */

const ROOT = join(import.meta.dirname, '..');
const BASH_SCRIPT = join(ROOT, 'scripts', 'collect.sh');
const POWERSHELL_SCRIPT = join(ROOT, 'scripts', 'collect.ps1');
const RUN_TIMEOUT = 240_000;

const toolWorks = (command: string, args: string[]) => spawnSync(command, args, { stdio: 'ignore', timeout: 20_000 }).status === 0;

const CAN_RUN =
  process.platform === 'linux' &&
  toolWorks('gh', ['--version']) &&
  toolWorks('curl', ['--version']) &&
  toolWorks('bash', ['--version']) &&
  toolWorks('openssl', ['version']);
const HAS_POWERSHELL = CAN_RUN && toolWorks('pwsh', ['-NoLogo', '-NoProfile', '-Command', 'exit 0']);

interface BundleLine {
  kind: string;
  [key: string]: unknown;
}

interface RecordLine extends BundleLine {
  scope: string;
  target: string;
  month?: string;
  parent?: string;
  record: Record<string, unknown>;
}

interface SourceLine extends BundleLine {
  id: string;
  scope: string;
  target: string;
  month?: string;
  status: 'ok' | 'partial' | 'failed' | 'skipped';
  records: number;
  http: number;
  message: string;
  endpoint: string;
}

interface Bundle {
  text: string;
  header: BundleLine;
  records: RecordLine[];
  sources: SourceLine[];
  end: BundleLine;
}

interface RunResult {
  code: number | null;
  output: string;
  errors: string;
}

function readBundle(file: string): Bundle {
  const bytes = readFileSync(file);
  const text = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes).toString('utf8') : bytes.toString('utf8');
  expect(text.endsWith('\n')).toBe(true);
  expect(text).not.toContain('\r');
  const lines = text.trimEnd().split('\n').map((line) => JSON.parse(line) as BundleLine);
  return {
    text,
    header: lines[0],
    records: lines.filter((line) => !['header', 'source', 'end'].includes(line.kind)) as RecordLine[],
    sources: lines.filter((line) => line.kind === 'source') as SourceLine[],
    end: lines[lines.length - 1],
  };
}

function countByKind(records: RecordLine[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const line of records) counts[line.kind] = (counts[line.kind] ?? 0) + 1;
  return counts;
}

/** Sorts object keys at every level, so two lines with the same data give the same text. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
  }
  return value;
}

const comparable = (bundle: Bundle) => ({
  records: bundle.records.map((line) => JSON.stringify(canonical(line))),
  sources: bundle.sources.map((line) => JSON.stringify(canonical(line))),
  end: bundle.end.records,
});

const today = Temporal.Now.plainDateISO('UTC');
const dayBefore = (days: number) => today.subtract({ days }).toString();
/** The month keys the scripts choose for --months, oldest first. */
const monthKeys = (count: number) =>
  Array.from({ length: count }, (_unused, index) => today.toPlainYearMonth().subtract({ months: count - 1 - index }).toString());

/** The bash options as PowerShell parameters: --daily-metrics becomes -DailyMetrics. */
const POWERSHELL_NAMES: Record<string, string> = {
  '--enterprise': '-Enterprise', '--org': '-Org', '--months': '-Months', '--daily-metrics': '-DailyMetrics', '--teams': '-Teams',
  '--plain': '-Plain', '--yes': '-Yes', '--hostname': '-Hostname', '--output': '-Output', '--only': '-Only', '--skip': '-Skip',
};
const powershellArgs = (args: readonly string[]) => args.map((arg) => POWERSHELL_NAMES[arg] ?? arg);

const apiRequests = (requests: RecordedRequest[]) => requests.filter((request) => request.path.startsWith('/api/'));
const requestsTo = (requests: RecordedRequest[], ending: string) => requests.filter((request) => request.path.endsWith(ending));
const sourcesOf = (bundle: Bundle, id: string) => bundle.sources.filter((line) => line.id === id);

/** The full path of a program on PATH, so a test can run a script with only some programs. */
function findProgram(name: string): string {
  for (const pathFolder of (process.env.PATH ?? '').split(delimiter)) {
    if (pathFolder && existsSync(join(pathFolder, name))) return join(pathFolder, name);
  }
  throw new Error(`${name} is not installed.`);
}

describe.skipIf(!CAN_RUN)('data collector scripts against a pretend GitHub', () => {
  let folder = '';
  let certificateFile = '';
  let mock: MockGitHub;

  beforeAll(async () => {
    folder = mkdtempSync(join(tmpdir(), 'usage-lens-collector-'));
    certificateFile = join(folder, 'certificate.pem');
    const keyFile = join(folder, 'key.pem');
    const made = spawnSync(
      'openssl',
      ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyFile, '-out', certificateFile, '-days', '2',
        '-subj', `/CN=${MOCK_HOST}`, '-addext', `subjectAltName=DNS:${MOCK_HOST}`],
      { stdio: 'ignore' },
    );
    expect(made.status).toBe(0);
    mock = await startMockGitHub(readFileSync(certificateFile, 'utf8'), readFileSync(keyFile, 'utf8'));
    mkdirSync(join(folder, 'home'));
    mkdirSync(join(folder, 'temp'));
  });

  afterAll(async () => {
    await mock?.close();
    if (folder) rmSync(folder, { recursive: true, force: true });
  });

  beforeEach(() => mock.reset());

  /** Only what the scripts need: no real token, no real proxy settings, and every request goes to the pretend GitHub. */
  function environment(): NodeJS.ProcessEnv {
    return {
      PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
      HOME: join(folder, 'home'),
      TMPDIR: join(folder, 'temp'),
      GH_CONFIG_DIR: join(folder, 'home', 'gh-config'),
      GH_ENTERPRISE_TOKEN: MOCK_TOKEN,
      HTTPS_PROXY: mock.proxyUrl,
      https_proxy: mock.proxyUrl,
      SSL_CERT_FILE: certificateFile,
      CURL_CA_BUNDLE: certificateFile,
      NO_COLOR: '1',
      GH_NO_UPDATE_NOTIFIER: '1',
      GH_PROMPT_DISABLED: '1',
      POWERSHELL_TELEMETRY_OPTOUT: '1',
      POWERSHELL_UPDATECHECK: 'Off',
      USAGE_LENS_RETRY_SECONDS: '0',
    };
  }

  function run(script: 'bash' | 'powershell', args: string[], changes: NodeJS.ProcessEnv = {}): Promise<RunResult> {
    const [command, commandArgs] =
      script === 'bash' ? ['bash', [BASH_SCRIPT, ...args]] : ['pwsh', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', POWERSHELL_SCRIPT, ...args]];
    return new Promise((resolve, reject) => {
      const child = spawn(command as string, commandArgs as string[], { cwd: folder, env: { ...environment(), ...changes }, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      let errors = '';
      child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')));
      child.stderr.on('data', (chunk: Buffer) => (errors += chunk.toString('utf8')));
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, output, errors }));
    });
  }

  const enterpriseArgs = (file: string) => ['--enterprise', 'octocorp', '--months', '2', '--teams', '--plain', '--yes', '--hostname', MOCK_HOST, '--output', file];
  const organizationArgs = (file: string) => ['--org', 'octo-org', '--months', '3', '--daily-metrics', '--yes', '--hostname', MOCK_HOST, '--output', file];

  function expectSafeRequests(requests: RecordedRequest[], apiVersion: string | undefined) {
    expect(requests.length).toBeGreaterThan(0);
    for (const request of apiRequests(requests)) {
      expect(request.authorization, request.path).toContain(MOCK_TOKEN);
      expect(request.apiVersion, request.path).toBe(apiVersion);
      expect(['GET', 'POST'], request.path).toContain(request.method);
      if (request.method === 'POST') expect(request.path).toBe('/api/graphql');
    }
    for (const request of requests.filter((item) => item.path.startsWith('/downloads/'))) {
      expect(request.authorization, request.path).toBeUndefined();
    }
  }

  function expectPrivateFieldsLeftOut(bundle: Bundle) {
    expect(bundle.text).not.toMatch(/private/i);
    for (const field of ['avatar_url', 'email', 'actor_location', 'user_agent', '_document_id', 'azure_subscription', 'alert_recipients']) {
      expect(bundle.text).not.toContain(`"${field}"`);
    }
  }

  /** The scripts work in a temporary folder and must remove it when they stop. */
  const leftoverWork = () => readdirSync(join(folder, 'temp')).filter((name) => name.startsWith('usage-lens.'));

  it('checks the options before it sends any request', async () => {
    for (const [args, message] of [
      [['--org', 'bad/name', '--yes'], 'is not valid'],
      [['--org', 'octo-org', '--months', '25', '--yes'], '--months needs a number'],
      [['--org', 'octo-org', '--only', 'nothing', '--yes'], 'Unknown source: nothing'],
      [['--yes'], 'Choose what to read'],
      [['--hostname', 'https://bad host', '--org', 'octo-org', '--yes'], 'is not valid'],
    ] as const) {
      const result = await run('bash', [...args]);
      expect(result.code, args.join(' ')).toBe(1);
      expect(result.errors, args.join(' ')).toContain(message);
    }
    expect((await run('bash', ['--version'])).output).toMatch(/^collect\.sh \d+\.\d+\.\d+/);
    expect((await run('bash', ['--list-sources'])).output).toContain('audit-log');
    expect((await run('bash', ['--help'])).output).toContain('--enterprise SLUG');
    expect(mock.requests).toHaveLength(0);
  });

  it('reads an enterprise and keeps only the fields the app needs', async () => {
    const file = join(folder, 'enterprise.ndjson');
    const result = await run('bash', enterpriseArgs(file));
    expect(result.errors).toBe('');
    expect(result.code, result.output).toBe(0);

    const bundle = readBundle(file);
    expect(bundle.header).toMatchObject({
      kind: 'header', format: 'github-copilot-usage-lens-data', version: 1, collector: 'collect.sh', host: MOCK_HOST,
      scope: 'enterprise', enterprise: 'octocorp', organizations: [], months: monthKeys(2), dailyMetrics: false,
      teams: true, apiVersion: '2026-03-10',
    });
    expect(bundle.header.sources).toContain('teams');
    expect(bundle.end).toMatchObject({ kind: 'end', records: bundle.records.length });
    expect(countByKind(bundle.records)).toEqual({
      organization: 2, seat: 3, 'seat-total': 1, member: 3, budget: 3, 'budget-user': 2, 'cost-center': 1,
      'ai-credit-usage': 2, 'usage-summary': 2, 'billing-usage': 2, 'user-metrics': 4, 'scope-metrics': 1,
      'user-teams': 2, 'audit-event': 4, team: 2, 'team-member': 2, 'seat-summary': 1,
    });
    expectPrivateFieldsLeftOut(bundle);

    const seat = bundle.records.find((line) => line.kind === 'seat' && (line.record.assignee as { login: string }).login === 'KofiIto_nwind');
    expect(seat).toMatchObject({
      scope: 'enterprise', target: 'octocorp',
      record: { assignee: { login: 'KofiIto_nwind', type: 'User' }, organization: { login: 'octo-org' }, assigning_team: { slug: 'platform', name: 'Platform' }, plan_type: 'enterprise' },
    });
    expect(bundle.records.find((line) => line.kind === 'seat-total')?.record).toEqual({ total_seats: 3 });
    expect(bundle.records.filter((line) => line.kind === 'member').map((line) => line.record.login)).toEqual(['KofiIto_nwind', 'MeiChen_nwind', 'NoSeat_nwind']);
    expect(bundle.records.find((line) => line.record.id === 'budget-1')?.record).toMatchObject({
      budget_amount: 500, consumed_amount: 312.5, budget_alerting: { will_alert: true, recipients: 2 },
    });
    expect(bundle.records.filter((line) => line.kind === 'budget-user').map((line) => [line.parent, line.record.user])).toEqual([
      ['budget-2', 'KofiIto_nwind'], ['budget-2', 'MeiChen_nwind'],
    ]);
    for (const kind of ['ai-credit-usage', 'usage-summary', 'billing-usage']) {
      const lines = bundle.records.filter((line) => line.kind === kind);
      expect(lines.map((line) => line.month), kind).toEqual(monthKeys(2));
      expect(lines.every((line) => line.record.product === 'Copilot'), kind).toBe(true);
    }
    const aggregate = bundle.records.find((line) => line.kind === 'scope-metrics');
    expect(aggregate?.record).toMatchObject({ report_start_day: mock.reportFirstDay, daily_active_users: 2 });
    expect(bundle.records.filter((line) => line.kind === 'team-member').map((line) => [line.scope, line.target, line.parent])).toEqual([
      ['enterprise', 'octocorp', 'ent:platform'], ['organization', 'octo-org', 'devs'],
    ]);
    const audit = bundle.records.filter((line) => line.kind === 'audit-event').map((line) => line.record);
    expect(audit.map((event) => event.action)).toEqual([
      'copilot.cfb_seat_assignment_created', 'copilot.plan_changed', 'copilot.cfb_seat_cancelled', 'billing.budget_update',
    ]);
    expect(audit[0]).toMatchObject({ seat_assignment: 'team', team: 'octo-labs/devs', user: 'SaraLind_nwind' });
    expect(audit[1]).toMatchObject({ plan: 'enterprise', old_plan: 'business' });
    expect(audit[3]).toMatchObject({ target_amount: 500 });

    // The billing summary failed once with 502 and worked when tried again.
    expect(requestsTo(mock.requests, '/settings/billing/usage/summary')).toHaveLength(3);
    expect(sourcesOf(bundle, 'usage-summary').map((line) => line.status)).toEqual(['ok', 'ok']);
    expect(sourcesOf(bundle, 'seat-summary').map((line) => [line.target, line.status, line.http])).toEqual([
      ['octo-org', 'ok', 200], ['octo-labs', 'failed', 403],
    ]);
    expect(sourcesOf(bundle, 'teams').filter((line) => line.status === 'failed').map((line) => line.target)).toEqual(['octo-labs']);
    expect(bundle.sources.filter((line) => line.status === 'skipped')).toEqual([]);

    const windowStart = `${monthKeys(2)[0]}-01`;
    const auditRequests = requestsTo(mock.requests, '/enterprises/octocorp/audit-log');
    expect(auditRequests.map((request) => [request.query.get('phrase'), request.query.get('after')])).toEqual([
      [`action:copilot created:>=${windowStart}`, null],
      [`action:copilot created:>=${windowStart}`, 'cursor-2'],
      [`action:billing created:>=${windowStart}`, null],
    ]);
    expectSafeRequests(mock.requests, '2026-03-10');
    expect(result.output).toContain('Saved:');
    expect(result.output).toMatch(/seat-summary\s+partly/);
    expect(requestsTo(mock.requests, '/downloads/signed/users-28-day.ndjson.gz')).toHaveLength(1);
    expect(requestsTo(mock.requests, '/downloads/users-28-day.ndjson.gz')).toHaveLength(1);
    expect(leftoverWork()).toEqual([]);

    // The app reads the file the script wrote.
    const collection = await readCollection(new Blob([readFileSync(file)]), 'enterprise.ndjson');
    expect(collection).toMatchObject({ complete: true, skippedLines: 0, records: bundle.records.length, capped: false });
    expect(collection.header).toMatchObject({ scope: 'enterprise', enterprise: 'octocorp', months: monthKeys(2) });
    expect(collection.budgets.map((budget) => [budget.id, budget.scope, budget.aiCredits, budget.stopsUsage, budget.willAlert])).toEqual([
      ['budget-1', 'enterprise', true, true, true], ['budget-2', 'multi_user_customer', true, true, false], ['budget-3', 'organization', true, false, true],
    ]);
    expect(pickBudget(collection)?.id).toBe('budget-1');
    expect(collection.budgetUsers.map((state) => [state.budgetId, state.login, state.consumed, state.limit])).toEqual([
      ['budget-2', 'KofiIto_nwind', 19.5, 20], ['budget-2', 'MeiChen_nwind', 4, 20],
    ]);
    expect(collection.aiCredits).toEqual(monthKeys(2).map((month) => ({ month, target: 'octocorp', gross: 120, discount: 90, net: 30, quantity: 12000 })));
    expect(collection.seatCharges).toEqual(monthKeys(2).map((month) => ({ month, target: 'octocorp', gross: 38, discount: 0, net: 38, quantity: 2 })));
    expect(collection.seatSummaries.map((summary) => [summary.org, summary.total, summary.management])).toEqual([['octo-org', 2, 'assign_selected']]);
    expect(collection.members).toEqual(['kofiito_nwind', 'meichen_nwind', 'noseat_nwind']);
    expect(collection.metrics?.users.map((user) => [user.login, user.days, user.chatDays, user.completionDays])).toEqual([
      ['KofiIto_nwind', 2, 2, 2], ['MeiChen_nwind', 2, 2, 2],
    ]);
    expect(collection.audit.map((event) => event.kind)).toEqual(['seat-added', 'plan', 'seat-removed', 'budget']);
    const seats = collectionLicenseParse(collection).seats;
    expect(seats.map((entry) => [entry.login, entry.plan, entry.orgs])).toEqual([
      ['KofiIto_nwind', 'Enterprise', ['octo-org']], ['MeiChen_nwind', 'Business', ['octo-org']], ['SaraLind_nwind', 'Business', ['octo-labs']],
    ]);
    expect(seats[0].teams).toEqual(['platform']);
    expect(seats[1].teams.length).toBeGreaterThan(0);
  }, RUN_TIMEOUT);

  it('reads an organization with the activity of every day', async () => {
    const file = join(folder, 'organization.ndjson.gz');
    const result = await run('bash', organizationArgs(file));
    expect(result.errors).toBe('');
    expect(result.code, result.output).toBe(0);
    expect(readFileSync(file).subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));

    const bundle = readBundle(file);
    expect(bundle.header).toMatchObject({
      scope: 'organization', enterprise: null, organizations: ['octo-org'], months: monthKeys(3), dailyMetrics: true, teams: false,
    });
    expect(bundle.header.sources).not.toContain('teams');
    expect(countByKind(bundle.records)).toEqual({
      'seat-summary': 1, seat: 2, 'seat-total': 1, member: 3, 'ai-credit-usage': 3, 'usage-summary': 3,
      'user-metrics': 9, 'user-teams': 2, 'audit-event': 4,
    });
    expect(bundle.end).toMatchObject({ records: 28 });
    expectPrivateFieldsLeftOut(bundle);

    expect(bundle.sources.filter((line) => line.status === 'skipped' && !line.endpoint).map((line) => [line.id, line.message])).toEqual([
      ['organizations', 'Only for enterprises.'],
      ['teams', 'Not selected. Add --teams to read team members.'],
      ['cost-centers', 'Only for enterprises.'],
    ]);
    expect(sourcesOf(bundle, 'budgets').map((line) => [line.status, line.http])).toEqual([['failed', 404]]);
    // Daily charges need access the token does not have, so the script stops after the first month.
    expect(sourcesOf(bundle, 'billing-usage').map((line) => [line.status, line.http])).toEqual([['failed', 403]]);
    expect(requestsTo(mock.requests, '/organizations/octo-org/settings/billing/usage')).toHaveLength(1);

    // Daily reports go from new to old and stop after three days in a row without a report.
    const dailyDays = requestsTo(mock.requests, '/copilot/metrics/reports/users-1-day').map((request) => request.query.get('day'));
    expect(dailyDays).toEqual([29, 30, 31, 32, 33, 34, 35, 36].map(dayBefore));
    expect(sourcesOf(bundle, 'user-metrics').map((line) => line.status)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'skipped', 'skipped', 'skipped']);
    expect(sourcesOf(bundle, 'user-metrics')[8].message).toBe('No report for this day.');
    // The 28-day totals came back empty (204), so the daily totals start yesterday.
    const totalDays = requestsTo(mock.requests, '/copilot/metrics/reports/organization-1-day').map((request) => request.query.get('day'));
    expect(totalDays).toEqual([1, 2, 3].map(dayBefore));
    expect(sourcesOf(bundle, 'scope-metrics')[0]).toMatchObject({ status: 'ok', records: 0 });
    expect(requestsTo(mock.requests, '/user-teams-1-day').map((request) => request.query.get('day'))).toEqual([mock.reportLastDay]);
    const days = bundle.records.filter((line) => line.kind === 'user-metrics').map((line) => line.record.day);
    expect(new Set(days)).toEqual(new Set([mock.reportFirstDay, mock.reportLastDay, ...[29, 30, 31, 32, 33].map(dayBefore)]));

    expectSafeRequests(mock.requests, '2026-03-10');
    expect(result.output).toMatch(/user-metrics\s+ok\s+9/);
    expect(result.output).toMatch(/billing-usage\s+failed/);
  }, RUN_TIMEOUT);

  it('saves no file when nothing can be read', async () => {
    const outputFolder = join(folder, 'nothing');
    mkdirSync(outputFolder);
    const result = await run('bash', ['--org', 'octo-labs', '--only', 'seat-summary', '--yes', '--hostname', MOCK_HOST, '--output', outputFolder]);
    expect(result.code).toBe(1);
    expect(result.output).toContain('No data could be read, so no file was saved.');
    expect(readdirSync(outputFolder)).toEqual([]);
    expect(leftoverWork()).toEqual([]);
  }, RUN_TIMEOUT);

  it('leaves out the API version when GitHub does not know it', async () => {
    mock.settings.rejectApiVersion = true;
    const file = join(folder, 'no-version.ndjson');
    const result = await run('bash', ['--org', 'octo-org', '--only', 'seat-summary', '--plain', '--yes', '--hostname', MOCK_HOST, '--output', file]);
    expect(result.code, result.output + result.errors).toBe(0);
    expect(readBundle(file).header.apiVersion).toBeNull();
    const [first, ...rest] = apiRequests(mock.requests);
    expect(first).toMatchObject({ path: '/api/v3/user', apiVersion: '2026-03-10' });
    expect(rest.length).toBeGreaterThan(0);
    expect(rest.every((request) => request.apiVersion === GH_DEFAULT_API_VERSION)).toBe(true);
  }, RUN_TIMEOUT);

  describe.skipIf(!HAS_POWERSHELL)('PowerShell', () => {
    it('writes the same data as bash', async () => {
      for (const [name, args] of [
        ['enterprise', enterpriseArgs],
        ['organization', organizationArgs],
      ] as const) {
        const bashFile = join(folder, `bash-${name}.ndjson.gz`);
        const powershellFile = join(folder, `powershell-${name}.ndjson.gz`);
        const bashArgs = args(bashFile);
        expect(bashArgs.every((arg) => !arg.startsWith('--') || arg in POWERSHELL_NAMES)).toBe(true);
        mock.reset();
        const bashResult = await run('bash', bashArgs);
        expect(bashResult.code, bashResult.output).toBe(0);
        const bashRequests = mock.requests.map((request) => `${request.method} ${request.path}?${request.query}`);
        mock.reset();
        const powershellResult = await run('powershell', powershellArgs(args(powershellFile)));
        expect(powershellResult.errors, name).toBe('');
        expect(powershellResult.code, powershellResult.output).toBe(0);
        const powershellRequests = mock.requests.map((request) => `${request.method} ${request.path}?${request.query}`);
        expect(powershellRequests, name).toEqual(bashRequests);
        expectSafeRequests(mock.requests, '2026-03-10');

        const bashBundle = readBundle(bashFile);
        const powershellBundle = readBundle(powershellFile);
        expect(comparable(powershellBundle), name).toEqual(comparable(bashBundle));
        const { collector: powershellCollector, startedAt: _powershellStart, ...powershellHeader } = powershellBundle.header;
        const { collector: bashCollector, startedAt: _bashStart, ...bashHeader } = bashBundle.header;
        expect([bashCollector, powershellCollector]).toEqual(['collect.sh', 'collect.ps1']);
        expect(powershellHeader, name).toEqual(bashHeader);
        expect(leftoverWork(), name).toEqual([]);
      }
    }, RUN_TIMEOUT * 2);

    it('downloads the report files without curl', async () => {
      const programs = join(folder, 'programs-without-curl');
      mkdirSync(programs, { recursive: true });
      for (const name of ['gh', 'pwsh']) {
        if (!existsSync(join(programs, name))) symlinkSync(findProgram(name), join(programs, name));
      }
      const bashFile = join(folder, 'bash-download.ndjson.gz');
      const powershellFile = join(folder, 'powershell-download.ndjson.gz');
      mock.reset();
      expect((await run('bash', organizationArgs(bashFile))).code).toBe(0);
      mock.reset();
      const result = await run('powershell', powershellArgs(organizationArgs(powershellFile)), { PATH: programs });
      expect(result.errors).toBe('');
      expect(result.code, result.output).toBe(0);
      expect(requestsTo(mock.requests, '/downloads/users-28-day.ndjson.gz')).toHaveLength(1);
      expectSafeRequests(mock.requests, '2026-03-10');
      expect(comparable(readBundle(powershellFile))).toEqual(comparable(readBundle(bashFile)));
      expect(leftoverWork()).toEqual([]);
    }, RUN_TIMEOUT);

    it('saves no file when nothing can be read', async () => {
      const outputFolder = join(folder, 'powershell-nothing');
      mkdirSync(outputFolder);
      const result = await run('powershell', ['-Org', 'octo-labs', '-Only', 'seat-summary', '-Yes', '-Hostname', MOCK_HOST, '-Output', outputFolder]);
      expect(result.errors).toBe('');
      expect(result.code).toBe(1);
      expect(result.output).toContain('No data could be read, so no file was saved.');
      expect(readdirSync(outputFolder)).toEqual([]);
      expect(leftoverWork()).toEqual([]);
    }, RUN_TIMEOUT);

    it('checks the options before it sends any request', async () => {
      for (const [args, message] of [
        [['-Org', 'bad/name', '-Yes'], 'is not valid'],
        [['-Org', 'octo-org', '-Months', '25', '-Yes'], 'Months needs a number'],
        [['-Org', 'octo-org', '-Only', 'nothing', '-Yes'], 'Unknown source: nothing'],
        [['-Yes'], 'Choose what to read'],
      ] as const) {
        const result = await run('powershell', [...args]);
        expect(result.code, args.join(' ')).toBe(1);
        expect(result.output + result.errors, args.join(' ')).toContain(message);
      }
      expect((await run('powershell', ['-Version'])).output).toMatch(/^collect\.ps1 \d+\.\d+\.\d+/);
      expect(mock.requests).toHaveLength(0);
    }, RUN_TIMEOUT);
  });
});
