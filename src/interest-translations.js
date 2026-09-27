/**
 * interest-translations.js
 * Traduce rata de politică monetară BNR în impact ilustrativ pentru un student
 * (depozit de economii / credit), ancorat în zilele scurse de la ultima decizie CA —
 * nu într-un delta static, ca să rămână "viu" chiar și când rata nu se schimbă.
 * Calculele sunt simplificări didactice (dobândă simplă) — NU reprezintă o ofertă
 * reală de la vreo bancă, care aplică marje proprii și alte rate de referință (ROBOR/IRCC).
 */
import { formatRon } from './translations.js';

export const INTEREST_SCENARIOS = [
  {
    id: 'savings',
    title: 'Depozit de economii',
    defaultAmount: 5000,
    verb: 'câștigat',
  },
  {
    id: 'loan',
    title: 'Credit sau împrumut',
    defaultAmount: 10000,
    verb: 'plătit',
  },
];

/**
 * Calculează dobânda zilnică și cea acumulată de la ultima schimbare, pentru
 * o sumă aleasă liber de utilizator (input editabil în UI).
 */
export function calculateScenarioImpact(amount, currentDpm, daysSinceChange) {
  const amt = Number(amount) || 0;
  const dailyAmount = (amt * currentDpm) / 100 / 365;
  const accumulated = dailyAmount * daysSinceChange;
  return {
    dailyFormatted: formatRon(dailyAmount),
    accumulatedFormatted: formatRon(accumulated),
  };
}

export function generateInterestTranslations(data) {
  const { delta, daysSinceChange } = data;
  const isUp = delta > 0.0001;
  const isNeutral = Math.abs(delta) < 0.0001;
  const directionText = isUp ? 'creștere' : isNeutral ? 'stagnare' : 'scădere';

  return {
    meta: {
      isUp,
      isNeutral,
      directionText,
      deltaFormatted: `${isUp ? '+' : ''}${delta.toFixed(2).replace('.', ',')} puncte procentuale`,
      daysSinceChange,
    },
  };
}

/**
 * Compară ritmul cursului valutar (zilnic) cu cel al ratei de politică monetară
 * (doar la decizii CA), pe baza istoricului valutar deja preluat pentru primul indicator.
 */
export function compareToExchangeRateVolatility(eurHistory, daysSinceChange) {
  if (!eurHistory?.length || eurHistory.length < 2) return null;
  let moves = 0;
  for (let i = 1; i < eurHistory.length; i++) {
    if (Math.abs(eurHistory[i].rate - eurHistory[i - 1].rate) > 0.00001) moves++;
  }
  return {
    moves,
    sessions: eurHistory.length - 1,
    daysSinceChange,
  };
}
