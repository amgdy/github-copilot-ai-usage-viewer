import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card, EmptyState, SearchInput } from '../../components/ui';
import { t, tp } from '../../i18n';
import { fmtInt } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { GLOSSARY, GLOSSARY_GROUPS, type GlossaryEntry } from './glossary';
import { SettingsSection } from './SettingsSection';

interface Row extends GlossaryEntry {
  text: string;
  haystack: string;
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function Highlight({ text, pattern }: { text: string; pattern: RegExp | null }) {
  if (!pattern) return <>{text}</>;
  // The pattern has one capture group, so the matches sit at the odd positions.
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-sm bg-accent-soft px-0.5 text-fg">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Aliases that explain why a row matched when the term and the text do not show the search words. */
function matchedAliases(row: Row, words: string[]): string[] {
  if (words.length === 0) return [];
  const shown = `${row.term} ${row.text}`.toLowerCase();
  if (words.every((word) => shown.includes(word))) return [];
  return (row.aliases ?? []).filter((alias) => words.some((word) => alias.toLowerCase().includes(word)));
}

export function GlossarySection() {
  const settings = useApp((state) => state.settings);
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(
    () =>
      GLOSSARY.map((entry) => {
        const term = t(entry.term);
        const text = typeof entry.definition === 'function' ? entry.definition(settings) : t(entry.definition);
        // The English term stays searchable when the page is in another language.
        return { ...entry, term, text, haystack: `${term} ${entry.term} ${(entry.aliases ?? []).join(' ')} ${text}`.toLowerCase() };
      }),
    [settings],
  );

  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const pattern = useMemo(() => (words.length ? new RegExp(`(${[...words].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})`, 'gi') : null), [words]);

  const groups = useMemo(() => {
    const visible = rows.filter((row) => words.every((word) => row.haystack.includes(word)));
    return {
      count: visible.length,
      list: GLOSSARY_GROUPS.map((group) => ({ group, rows: visible.filter((row) => row.group === group) })).filter((section) => section.rows.length > 0),
    };
  }, [rows, words]);

  const terms = tp(rows.length, '{n} term', '{n} terms', { n: fmtInt(rows.length) });

  return (
    <SettingsSection id="glossary" description={t('Plain-language definitions of the terms used across the reports. Numbers in the text follow your current settings.')}>
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border-muted px-4 py-2.5">
          <SearchInput
            className="min-w-48 flex-1 basis-56"
            placeholder={t('Search terms, for example persona or cache')}
            aria-label={t('Search the glossary')}
            value={query}
            onChange={setQuery}
          />
          <span className="num text-xs text-fg-muted" aria-live="polite">
            {words.length ? t('{count} of {terms}', { count: fmtInt(groups.count), terms }) : terms}
          </span>
          <a className="btn btn-sm ms-auto" href="#/methodology" title={t('The formula, the columns used and the settings behind every number')}>
            <Calculator size={14} aria-hidden />
            {t('Formulas for every number')}
          </a>
        </div>
        {groups.list.length === 0 ? (
          <EmptyState
            title={t('No term matches the search')}
            description={t('Try a shorter word, or clear the search to see every term.')}
            action={
              <button type="button" className="btn btn-sm" onClick={() => setQuery('')}>
                {t('Clear search')}
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-border-muted">
            {groups.list.map(({ group, rows: items }) => (
              <div key={group}>
                <h3 className="eyebrow border-b border-border-muted bg-surface-2 px-4 py-1.5">{t(group)}</h3>
                <dl className="divide-y divide-border-muted">
                  {items.map((row) => {
                    const aliases = matchedAliases(row, words);
                    return (
                      <div key={row.id} className="grid gap-x-6 gap-y-1 px-4 py-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
                        <dt className="text-sm font-medium">
                          <Highlight text={row.term} pattern={pattern} />
                          {aliases.length ? <div className="mt-0.5 text-xs font-normal text-fg-subtle">{t('Also called {aliases}', { aliases: aliases.join(t(', ')) })}</div> : null}
                        </dt>
                        <dd className="text-sm text-fg-muted">
                          <Highlight text={row.text} pattern={pattern} />
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        )}
      </Card>
    </SettingsSection>
  );
}
