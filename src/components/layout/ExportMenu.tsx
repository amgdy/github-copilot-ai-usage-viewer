import { useState, type ReactNode } from 'react';
import { Check, ClipboardCopy, Download, FileText, Lightbulb, Printer, Users } from 'lucide-react';
import { t } from '../../i18n';
import { userActionRows } from '../../lib/analytics/tips';
import { buildSummaryMarkdown } from '../../lib/export/summary';
import { isoDate } from '../../lib/utils/date';
import { downloadCsv, downloadText } from '../../lib/utils/download';
import { sortRecs } from '../../pages/recommendations/recFilters';
import { useAnalysis } from '../../state/analysis';
import { chipText, describeFilters } from '../../state/filterChips';
import { printReport } from '../../state/print';
import { datasetLabel, useApp } from '../../state/store';
import { Popover } from '../ui';

function Item({ icon, title, hint, onClick }: { icon: ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-start hover:bg-surface-3">
      <span className="mt-0.5 text-fg-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-fg-muted">{hint}</span>
      </span>
    </button>
  );
}

/**
 * Downloads of what is currently on screen: summary, user action list, recommendations, print.
 * The files keep English column names, so they work the same in spreadsheets and scripts in any language.
 */
export function ExportMenu() {
  const { analysis, settings, taxonomy, dataset, store } = useAnalysis();
  const filters = useApp((s) => s.filters);
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);
  const stamp = `${isoDate(analysis.range.start)}_${isoDate(analysis.range.end)}`;
  const summary = () =>
    buildSummaryMarkdown({ analysis, settings, taxonomy, label: datasetLabel(dataset), filters: describeFilters(filters, store, taxonomy).map(chipText) });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
    setTimeout(() => setCopied(null), 2200);
  };

  // Most valuable first, like the Recommendations page sorted by value.
  const recs = () => {
    const sorted = sortRecs(analysis.recs, 'value');
    downloadCsv(
      `github-copilot-recommendations_${stamp}`,
      ['Rank', 'Severity', 'Theme', 'Title', 'Summary', 'Impact per month (USD)', 'Impact measures', 'Cash saving per month (USD)', 'Cash saving is a lower bound (filtered view)', 'Confidence', 'Audience', 'Affected users', 'Actions'],
      sorted.map((r, i) => [i + 1, r.severity, r.theme, r.title, r.summary, Math.round(r.impactUsd * 100) / 100, r.impactKind === 'seats' ? 'seat value' : 'usage avoided', Math.round(r.cashUsd * 100) / 100, r.cashLowerBound ? 'yes' : 'no', r.confidence, r.audience.join(', '), r.affectedCount, r.actions.join(' | ')]),
    );
  };

  const users = () => {
    const { headers, rows } = userActionRows(analysis.users, settings);
    downloadCsv(`github-copilot-user-actions_${stamp}`, headers, rows);
  };

  return (
    <Popover
      trigger={(_open, toggle) => (
        <button type="button" className="btn" onClick={toggle} title={t('Download or print what you see now')} aria-label={t('Export')}>
          <Download size={15} />
          <span className="hidden md:inline">{t('Export')}</span>
        </button>
      )}
      className="w-80"
    >
      {(close) => (
        <div>
          <Item
            icon={<FileText size={16} />}
            title={t('Summary for managers (Markdown)')}
            hint={t('Main message, key numbers, user groups and recommendations for what you see now.')}
            onClick={() => {
              downloadText(`github-copilot-usage-summary_${stamp}.md`, summary(), 'text/markdown;charset=utf-8');
              close();
            }}
          />
          <Item
            icon={copied === 'ok' ? <Check size={16} className="text-good" /> : <ClipboardCopy size={16} />}
            title={copied === 'ok' ? t('Copied') : copied === 'fail' ? t('Could not copy. Use the download instead.') : t('Copy the summary')}
            hint={t('Paste the summary into an email, a wiki page or a chat.')}
            onClick={copy}
          />
          <Item icon={<Lightbulb size={16} />} title={t('Recommendations (CSV)')} hint={t('Actions with their value, most valuable first.')} onClick={() => { recs(); close(); }} />
          <Item icon={<Users size={16} />} title={t('Next step for each user (CSV)')} hint={t('Every user with their group, usage and suggested next step.')} onClick={() => { users(); close(); }} />
          <Item icon={<Printer size={16} />} title={t('Print or save as PDF')} hint={t('Prints this page in light colors, without the menus.')} onClick={() => { close(); printReport(); }} />
        </div>
      )}
    </Popover>
  );
}
