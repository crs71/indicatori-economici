/**
 * inflation-service.js
 * Preluare, parsare și calcul pentru inflația anuală (IPC102E — indicii
 * prețurilor de consum, evoluție lunară față de aceeași lună din anul
 * precedent), publicată de INS prin baza de date TEMPO Online.
 *
 * Sursa cere două cereri: una pentru metadatele matricei (ca să aflăm codurile
 * interne ale ultimelor luni disponibile), una pentru datele efective. Ambele
 * trec prin proxy-ul propriu (vezi functions/api/inflatie-meta.js și
 * functions/api/inflatie-pivot.js) — statistici.insse.ro nu are HTTPS și nu
 * trimite CORS, verificat manual.
 */

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

const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

export function formatMonthYearRo(yearMonth) {
  const [year, month] = yearMonth.split('-');
  return `${MONTHS_RO[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Parsează CSV-ul simplu întors de INS: "TOTAL, Luna iulie 2026, Procente, 108.16"
 */
function parsePivotCsv(text) {
  const rows = [];
  const lineRegex = /Luna\s+([a-zăâîșț]+)\s+(\d{4}),\s*Procente,\s*([\d.]+)/i;

  text.split('\n').forEach((line) => {
    const match = lineRegex.exec(line);
    if (!match) return;
    const [, monthName, year, valueStr] = match;
    const monthIndex = MONTHS_RO.findIndex((m) => m === monthName.toLowerCase());
    if (monthIndex === -1) return;
    const value = parseFloat(valueStr);
    if (isNaN(value)) return;
    rows.push({
      yearMonth: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      monthLabel: `${monthName} ${year}`,
      value,
    });
  });

  rows.sort((a, b) => (a.yearMonth < b.yearMonth ? -1 : 1));
  return rows;
}

async function fetchLiveHistory() {
  const metaRes = await fetch('/api/inflatie-meta', { headers: { Accept: 'application/json' } });
  if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status} la /api/inflatie-meta`);
  const meta = await metaRes.json();

  const totalOpt = meta.dimensionsMap[0].options.find((o) => o.label.trim() === 'TOTAL');
  const umOpt = meta.dimensionsMap[2].options[0];
  const months = meta.dimensionsMap[1].options.slice(-13); // ~13 luni: suficient pentru grafic + delta
  if (!totalOpt || !umOpt || !months.length) throw new Error('Structură matrice INS neașteptată');

  const encQuery = `${totalOpt.nomItemId}:${months.map((m) => m.nomItemId).join(',')}:${umOpt.nomItemId}`;
  const { matMaxDim, matRegJ, matUMSpec } = meta.details;
  const params = new URLSearchParams({ encQuery, matMaxDim, matRegJ, matUMSpec });

  const pivotRes = await fetch(`/api/inflatie-pivot?${params}`, { headers: { Accept: 'text/plain' } });
  if (!pivotRes.ok) throw new Error(`HTTP ${pivotRes.status} la /api/inflatie-pivot`);
  const csvText = await pivotRes.text();

  const history = parsePivotCsv(csvText);
  if (!history.length) throw new Error('Nu s-au putut extrage date din răspunsul INS');
  return history;
}

export async function getInflationData() {
  let history = null;
  let isFallback = false;

  try {
    history = await fetchLiveHistory();
  } catch (err) {
    console.warn('Nu s-au putut prelua datele live INS. Se utilizează datele de rezervă:', err);
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
