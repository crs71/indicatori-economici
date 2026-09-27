/**
 * salary-translations.js
 * Traduce salariul mediu net în "cât trebuie să muncești" pentru o cheltuială
 * dată — folosind o rată orară derivată (salariu / 168h, convenția INS pentru
 * un program standard de 8h/zi, ~21 zile lucrătoare). Compară explicit față de
 * acum un an, ca să arate dacă puterea de cumpărătoare (în ore de muncă)
 * s-a îmbunătățit sau s-a înrăutățit.
 */
import { formatRon } from './translations.js';

export const SALARY_SCENARIOS = [
  { id: 'outing', title: 'O ieșire sau un abonament', defaultAmount: 100 },
  { id: 'gadget', title: 'O achiziție mai mare (telefon, laptop)', defaultAmount: 2000 },
];

function formatHours(hours) {
  if (hours == null) return null;
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1).replace('.', ',')} ore`;
}

export function calculateSalaryImpact(amount, hourlyRate, hourlyRateYearAgo) {
  const amt = Number(amount) || 0;
  const hoursNow = hourlyRate > 0 ? amt / hourlyRate : 0;
  const hoursYearAgo = hourlyRateYearAgo > 0 ? amt / hourlyRateYearAgo : null;
  const diffHours = hoursYearAgo != null ? hoursNow - hoursYearAgo : null;

  return {
    hoursNowFormatted: formatHours(hoursNow),
    hoursYearAgoFormatted: formatHours(hoursYearAgo),
    isEasierNow: diffHours != null ? diffHours < -0.01 : null,
    isHarderNow: diffHours != null ? diffHours > 0.01 : null,
  };
}

export function generateSalaryTranslations(data) {
  const { current, yearAgo, growthPct, hourlyRate } = data;
  const isUp = growthPct != null && growthPct > 0.05;
  const isDown = growthPct != null && growthPct < -0.05;
  const directionText = isUp ? 'a crescut' : isDown ? 'a scăzut' : 'a rămas aproape neschimbat';

  return {
    meta: {
      currentFormatted: formatRon(current.value),
      hourlyRateFormatted: formatRon(hourlyRate),
      currentLabel: current.monthLabel,
      yearAgoLabel: yearAgo?.monthLabel ?? null,
      growthPct,
      growthFormatted: growthPct != null ? `${growthPct > 0 ? '+' : ''}${growthPct.toFixed(1).replace('.', ',')}%` : null,
      directionText,
      isUp,
      isDown,
    },
  };
}
