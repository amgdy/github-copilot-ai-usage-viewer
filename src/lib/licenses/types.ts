/** Where a seat record came from. It helps distinguish a missing activity date from a file with no activity data. */
export type SeatSource = 'api' | 'activity' | 'list';

/** One licensed GitHub Copilot user, read from an export. Dates are UTC calendar days (YYYY-MM-DD). */
export interface LicenseSeat {
  /** The login as written in the file. Matching ignores case and surrounding spaces. */
  login: string;
  name?: string;
  email?: string;
  /** 'Business' or 'Enterprise' (the plan names the app uses), or a credits value. Unset when the file does not say. */
  plan?: string;
  /** Organizations that hold the seat. An enterprise user can appear once per organization or team. */
  orgs: string[];
  teams: string[];
  createdAt?: string;
  lastActivityAt?: string;
  lastAuthenticatedAt?: string;
  /** The editor or surface of the last activity, for example "vscode". */
  lastSurface?: string;
  /** The day the seat ends, when GitHub has scheduled its removal. */
  pendingCancellation?: string;
  source: SeatSource;
}

export type LicenseKind = 'seats-json' | 'activity-csv' | 'seats-csv' | 'login-list' | 'unknown';

export interface LicenseParse {
  kind: LicenseKind;
  /** Seats merged by login, in the order they first appear. */
  seats: LicenseSeat[];
  /** Valid records before merging (an enterprise user appears once per organization or team). */
  records: number;
  /** The `total_seats` the API reported, when the file has it. The largest value when several pages are joined. */
  total?: number;
  /** Rows or records that had no usable login. */
  skipped: number;
  /** Plain-language notes for the person who loaded the file. */
  problems: string[];
  /** The day of the export: the report time, or else the latest date inside the file. */
  exportedAt?: string;
}
