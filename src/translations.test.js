import { describe, it, expect } from 'vitest';
import { formatRon, formatPercent, generateStudentTranslations, calculateCustomImpact } from './translations.js';

describe('formatRon', () => {
  it('formats with comma decimal separator and "lei" suffix', () => {
    expect(formatRon(52.5718)).toBe('52,57 lei');
  });
  it('adds a "+" sign when showSign is true and value is positive', () => {
    expect(formatRon(0.15, true)).toBe('+0,15 lei');
  });
  it('does not add a sign for negative values (the minus is already there)', () => {
    expect(formatRon(-0.15, true)).toBe('-0,15 lei');
  });
});

describe('formatPercent', () => {
  it('formats with comma decimal and "%" suffix, sign by default', () => {
    expect(formatPercent(0.287)).toBe('+0,29%');
  });
  it('omits the sign when showSign is false', () => {
    expect(formatPercent(0.287, false)).toBe('0,29%');
  });
});

describe('generateStudentTranslations', () => {
  const currencyData = {
    currentRate: 5.2718,
    startRate: 5.2567,
    delta10Days: 0.0151,
    percentChange10Days: 0.2872524587668965,
  };
  const commonDates = { startDateFormatted: '5 septembrie 2026', currentDateFormatted: '18 septembrie 2026' };

  it('marks the direction as "creștere" when the rate went up', () => {
    const result = generateStudentTranslations('EUR', currencyData, commonDates);
    expect(result.meta.isUp).toBe(true);
    expect(result.meta.directionText).toBe('creștere');
  });

  it('marks the direction as "scădere" when the rate went down', () => {
    const result = generateStudentTranslations('EUR', { ...currencyData, delta10Days: -0.01 }, commonDates);
    expect(result.meta.isUp).toBe(false);
    expect(result.meta.directionText).toBe('scădere');
  });

  it('computes the cost difference per scenario from the currency config', () => {
    const result = generateStudentTranslations('EUR', currencyData, commonDates);
    const subscription = result.scenarios[0]; // amount: 10
    const expectedDiff = 10 * currencyData.currentRate - 10 * currencyData.startRate;
    expect(subscription.diffFormatted).toBe(formatRon(expectedDiff, true));
  });

  it('falls back to EUR config for an unknown currency code', () => {
    const result = generateStudentTranslations('XXX', currencyData, commonDates);
    expect(result.cfg.symbol).toBe('€');
  });
});

describe('calculateCustomImpact', () => {
  const currencyData = { currentRate: 5.2718, startRate: 5.2567 };

  it('computes cost now, cost at start, and the difference for a given amount', () => {
    const result = calculateCustomImpact(50, 'EUR', currencyData);
    expect(result.costNow).toBe(formatRon(50 * 5.2718));
    expect(result.costStart).toBe(formatRon(50 * 5.2567));
    expect(result.isPositive).toBe(true);
    expect(result.isZero).toBe(false);
  });

  it('treats a non-numeric amount as zero instead of throwing', () => {
    const result = calculateCustomImpact('abc', 'EUR', currencyData);
    expect(result.amount).toBe(0);
    expect(result.isZero).toBe(true);
  });
});
