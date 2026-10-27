/** Header names and field aliases of license exports. Usage reports are told apart by their own columns. */

export type SeatField =
  | 'login'
  | 'name'
  | 'email'
  | 'plan'
  | 'org'
  | 'team'
  | 'created'
  | 'activity'
  | 'authenticated'
  | 'surface'
  | 'cancellation'
  | 'reportTime';

/** Lower case, with every run of other characters turned into an underscore (the same rule the usage CSV reader uses). */
export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Normalized column names that mean each field. The first name present in a file wins. */
export const FIELD_ALIASES: Record<SeatField, readonly string[]> = {
  login: [
    'login',
    'username',
    'user_name',
    'user',
    'github_login',
    'github_username',
    'handle',
    'assignee_login',
    'assignee',
    'account',
    'member',
    'user_login',
    'logins',
    'usernames',
    'users',
  ],
  name: ['name', 'full_name', 'display_name', 'assignee_name'],
  email: ['email', 'e_mail', 'email_address', 'assignee_email'],
  plan: ['plan_type', 'plan', 'seat_type', 'seat_plan', 'license', 'licence', 'copilot_plan', 'copilot_license'],
  org: ['organization', 'org', 'org_login', 'organization_login'],
  team: ['assigning_team', 'team', 'team_slug', 'assigning_team_slug'],
  created: ['created_at', 'created', 'assigned_at', 'seat_created_at', 'added_at', 'date_assigned'],
  activity: ['last_activity_at', 'last_activity', 'last_active', 'last_activity_date', 'last_used'],
  authenticated: ['last_authenticated_at', 'last_authentication', 'last_signed_in', 'last_sign_in', 'last_login_at'],
  surface: ['last_surface_used', 'last_activity_editor', 'last_surface', 'editor', 'surface'],
  cancellation: ['pending_cancellation_date', 'pending_cancellation', 'cancellation_date'],
  reportTime: ['report_time', 'reported_at', 'report_date', 'as_of', 'exported_at', 'export_date'],
};

export const SEAT_FIELDS = Object.keys(FIELD_ALIASES) as SeatField[];

/** The column index of each field, or undefined when the header has no column for it. */
export type ColumnMap = Partial<Record<SeatField, number>>;

export function mapColumns(names: readonly string[]): ColumnMap {
  const map: ColumnMap = {};
  for (const field of SEAT_FIELDS) {
    for (const alias of FIELD_ALIASES[field]) {
      const columnIndex = names.indexOf(alias);
      if (columnIndex !== -1) {
        map[field] = columnIndex;
        break;
      }
    }
  }
  return map;
}

const DATE_COLUMNS = ['date', 'usage_date', 'day', 'usagedate'];

/** Columns that only a usage report has (they mirror the synonyms of the usage CSV reader). */
const USAGE_COLUMNS = new Set([
  'gross_amount',
  'gross',
  'net_amount',
  'net',
  'discount_amount',
  'discount',
  'quantity',
  'qty',
  'ai_credits',
  'credits',
  'aic_quantity',
  'aic_gross_amount',
  'applied_cost_per_quantity',
  'price_per_unit',
  'unit_price',
  'cost_per_quantity',
  'unit_type',
  'unit',
  'total_monthly_quota',
  'monthly_quota',
  'quota',
  'model',
  'model_name',
  'sku',
  'product',
  'cost_center_name',
  'cost_center',
  'costcenter',
  'app_client_id',
  'repository',
  'repository_name',
  'input_tokens',
  'output_tokens',
  'cache_read',
  'cache_write',
  'cache_read_tokens',
  'cache_write_tokens',
]);

export const hasLoginColumn = (names: readonly string[]): boolean => FIELD_ALIASES.login.some((alias) => names.includes(alias));

/** The header has a column only a usage report has. */
export const hasUsageColumn = (names: readonly string[]): boolean => names.some((name) => USAGE_COLUMNS.has(name));

export const hasDateColumn = (names: readonly string[]): boolean => names.some((name) => DATE_COLUMNS.includes(name));

/**
 * Whether a header belongs to a usage report, or looks enough like one that it must not be read as a license list:
 * it has a usage-only column, or a date column next to a login column.
 */
export function isUsageHeader(names: readonly string[]): boolean {
  return hasUsageColumn(names) || (hasDateColumn(names) && hasLoginColumn(names));
}
