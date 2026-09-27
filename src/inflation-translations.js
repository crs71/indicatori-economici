/**
 * inflation-translations.js
 * Traduce inflația anuală (IPC) în impact concret: cât costă acum, față de acum
 * un an, un buget de cheltuieli de o anumită sumă. Spre deosebire de dobândă,
 * aici nu e o simplificare didactică — e chiar definiția indicelui prețurilor
 * de consum (compară costul aceluiași "coș" de cumpărături la un an distanță).
 */
import { formatRon } from './translations.js';

export const INFLATION_SCENARIOS = [
  {
    id: 'basket',
    title: 'Coșul lunar de cumpărături',
    defaultAmount: 1000,
  },
  {
    id: 'rent',
    title: 'Chirie sau buget lunar mare',
    defaultAmount: 2500,
  },
];

export function calculateInflationImpact(amount, currentRate) {
  const amt = Number(amount) || 0;
  const extra = (amt * currentRate) / 100;
  return {
    lastYearFormatted: formatRon(amt),
    nowFormatted: formatRon(amt + extra),
    extraFormatted: formatRon(extra, true),
  };
}

export function generateInflationTranslations(data) {
  const { currentRate, previousRate, current, previous, yearAgo } = data;
  const isAccelerating = currentRate - previousRate > 0.01;
  const isDecelerating = currentRate - previousRate < -0.01;
  const trendText = isAccelerating ? 'accelerează' : isDecelerating ? 'încetinește' : 'e stabilă';

  return {
    meta: {
      currentRate,
      previousRate,
      trendText,
      isAccelerating,
      isDecelerating,
      currentLabel: current.monthLabel,
      previousLabel: previous.monthLabel,
      yearAgoLabel: yearAgo?.monthLabel ?? null,
    },
  };
}
