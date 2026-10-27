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
  onChange: (value: T) => void;
  groups: SelectGroup<T>[];
  className?: string;
  order?: OptionOrder;
  'aria-label'?: string;
}) {
  const sorted = useMemo(() => {
    const inner = groups.map((group, index) => ({ key: group.label ?? String(index), label: group.label, options: sortOptions(group.options, (option) => option.label, order) }));
    if (order === 'given') return inner;
    const plain = inner.filter((group) => !group.label);
    const named = sortOptions(
      inner.filter((group) => group.label).map((group) => ({ ...group, value: group.key })),
      (group) => group.label ?? '',
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
      onChange={(event) => {
        for (const group of groups) {
          const selected = group.options.find((option) => option.value === event.target.value);
          if (selected) {
            onChange(selected.value);
            return;
          }
        }
      }}
    >
      {sorted.map((group) => {
        const options = group.options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled} title={option.title}>
            {option.label}
          </option>
        ));
        return group.label ? (
          <optgroup key={group.key} label={group.label}>
            {options}
          </optgroup>
        ) : (
          <Fragment key={group.key}>{options}</Fragment>
        );
      })}
    </select>
  );
}
