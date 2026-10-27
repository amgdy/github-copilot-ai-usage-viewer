import { describe, expect, it } from 'vitest';
import { parseModelName } from '../src/lib/pricing/models';

describe('parseModelName', () => {
  it('reads the "Auto: Model" form GitHub writes', () => {
    expect(parseModelName('Auto: GPT-5.6 Terra')).toEqual({ name: 'GPT-5.6 Terra', auto: true });
    expect(parseModelName('  auto :  Claude Sonnet 4.6 ')).toEqual({ name: 'Claude Sonnet 4.6', auto: true });
  });

  it('reads a spaced dash and a bare "Auto"', () => {
    expect(parseModelName('Auto - GPT-5.6 Sol')).toEqual({ name: 'GPT-5.6 Sol', auto: true });
    expect(parseModelName('Auto – GPT-5.6 Sol')).toEqual({ name: 'GPT-5.6 Sol', auto: true });
    expect(parseModelName('Auto')).toEqual({ name: 'Auto', auto: true });
  });

  it('keeps names that only start with "auto" as ordinary models', () => {
    expect(parseModelName('auto-complete')).toEqual({ name: 'auto-complete', auto: false });
    expect(parseModelName('Autopilot 1')).toEqual({ name: 'Autopilot 1', auto: false });
    expect(parseModelName('GPT-5.6 Terra')).toEqual({ name: 'GPT-5.6 Terra', auto: false });
  });
});
