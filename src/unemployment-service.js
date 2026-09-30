/**
 * unemployment-service.js
 * Preluare și calcul pentru rata șomajului BIM (AMG157H — serie ajustată
 * sezonier), atât pe populația activă generală (15-74 ani), cât și pe
 * segmentul tânăr (15-24 ani) — cel mai relevant pentru un student aproape
 * de intrarea pe piața muncii —, publicate lunar de INS prin TEMPO Online
 * (vezi ins-tempo-client.js).
 */
import { fetchInsMonthlySeriesMulti } from './ins-tempo-client.js';

// Date oficiale de rezervă (preluate manual din TEMPO Online) pentru cazul în
// care conexiunea e offline. Seria pentru tineri are un decalaj de raportare
// mai mare decât cea generală (eșantion mai mic în ancheta AMIGO), deci cele
// două serii nu se opresc mereu în aceeași lună.
const FALLBACK_GENERAL = [
  { yearMonth: '2025-07', monthLabel: 'iulie 2025', value: 5.9 },
  { yearMonth: '2025-08', monthLabel: 'august 2025', value: 6.1 },
  { yearMonth: '2025-09', monthLabel: 'septembrie 2025', value: 6.0 },
  { yearMonth: '2025-10', monthLabel: 'octombrie 2025', value: 6.1 },
  { yearMonth: '2025-11', monthLabel: 'noiembrie 2025', value: 6.3 },
  { yearMonth: '2025-12', monthLabel: 'decembrie 2025', value: 6.1 },
  { yearMonth: '2026-01', monthLabel: 'ianuarie 2026', value: 6.3 },
  { yearMonth: '2026-02', monthLabel: 'februarie 2026', value: 6.3 },
  { yearMonth: '2026-03', monthLabel: 'martie 2026', value: 6.5 },
  { yearMonth: '2026-04', monthLabel: 'aprilie 2026', value: 6.8 },
  { yearMonth: '2026-05', monthLabel: 'mai 2026', value: 6.7 },
  { yearMonth: '2026-06', monthLabel: 'iunie 2026', value: 6.8 },
  { yearMonth: '2026-07', monthLabel: 'iulie 2026', value: 6.4 },
];

const FALLBACK_YOUTH = [
  { yearMonth: '2025-07', monthLabel: 'iulie 2025', value: 25.9 },
  { yearMonth: '2025-08', monthLabel: 'august 2025', value: 25.9 },
  { yearMonth: '2025-09', monthLabel: 'septembrie 2025', value: 25.9 },
  { yearMonth: '2025-10', monthLabel: 'octombrie 2025', value: 28.2 },
  { yearMonth: '2025-11', monthLabel: 'noiembrie 2025', value: 28.2 },
  { yearMonth: '2025-12', monthLabel: 'decembrie 2025', value: 28.2 },
  { yearMonth: '2026-01', monthLabel: 'ianuarie 2026', value: 28.8 },
  { yearMonth: '2026-02', monthLabel: 'februarie 2026', value: 28.8 },
  { yearMonth: '2026-03', monthLabel: 'martie 2026', value: 28.8 },
  { yearMonth: '2026-04', monthLabel: 'aprilie 2026', value: 30.8 },
  { yearMonth: '2026-05', monthLabel: 'mai 2026', value: 30.8 },
  { yearMonth: '2026-06', monthLabel: 'iunie 2026', value: 30.8 },
];

async function fetchSeries(ageLabel, monthsBack) {
  return fetchInsMonthlySeriesMulti({
    matCode: 'AMG157H',
    categoryLabels: [ageLabel, 'Total'],
    monthsBack,
  });
}

export async function getUnemploymentData() {
  let general = null;
  let youth = null;
  let isFallback = false;

  try {
    [general, youth] = await Promise.all([
      fetchSeries('15 - 74 ani', 13),
      fetchSeries('15 - 24 ani', 13),
    ]);
  } catch (err) {
    console.warn('Nu s-au putut prelua datele live INS (șomaj). Se utilizează datele de rezervă:', err);
    general = [...FALLBACK_GENERAL];
    youth = [...FALLBACK_YOUTH];
    isFallback = true;
  }

  const n = general.length;
  const current = general[n - 1];
  const previous = n > 1 ? general[n - 2] : current;
  const currentYouth = youth[youth.length - 1];

  return {
    isFallback,
    current,
    previous,
    currentYouth,
    delta: current.value - previous.value,
    youthGapPoints: currentYouth.value - current.value,
    youthMultiple: current.value > 0 ? currentYouth.value / current.value : null,
    history: general,
  };
}
