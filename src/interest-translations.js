/**
 * interest-translations.js
 * Traduce schimbarea ratei de politică monetară BNR în impact ilustrativ
 * pentru un student (depozit de economii / credit). Calculele sunt simplificări
 * didactice (dobândă simplă, un an întreg) — NU reprezintă o ofertă reală de
 * la vreo bancă, care aplică marje proprii și alte rate de referință (ROBOR/IRCC).
 */
import { formatRon } from './translations.js';

export const INTEREST_SCENARIOS = [
  {
    id: 'savings',
    title: 'Depozit de economii',
    amount: 5000,
    verb: 'câștigi',
  },
  {
    id: 'loan',
    title: 'Credit sau împrumut',
    amount: 10000,
    verb: 'plătești',
  },
];

export function generateInterestTranslations(data) {
  const { current, previous, delta } = data;
  const isUp = delta > 0.0001;
  const isNeutral = Math.abs(delta) < 0.0001;
  const directionText = isUp ? 'creștere' : isNeutral ? 'stagnare' : 'scădere';

  const scenarios = INTEREST_SCENARIOS.map((scen) => {
    const yearlyBefore = (scen.amount * previous.dpm) / 100;
    const yearlyAfter = (scen.amount * current.dpm) / 100;
    const diff = yearlyAfter - yearlyBefore;
    return {
      ...scen,
      amountFormatted: `${scen.amount.toLocaleString('ro-RO')} lei`,
      yearlyBeforeFormatted: formatRon(yearlyBefore),
      yearlyAfterFormatted: formatRon(yearlyAfter),
      diffFormatted: formatRon(diff, true),
      isMore: diff > 0,
    };
  });

  return {
    meta: {
      isUp,
      isNeutral,
      directionText,
      deltaFormatted: `${isUp ? '+' : ''}${delta.toFixed(2).replace('.', ',')} puncte procentuale`,
    },
    scenarios,
  };
}
