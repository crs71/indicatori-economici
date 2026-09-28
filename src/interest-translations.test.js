import { describe, it, expect } from 'vitest';
import {
  calculateScenarioImpact,
  generateInterestTranslations,
  compareToExchangeRateVolatility,
} from './interest-translations.js';

describe('calculateScenarioImpact', () => {
  it('computes daily interest and the amount accumulated over the elapsed days', () => {
    // 5000 lei la 6.5% pe an, 779 zile scurse — verificat manual în sesiune
    const result = calculateScenarioImpact(5000, 6.5, 779);
    expect(result.dailyFormatted).toBe('0,89 lei');
    expect(result.accumulatedFormatted).toBe('693,63 lei');
  });

  it('treats a non-numeric amount as zero', () => {
    const result = calculateScenarioImpact('abc', 6.5, 100);
    expect(result.dailyFormatted).toBe('0,00 lei');
  });

  it('scales linearly with the amount', () => {
    const base = calculateScenarioImpact(1000, 6.5, 365);
    const double = calculateScenarioImpact(2000, 6.5, 365);
    // dobânda pe 1000 lei * 2 ar trebui să fie exact dobânda pe 2000 lei
    const baseValue = parseFloat(base.accumulatedFormatted.replace(' lei', '').replace(',', '.'));
    const doubleValue = parseFloat(double.accumulatedFormatted.replace(' lei', '').replace(',', '.'));
    expect(doubleValue).toBeCloseTo(baseValue * 2, 1);
  });
});

describe('generateInterestTranslations', () => {
  it('marks a rate decrease correctly', () => {
    const result = generateInterestTranslations({ delta: -0.25, daysSinceChange: 779 });
    expect(result.meta.isUp).toBe(false);
    expect(result.meta.isNeutral).toBe(false);
    expect(result.meta.directionText).toBe('scădere');
    expect(result.meta.deltaFormatted).toBe('-0,25 puncte procentuale');
  });

  it('marks an unchanged rate as neutral', () => {
    const result = generateInterestTranslations({ delta: 0, daysSinceChange: 10 });
    expect(result.meta.isNeutral).toBe(true);
    expect(result.meta.directionText).toBe('stagnare');
  });

  it('marks a rate increase correctly, with a "+" sign', () => {
    const result = generateInterestTranslations({ delta: 0.5, daysSinceChange: 1 });
    expect(result.meta.isUp).toBe(true);
    expect(result.meta.deltaFormatted).toBe('+0,50 puncte procentuale');
  });
});

describe('compareToExchangeRateVolatility', () => {
  it('counts only the sessions where the rate actually changed', () => {
    const eurHistory = [
      { rate: 5.25 },
      { rate: 5.25 }, // neschimbat
      { rate: 5.26 }, // schimbat
      { rate: 5.27 }, // schimbat
    ];
    const result = compareToExchangeRateVolatility(eurHistory, 779);
    expect(result.moves).toBe(2);
    expect(result.sessions).toBe(3);
    expect(result.daysSinceChange).toBe(779);
  });

  it('returns null when there is not enough history to compare', () => {
    expect(compareToExchangeRateVolatility([], 10)).toBeNull();
    expect(compareToExchangeRateVolatility([{ rate: 5 }], 10)).toBeNull();
    expect(compareToExchangeRateVolatility(null, 10)).toBeNull();
  });
});
