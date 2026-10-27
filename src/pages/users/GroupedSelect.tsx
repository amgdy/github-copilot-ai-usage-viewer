import { Fragment, useMemo } from 'react';
import { cx, sortOptions, type OptionOrder } from '../../components/ui';

export interface SelectGroup<T extends string> {
  /** Groups without a label are shown as plain options. */
  label?: string;
  options: { value: T; label: string; disabled?: boolean; title?: string }[];
}

/**
 * A native select with option groups, styled like the shared Select. Like Select, the groups and the choices in each
 * group are shown A to Z by their translated label unless `order="given"`. Groups without a label come first.
 */
export function GroupedSelect<T extends string>({
  value,
  onChange,
  groups,
  className,
  order = 'alpha',
  ...rest
}: {
  value: T;
  onChange: (v: T) => void;
  groups: SelectGroup<T>[];
  className?: string;
  order?: OptionOrder;
  'aria-label'?: string;
}) {
  const sorted = useMemo(() => {
    const inner = groups.map((g, i) => ({ key: g.label ?? String(i), label: g.label, options: sortOptions(g.options, (o) => o.label, order) }));
    if (order === 'given') return inner;
    const plain = inner.filter((g) => !g.label);
    const named = sortOptions(
      inner.filter((g) => g.label).map((g) => ({ ...g, value: g.key })),
      (g) => g.label ?? '',
      order,
      [],
    );
    return [...plain, ...named];
  }, [groups, order]);

  return (
    <select
      className={cx('input w-auto max-w-full pe-7', className)}
      value={value}
      aria-label={rest['aria-label']}
      onChange={(e) => {
        for (const g of groups) {
          const o = g.options.find((x) => x.value === e.target.value);
          if (o) {
            onChange(o.value);
            return;
          }
        }
      }}
    >
      {sorted.map((g) => {
        const options = g.options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled} title={o.title}>
            {o.label}
          </option>
        ));
        return g.label ? (
          <optgroup key={g.key} label={g.label}>
            {options}
          </optgroup>
        ) : (
          <Fragment key={g.key}>{options}</Fragment>
        );
      })}
    </select>
  );
}
