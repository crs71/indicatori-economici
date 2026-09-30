import { describe, it, expect } from 'vitest';
import { calculateInflationImpact, generateInflationTranslations } from './inflation-translations.js';

describe('calculateInflationImpact', () => {
  it('applies the inflation rate to a given amount', () => {
    // 1000 lei acum un an, +8.16% inflație -> 1081.60 lei azi
    const result = calculateInflationImpact(1000, 8.16);
    expect(result.lastYearFormatted).toBe('1000,00 lei');
    expect(result.nowFormatted).toBe('1081,60 lei');
    expect(result.extraFormatted).toBe('+81,60 lei');
  });

  it('handles negative inflation (deflation) with a negative difference', () => {
    const result = calculateInflationImpact(1000, -2);
    expect(result.nowFormatted).toBe('980,00 lei');
    expect(result.extraFormatted).toBe('-20,00 lei');
  });

  it('treats a non-numeric amount as zero', () => {
    const result = calculateInflationImpact('abc', 8.16);
    expect(result.lastYearFormatted).toBe('0,00 lei');
  });
});

describe('generateInflationTranslations', () => {
  const current = { monthLabel: 'iulie 2026' };
  const previous = { monthLabel: 'iunie 2026' };
  const yearAgo = { monthLabel: 'iulie 2025' };

  it('detects a decelerating inflation trend', () => {
    const result = generateInflationTranslations({
      currentRate: 8.16,
      previousRate: 10.42,
      current,
      previous,
      yearAgo,
    });
    expect(result.meta.isDecelerating).toBe(true);
    expect(result.meta.isAccelerating).toBe(false);
    expect(result.meta.trendText).toBe('încetinește');
  });

  it('detects an accelerating inflation trend', () => {
    const result = generateInflationTranslations({
      currentRate: 10,
      previousRate: 8,
      current,
      previous,
      yearAgo,
    });
    expect(result.meta.isAccelerating).toBe(true);
    expect(result.meta.trendText).toBe('accelerează');
  });

  it('treats a tiny change (under the 0.01 threshold) as stable', () => {
    const result = generateInflationTranslations({
      currentRate: 8.16,
      previousRate: 8.155,
      current,
      previous,
      yearAgo,
    });
    expect(result.meta.trendText).toBe('e stabilă');
  });

  it('handles a missing yearAgo entry (short history) without throwing', () => {
    const result = generateInflationTranslations({
      currentRate: 8.16,
      previousRate: 10.42,
      current,
      previous,
      yearAgo: null,
    });
    expect(result.meta.yearAgoLabel).toBeNull();
  });
});
