import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge, CalcInfo, Card, TONE_CLASS, cx, type Tone } from '../../components/ui';
import { msg, t, tp } from '../../i18n';
import { fmtInt } from '../../lib/utils/format';
import type { Check, CheckStatus } from './quality';

const ORDER: Record<CheckStatus, number> = { warn: 0, info: 1, pass: 2 };
const TONE: Record<CheckStatus, Tone> = { warn: 'warn', info: 'info', pass: 'good' };
const LABEL: Record<CheckStatus, string> = { warn: msg('Needs attention'), info: msg('For your information'), pass: msg('Passed') };
const ICON = { warn: AlertTriangle, info: Info, pass: CheckCircle2 } as const;

function CheckItem({ check }: { check: Check }) {
  const Icon = ICON[check.status];
  return (
    <li className="flex gap-3 rounded-lg border border-border-muted p-3">
      <span className={cx('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border', TONE_CLASS[TONE[check.status]])}>
        <Icon size={14} aria-hidden />
      </span>
      <div className="min-w-0 space-y-1">
        <h4 className="flex items-start gap-1.5 text-sm font-medium">
          <span className="sr-only">{t(LABEL[check.status])}: </span>
          <span className="min-w-0">{check.title}</span>
          {check.calc ? <CalcInfo id={check.calc} className="mt-1" /> : null}
        </h4>
        <p className="text-sm text-fg-muted">{check.result}</p>
        {check.details?.length ? (
          <ul className="list-disc space-y-0.5 ps-4 text-xs text-fg-muted">
            {check.details.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        ) : null}
        {check.action && check.status !== 'pass' ? (
          <p className="text-xs text-fg-muted">
            <span className="font-medium text-fg">{t('What to do:')} </span>
            {check.action}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function QualityCard({ checks }: { checks: Check[] }) {
  const sorted = useMemo(() => [...checks].sort((a, b) => ORDER[a.status] - ORDER[b.status]), [checks]);
  const count = (status: CheckStatus) => checks.filter((check) => check.status === status).length;
  const warn = count('warn');
  const info = count('info');
  const pass = count('pass');

  return (
    <Card
      title={t('Data quality checks')}
      subtitle={t('Worked out from all the files you loaded, whatever the filters. Items that need attention come first.')}
      calc="data-quality-checks"
      actions={
        <div className="flex flex-wrap items-center gap-1.5">
          {warn > 0 ? <Badge tone="warn">{tp(warn, '{n} needs attention', '{n} need attention', { n: fmtInt(warn) })}</Badge> : null}
          {info > 0 ? <Badge tone="info">{tp(info, '{n} note', '{n} notes', { n: fmtInt(info) })}</Badge> : null}
          <Badge tone="good">{tp(pass, '{n} passed', '{n} passed', { n: fmtInt(pass) })}</Badge>
        </div>
      }
    >
      <ul className="grid gap-3 lg:grid-cols-2">
        {sorted.map((check) => (
          <CheckItem key={check.id} check={check} />
        ))}
      </ul>
    </Card>
  );
}
