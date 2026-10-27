import { msg } from '../../i18n/core.ts';
import type { Settings } from '../analytics/settings';
import type { LinkId } from '../links';

/**
 * How a number comes to be:
 * - `reported`: summed straight from a column of the file.
 * - `calculated`: a fixed rule applied to numbers in the file. The same file always gives the same result.
 * - `estimated`: relies on an assumption, the price card or a setting, so it is a close guide and not an invoice figure.
 */
export type MetricBasis = 'reported' | 'calculated' | 'estimated';

/** English text; show it through t(). */
export const BASIS_LABEL: Record<MetricBasis, string> = {
  reported: msg('Read from the file'),
  calculated: msg('Calculated from the file'),
  estimated: msg('Estimate'),
};

export const BASIS_HELP: Record<MetricBasis, string> = {
  reported: msg('Summed straight from a column of the report.'),
  calculated: msg('A fixed rule applied to numbers in the report. The same file always gives the same result.'),
  estimated: msg('Relies on an assumption, the price card or a setting. Treat it as a close guide, not as an invoice figure.'),
};

/** The sections of the Methodology page, in reading order. English names; show them through t(). */
export const METRIC_AREAS = [
  msg('Money and credits'),
  msg('Tokens and cost split'),
  msg('Auto model selection'),
  msg('Users and rankings'),
  msg('Segments and classes'),
  msg('Models'),
  msg('Efficiency and savings'),
  msg('Seats and licenses'),
  msg('Organization and cost centers'),
  msg('Patterns and trends'),
  msg('Recommendations'),
  msg('Data and quality'),
] as const;

export type MetricArea = (typeof METRIC_AREAS)[number];

/** A setting that changes the number. The live value is shown next to the explanation. */
export type SettingRef = keyof Settings;

/**
 * The explanation of one number in the report.
 *
 * Write it for a manager who has never seen the CSV: plain words, the report's own names, no jargon.
 * Every statement has to match what the code does. When the code changes, change the text.
 */
export interface MetricDoc {
  /** Lower-case words joined by dashes, unique across all docs. Pages refer to it as `calc="..."`. */
  id: string;
  /** The name of the number, as a reader sees it on the page. */
  title: string;
  area: MetricArea;
  basis: MetricBasis;
  /** What the number tells you, in one or two sentences. */
  meaning: string;
  /** The calculation in one line, with the names a reader sees on the page. */
  formula: string;
  /** The same calculation in steps, when one line is not enough. */
  steps?: string[];
  /** Columns of the CSV that the number is built from. */
  columns?: string[];
  /** Settings that change the number. */
  settings?: SettingRef[];
  /** Limits, edge cases and what the number does not tell you. */
  notes?: string[];
  /** A worked example with small round numbers. */
  example?: string;
  /** Ids of docs that explain a part of this one, or a number that is easy to confuse with it. */
  related?: string[];
  /** Official GitHub or Microsoft pages that help a reader act on this number, most useful first (ids from lib/links). */
  links?: LinkId[];
}
