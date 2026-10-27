import { ArrowRight } from 'lucide-react';
import { FeatureIcon } from '../../components/icons';
import { Badge, CalcInfo, DocLinks, EmptyState, ProgressBar, cx } from '../../components/ui';
import { t } from '../../i18n';
import { fmtPct, fmtUSD, pluralize } from '../../lib/utils/format';
import { useApp } from '../../state/store';
import { showGroup } from './actions';
import { groupLinks, isAutoGroup } from './groupLinks';
import { byImpact, type GroupRow, type Lens, type LensData } from './lenses';

const money = (amount: number): string => (Number.isFinite(amount) ? fmtUSD(amount, 0) : '–');

function Meter({ label, value, tone }: { label: string; value: number; tone: 'info' | 'accent' }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 truncate text-fg-muted">{label}</span>
      <ProgressBar value={value} tone={tone} label={`${label}: ${fmtPct(value, 0)}`} className="flex-1" />
      <span className="num w-10 shrink-0 text-end font-medium">{fmtPct(value, 0)}</span>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-fg-muted">{label}</dt>
      <dd className="num truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}

function Text({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-fg-muted">{label}</div>
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function GroupCard({ row, lens }: { row: GroupRow; lens: Lens }) {
  const { item } = row;
  const empty = row.users === 0;
  const links = groupLinks(lens.id, row.id);
  return (
    <article
      style={{ borderInlineStartColor: item.color }}
      className={cx('card flex min-w-0 flex-col gap-3 border-s-4 p-4', row.active && 'ring-2 ring-accent/60', empty && 'opacity-60')}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className="size-2.5 shrink-0 rounded-xs" style={{ background: item.color }} aria-hidden />
            <span className="min-w-0">{item.label}</span>
            {isAutoGroup(lens.id, row.id) ? <FeatureIcon feature="auto" size={14} className="shrink-0 text-fg-muted" /> : null}
          </h3>
          <p className="num mt-0.5 text-xs text-fg-muted">
            {empty ? pluralize(row.users, 'user') : t('{users}, {share} of usage', { users: pluralize(row.users, 'user'), share: fmtPct(row.usageShare, 0) })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {row.active ? (
            <Badge tone="accent" title={t('This group is selected in the filters')}>
              {t('In filter')}
            </Badge>
          ) : null}
          {empty ? null : <CalcInfo id={['group-user-share', 'group-usage-share', 'usage', 'group-per-user-month', 'group-potential-savings']} />}
        </div>
      </header>

      {empty ? (
        <p className="text-xs text-fg-subtle">{row.unavailable ?? t('No user has this label in the data in view.')}</p>
      ) : (
        <>
          <div className="space-y-1.5">
            <Meter label={t('Users')} value={row.userShare} tone="info" />
            <Meter label={t('Usage')} value={row.usageShare} tone="accent" />
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <Fact label={t('Usage')} value={money(row.gross)} />
            <Fact label={t('Per user, per month')} value={money(row.perUserMonth)} />
            <Fact label={t('Potential savings')} value={money(row.potential)} />
          </dl>
        </>
      )}

      <Text label={t('What it means')}>{item.description}</Text>
      <Text label={t('What to do')}>{item.action}</Text>
      {links.length > 0 ? <DocLinks ids={links} title={t('Learn more')} limit={2} compact /> : null}

      {row.top.length > 0 ? (
        <div>
          <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-fg-muted">
            {t('Heaviest users')}
            <CalcInfo id="group-heaviest-users" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {row.top.map((user) => (
              <button
                key={user.id}
                type="button"
                className="chip hover:border-accent/50 hover:bg-surface-3"
                title={t('Open {name}: {amount} of usage', { name: user.name, amount: money(user.gross) })}
                onClick={() => useApp.getState().selectUser(user.id)}
              >
                <span className="max-w-36 truncate">{user.name}</span>
                <span className="num text-fg-muted">{money(user.gross)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button type="button" className="btn btn-sm mt-auto self-start" disabled={empty} onClick={() => showGroup(lens, row.id)}>
        {t('Show users')} <ArrowRight size={12} className="rtl:-scale-x-100" aria-hidden />
      </button>
    </article>
  );
}

export function GroupCards({ data }: { data: LensData }) {
  const { lens, rows } = data;
  const shown = byImpact(rows.filter((row) => row.users > 0 || lens.id === 'trait'));
  if (shown.length === 0) {
    return (
      <div className="card">
        <EmptyState title={t('No group has users')} description={t('Every group of this lens is empty in the data in view.')} />
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {shown.map((row) => (
        <GroupCard key={row.id} row={row} lens={lens} />
      ))}
    </div>
  );
}
