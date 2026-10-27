import type { Column } from '../../components/ui';
import { fmtCount } from '../../components/user/shared';
import { t } from '../../i18n';
import type { UserProfile } from '../../lib/analytics/users';
import { fmtPct } from '../../lib/utils/format';
import { NO_TOKENS, sum, usd, withReason, type ColumnContext } from './columnKit';

/** The columns of the Tokens view that the General view does not have. The cache hit rate column is shared with the General view. */
export function tokenColumns({ coverage }: ColumnContext): Column<UserProfile>[] {
  const known = coverage.tokens;
  const none = withReason(NO_TOKENS);
  const noTokens = t(NO_TOKENS);

  const count = (key: string, header: string, hint: string, pick: (user: UserProfile) => number): Column<UserProfile> => ({
    key,
    header,
    hint: known ? hint : noTokens,
    value: (user) => (known ? pick(user) : Number.NaN),
    render: (user) => (known ? fmtCount(pick(user)) : none),
    align: 'end',
    total: (rows) => (known ? fmtCount(sum(rows, pick)) : '–'),
  });

  const cost = (key: string, header: string, hint: string, pick: (user: UserProfile) => number): Column<UserProfile> => ({
    key,
    header,
    hint: known ? hint : noTokens,
    calc: 'token-cost-split',
    value: (user) => (known ? pick(user) : Number.NaN),
    render: (user) => (known ? usd(pick(user)) : none),
    align: 'end',
    total: (rows) => (known ? usd(sum(rows, pick)) : '–'),
  });

  return [
    { ...count('tokenInput', t('Input tokens'), t('Prompt tokens that were not read from the cache'), (user) => user.input), calc: 'tokens-input' },
    {
      ...count('tokenCacheRead', t('Cache read tokens'), t('Text the model has seen before and reads again from the cache at a lower price'), (user) => user.cacheRead),
      calc: 'tokens-cache-read',
    },
    {
      ...count('tokenCacheWrite', t('Cache write tokens'), t('Text stored in the cache so later requests can read it at a lower price'), (user) => user.cacheWrite),
      calc: 'tokens-cache-write',
    },
    { ...count('tokenOutput', t('Output tokens'), t('Tokens the model wrote back'), (user) => user.output), calc: 'tokens-output' },
    { ...count('tokenTotal', t('Total tokens'), t('Input, cache read, cache write and output tokens together'), (user) => user.tokens), calc: 'tokens-total' },
    cost('costInput', t('Input cost'), t('Usage on input tokens. An estimate: the usage of rows with token counts, split by token type with the price card.'), (user) => user.costInput),
    cost(
      'costCacheRead',
      t('Cache read cost'),
      t('Usage on cache read tokens. An estimate: the usage of rows with token counts, split by token type with the price card.'),
      (user) => user.costCacheRead,
    ),
    cost(
      'costCacheWrite',
      t('Cache write cost'),
      t('Usage on cache write tokens. An estimate: the usage of rows with token counts, split by token type with the price card.'),
      (user) => user.costCacheWrite,
    ),
    cost('costOutput', t('Output cost'), t('Usage on output tokens. An estimate: the usage of rows with token counts, split by token type with the price card.'), (user) => user.costOutput),
    {
      key: 'tokenCoverage',
      header: t('Token coverage'),
      hint: known ? t('Share of the usage of the user that the cost by token type covers') : noTokens,
      calc: 'token-coverage',
      value: (user) => (known ? user.tokenCoverage : Number.NaN),
      render: (user) => (known ? fmtPct(user.tokenCoverage, 0) : none),
      align: 'end',
    },
  ];
}
