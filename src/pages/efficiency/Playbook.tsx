import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge, CalcInfo, DocLinks, Section, Segmented } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { LEVER_META, type LeverStep } from '../../lib/analytics/levers';
import { PLAYBOOK, type PlaybookItem } from '../../lib/analytics/tips';
import { LINKS, TOPIC_LINKS, type LinkId, type LinkTopic } from '../../lib/links';
import { fmtInt } from '../../lib/utils/format';
import { useAnalysis } from '../../state/analysis';
import { usePerMonth } from '../shared';
import { LEVER_DOC, money } from './metrics';

type Audience = 'all' | PlaybookItem['audience'];

const OPTIONS: { value: Audience; label: string; title: string }[] = [
  { value: 'all', label: msg('All'), title: msg('Habits for users and for admins') },
  { value: 'user', label: msg('For users'), title: msg('Habits every GitHub Copilot user can apply') },
  { value: 'admin', label: msg('For admins'), title: msg('Controls for the people who manage GitHub Copilot') },
];

/** Reading list for each habit; habits not listed fall back to their lever, then to general habits. */
const ITEM_TOPIC: Record<string, LinkTopic> = {
  'right-model': 'modelChoice',
  auto: 'auto',
  reasoning: 'modelChoice',
  subagents: 'agents',
  prompts: 'instructions',
  context: 'context',
  cache: 'caching',
  'long-context': 'context',
  phases: 'modelChoice',
  'session-limits': 'agents',
  chronicle: 'habits',
  budgets: 'budgets',
  seats: 'seats',
};

const LEVER_TOPIC: Record<LeverStep['id'], LinkTopic> = {
  modelShift: 'modelChoice',
  autoAdoption: 'auto',
  cacheDiscipline: 'caching',
  contextHygiene: 'context',
  longContext: 'context',
  capRunaway: 'budgets',
};

const topicOf = (item: PlaybookItem): LinkTopic => ITEM_TOPIC[item.id] ?? (item.lever ? LEVER_TOPIC[item.lever] : 'habits');

/** Links from the habit's reading list that the habit does not already link to. */
function extraLinks(item: PlaybookItem): LinkId[] {
  const own = new Set(item.docs.map((d) => d.url));
  const ids: readonly LinkId[] = TOPIC_LINKS[topicOf(item)];
  return ids.filter((id) => !own.has(LINKS[id].url)).slice(0, 2);
}

interface Entry {
  item: PlaybookItem;
  /** Standalone saving of the matching lever per month, or null when the habit has no lever. */
  saving: number | null;
  /** Other habits that share the same lever. */
  shared: number;
}

function PlaybookCard({ entry }: { entry: Entry }) {
  const { item, saving, shared } = entry;
  const lever = item.lever;
  const leverLabel = lever ? t(LEVER_META[lever].label) : '';
  const extra = extraLinks(item);
  return (
    <li className="card flex min-w-0 flex-col gap-2.5 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold">{t(item.title)}</h3>
        <Badge tone={item.audience === 'admin' ? 'info' : 'neutral'}>{item.audience === 'admin' ? t('For admins') : t('For users')}</Badge>
      </div>
      {lever && saving !== null ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {saving > 0 ? (
            <Badge tone="good" title={t('Saving of the "{lever}" lever on its own, from the usage in this report', { lever: leverLabel })}>
              {t('{amount} per month', { amount: money(saving) })}
            </Badge>
          ) : (
            <Badge title={t('The data in this report shows no saving for this lever')}>{t('No saving found')}</Badge>
          )}
          <CalcInfo id="playbook-saving" />
          <span className="text-fg-muted">
            {t('Lever "{lever}"', { lever: leverLabel })}
            <CalcInfo id={LEVER_DOC[lever]} className="ms-1" />
            {shared > 0
              ? tp(shared, ', shared with {n} other habit, so the amounts do not add up.', ', shared with {n} other habits, so the amounts do not add up.', { n: fmtInt(shared) })
              : '.'}
          </span>
        </div>
      ) : (
        <p className="text-xs text-fg-subtle">{t('The report cannot measure the effect of this habit.')}</p>
      )}
      <p className="text-sm text-fg-muted">{t(item.why)}</p>
      <details className="text-sm">
        <summary className="cursor-pointer select-none font-medium text-accent hover:underline">{t('What to do')}</summary>
        <ul className="mt-1.5 list-disc space-y-1 ps-5 text-fg-muted">
          {item.how.map((step) => (
            <li key={step}>{t(step)}</li>
          ))}
        </ul>
      </details>
      {item.docs.length || extra.length ? (
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
          {item.docs.map((d) => (
            <a key={d.url} href={d.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
              <ExternalLink size={12} />
              {t(d.label)}
            </a>
          ))}
          <DocLinks ids={extra} compact />
        </div>
      ) : null}
    </li>
  );
}

export function Playbook() {
  const { analysis } = useAnalysis();
  const perMonth = usePerMonth();
  const [audience, setAudience] = useState<Audience>('all');

  const entries = useMemo(() => {
    const standalone = new Map<LeverStep['id'], number>(analysis.plan.levers.steps.map((s) => [s.id, s.standalone * perMonth]));
    return PLAYBOOK.map((item, index): Entry & { index: number } => ({
      item,
      index,
      saving: item.lever ? (standalone.get(item.lever) ?? 0) : null,
      shared: item.lever ? PLAYBOOK.filter((o) => o.lever === item.lever).length - 1 : 0,
    })).sort((a, b) => (b.saving ?? -1) - (a.saving ?? -1) || a.index - b.index);
  }, [analysis.plan, perMonth]);

  const shown = entries.filter((e) => audience === 'all' || e.item.audience === audience);
  const options = OPTIONS.map((o) => ({ value: o.value, label: t(o.label), title: t(o.title) }));

  return (
    <Section
      title={t('Habits that save credits')}
      description={t("Practical habits from GitHub's guidance, with what the matching lever is worth in your data. Habits with a saving are listed first.")}
      actions={<Segmented size="sm" label={t('Audience')} value={audience} onChange={setAudience} options={options} />}
    >
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((e) => (
          <PlaybookCard key={e.item.id} entry={e} />
        ))}
      </ul>
    </Section>
  );
}
