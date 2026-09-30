import { describe, it, expect } from 'vitest';
import { calculateSalaryImpact, generateSalaryTranslations } from './salary-translations.js';

describe('calculateSalaryImpact', () => {
  it('converts an amount into hours of work at the given hourly rate', () => {
    // 100 lei la 34.64 lei/oră -> ~2.9 ore (verificat manual în sesiune)
    const result = calculateSalaryImpact(100, 34.64, 32.84);
    expect(result.hoursNowFormatted).toBe('2,9 ore');
    expect(result.hoursYearAgoFormatted).toBe('3,0 ore');
  });

  it('formats sub-hour durations in minutes instead of a fraction of an hour', () => {
    const result = calculateSalaryImpact(10, 34.64, 32.84);
    expect(result.hoursNowFormatted).toMatch(/min$/);
  });

  it('marks it as "easier now" when fewer hours are needed than a year ago', () => {
    const result = calculateSalaryImpact(100, 34.64, 32.84);
    expect(result.isEasierNow).toBe(true);
    expect(result.isHarderNow).toBe(false);
  });

  it('marks it as "harder now" when more hours are needed than a year ago', () => {
    const result = calculateSalaryImpact(100, 30, 34.64);
    expect(result.isHarderNow).toBe(true);
    expect(result.isEasierNow).toBe(false);
  });

  it('returns null comparisons when there is no year-ago rate to compare against', () => {
    const result = calculateSalaryImpact(100, 34.64, null);
    expect(result.hoursYearAgoFormatted).toBeNull();
    expect(result.isEasierNow).toBeNull();
    expect(result.isHarderNow).toBeNull();
  });
});

describe('generateSalaryTranslations', () => {
  const current = { value: 5820, monthLabel: 'iulie 2026' };
  const yearAgo = { monthLabel: 'iulie 2025' };

  it('marks salary growth above the threshold as "a crescut"', () => {
    const result = generateSalaryTranslations({ current, yearAgo, growthPct: 5.5, hourlyRate: 34.64 });
    expect(result.meta.isUp).toBe(true);
    expect(result.meta.directionText).toBe('a crescut');
    expect(result.meta.growthFormatted).toBe('+5,5%');
  });

  it('marks salary decline below the threshold as "a scăzut"', () => {
    const result = generateSalaryTranslations({ current, yearAgo, growthPct: -3, hourlyRate: 34.64 });
    expect(result.meta.isDown).toBe(true);
    expect(result.meta.directionText).toBe('a scăzut');
  });

  it('treats a tiny change (under the 0.05 threshold) as unchanged', () => {
    const result = generateSalaryTranslations({ current, yearAgo, growthPct: 0.02, hourlyRate: 34.64 });
    expect(result.meta.isUp).toBe(false);
    expect(result.meta.isDown).toBe(false);
    expect(result.meta.directionText).toBe('a rămas aproape neschimbat');
  });

  it('handles a null growthPct (no year-ago data) without throwing', () => {
    const result = generateSalaryTranslations({ current, yearAgo: null, growthPct: null, hourlyRate: 34.64 });
    expect(result.meta.growthFormatted).toBeNull();
    expect(result.meta.yearAgoLabel).toBeNull();
  });
});
