/**
 * inflation-service.js
 * Preluare și calcul pentru inflația anuală (IPC102E — indicii prețurilor de
 * consum, evoluție lunară față de aceeași lună din anul precedent), publicată
 * de INS prin baza de date TEMPO Online (vezi ins-tempo-client.js).
 */
import { fetchInsMonthlySeries } from './ins-tempo-client.js';

// Date oficiale de rezervă (preluate manual din TEMPO Online) pentru cazul în care
// conexiunea e offline. Fiecare "value" e indicele INS (100 = fără variație anuală);
// rata de inflație anuală = value - 100.
const FALLBACK_HISTORY = [
  { yearMonth: '2025-08', monthLabel: 'august 2025', value: 109.85 },
  { yearMonth: '2025-09', monthLabel: 'septembrie 2025', value: 109.88 },
  { yearMonth: '2025-10', monthLabel: 'octombrie 2025', value: 109.76 },
  { yearMonth: '2025-11', monthLabel: 'noiembrie 2025', value: 109.76 },
  { yearMonth: '2025-12', monthLabel: 'decembrie 2025', value: 109.69 },
  { yearMonth: '2026-01', monthLabel: 'ianuarie 2026', value: 109.62 },
  { yearMonth: '2026-02', monthLabel: 'februarie 2026', value: 109.31 },
  { yearMonth: '2026-03', monthLabel: 'martie 2026', value: 109.87 },
  { yearMonth: '2026-04', monthLabel: 'aprilie 2026', value: 110.71 },
  { yearMonth: '2026-05', monthLabel: 'mai 2026', value: 110.85 },
  { yearMonth: '2026-06', monthLabel: 'iunie 2026', value: 110.42 },
  { yearMonth: '2026-07', monthLabel: 'iulie 2026', value: 108.16 },
];

export async function getInflationData() {
  let history = null;
  let isFallback = false;

  try {
    history = await fetchInsMonthlySeries({ matCode: 'IPC102E', categoryLabel: 'TOTAL' });
  } catch (err) {
    console.warn('Nu s-au putut prelua datele live INS (inflație). Se utilizează datele de rezervă:', err);
    history = [...FALLBACK_HISTORY];
    isFallback = true;
  }

  const n = history.length;
  const current = history[n - 1];
  const previous = n > 1 ? history[n - 2] : current;
  const yearAgoIndex = n - 13; // 12 luni în urmă față de "current" (ultimul element)
  const yearAgo = yearAgoIndex >= 0 ? history[yearAgoIndex] : null;

  return {
    isFallback,
    current,
    previous,
    yearAgo,
    currentRate: current.value - 100,
    previousRate: previous.value - 100,
    history,
  };
}
