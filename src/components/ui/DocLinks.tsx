import { ExternalLink } from 'lucide-react';
import { Glyph } from '../icons';
import { LINKS, TOPIC_LINKS, type DocLink, type LinkId, type LinkTopic } from '../../lib/links';
import { t } from '../../i18n';
import { cx } from './cx';

/** Microsoft Learn pages get the Microsoft logo, every other source the GitHub logo. */
const sourceGlyph = (link: DocLink) => (link.source === 'Microsoft Learn' ? 'microsoft' : 'github');

export interface DocLinksProps {
  /** Link ids from lib/links, most useful first. */
  ids?: readonly LinkId[];
  /** A reading list from lib/links. Used when `ids` is not given. */
  topic?: LinkTopic;
  /** Heading above the list. Leave it out to show only the links. Pass translated text. */
  title?: string;
  /** Show at most this many links. */
  limit?: number;
  /** One line per link without the source name, for tight spaces such as cards. */
  compact?: boolean;
  className?: string;
}

/** A short list of official GitHub and Microsoft pages that help the reader act on what they see. */
export function DocLinks({ ids, topic, title, limit, compact, className }: DocLinksProps) {
  const all: readonly LinkId[] = ids ?? (topic ? TOPIC_LINKS[topic] : []);
  const list = (limit ? all.slice(0, limit) : all).map((id) => ({ id, link: LINKS[id] }));
  if (list.length === 0) return null;
  return (
    <div className={cx('text-xs', className)}>
      {title ? <div className="eyebrow mb-1">{title}</div> : null}
      <ul className={compact ? 'flex flex-wrap gap-x-3 gap-y-1' : 'space-y-1'}>
        {list.map(({ id, link }) => (
          <li key={id} className="min-w-0">
            <a className="inline-flex items-start gap-1.5 text-accent hover:underline" href={link.url} target="_blank" rel="noreferrer">
              <Glyph glyph={sourceGlyph(link)} size={12} className="mt-0.5 shrink-0 text-fg-muted" />
              <span className="wrap-anywhere">{t(link.label)}</span>
              <ExternalLink size={10} className="mt-1 shrink-0 opacity-60" aria-label={t('Opens in a new tab')} />
            </a>
            {compact ? null : <span className="text-fg-subtle"> · {t(link.source)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
