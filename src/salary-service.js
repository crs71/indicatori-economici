/**
 * salary-service.js
 * Preluare și calcul pentru salariul mediu net lunar la nivelul economiei
 * naționale (FOM106G — CAEN Rev.3, categoria "TOTAL ECONOMIE"), publicat lunar
 * de INS prin baza de date TEMPO Online (vezi ins-tempo-client.js).
 */
import { fetchInsMonthlySeries } from './ins-tempo-client.js';

// Date oficiale de rezervă (preluate manual din TEMPO Online) pentru cazul în
// care conexiunea e offline. Valorile sunt salariul mediu net lunar, în lei.
const FALLBACK_HISTORY = [
  { yearMonth: '2025-07', monthLabel: 'iulie 2025', value: 5517 },
  { yearMonth: '2025-08', monthLabel: 'august 2025', value: 5387 },
  { yearMonth: '2025-09', monthLabel: 'septembrie 2025', value: 5443 },
  { yearMonth: '2025-10', monthLabel: 'octombrie 2025', value: 5492 },
  { yearMonth: '2025-11', monthLabel: 'noiembrie 2025', value: 5615 },
  { yearMonth: '2025-12', monthLabel: 'decembrie 2025', value: 5914 },
  { yearMonth: '2026-01', monthLabel: 'ianuarie 2026', value: 5518 },
  { yearMonth: '2026-02', monthLabel: 'februarie 2026', value: 5557 },
  { yearMonth: '2026-03', monthLabel: 'martie 2026', value: 5938 },
  { yearMonth: '2026-04', monthLabel: 'aprilie 2026', value: 5843 },
  { yearMonth: '2026-05', monthLabel: 'mai 2026', value: 5684 },
  { yearMonth: '2026-06', monthLabel: 'iunie 2026', value: 5734 },
  { yearMonth: '2026-07', monthLabel: 'iulie 2026', value: 5820 },
];

// Presupunere standard pentru "ore lucrate pe lună" (8h/zi × ~21 zile lucrătoare),
// aceeași convenție folosită de INS pentru seriile sale orare (FOM108/FOM109).
const STANDARD_HOURS_PER_MONTH = 168;

export async function getSalaryData() {
  let history = null;
  let isFallback = false;

  try {
    history = await fetchInsMonthlySeries({ matCode: 'FOM106G', categoryLabel: 'TOTAL ECONOMIE', monthsBack: 25 });
  } catch (err) {
    console.warn('Nu s-au putut prelua datele live INS (salariu). Se utilizează datele de rezervă:', err);
    history = [...FALLBACK_HISTORY];
    isFallback = true;
  }

  const n = history.length;
  const current = history[n - 1];
  const yearAgoIndex = n - 13;
  const yearAgo = yearAgoIndex >= 0 ? history[yearAgoIndex] : null;

  const growthPct = yearAgo ? ((current.value - yearAgo.value) / yearAgo.value) * 100 : null;
  const hourlyRate = current.value / STANDARD_HOURS_PER_MONTH;
  const hourlyRateYearAgo = yearAgo ? yearAgo.value / STANDARD_HOURS_PER_MONTH : null;

  return {
    isFallback,
    current,
    yearAgo,
    growthPct,
    hourlyRate,
    hourlyRateYearAgo,
    standardHours: STANDARD_HOURS_PER_MONTH,
    history,
  };
}
