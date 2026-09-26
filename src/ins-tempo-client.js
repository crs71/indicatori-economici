/**
 * ins-tempo-client.js
 * Client generic pentru baza de date INS TEMPO Online, prin proxy-ul propriu
 * (functions/api/ins-meta.js, functions/api/ins-pivot.js). Reutilizat de orice
 * indicator bazat pe INS (inflație, salariu mediu etc.) — vezi
 * project_ins_tempo_api în memoria sesiunii pentru cum a fost descoperit
 * formatul (nedocumentat oficial).
 */

export const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

export function formatMonthYearRo(yearMonth) {
  const [year, month] = yearMonth.split('-');
  return `${MONTHS_RO[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Parsează CSV-ul simplu întors de INS: "TOTAL, Luna iulie 2026, Procente, 108.16"
 * (a doua coloană e mereu numele categoriei selectate, generic, nu doar "TOTAL")
 */
function parsePivotCsv(text) {
  const rows = [];
  const lineRegex = /Luna\s+([a-zăâîșț]+)\s+(\d{4}),\s*[^,]+,\s*([\d.]+)/i;

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

/**
 * Preia o serie lunară dintr-o matrice INS TEMPO, pentru o singură categorie
 * (ex. "TOTAL" sau "TOTAL ECONOMIE"), ultimele `monthsBack` luni disponibile.
 */
export async function fetchInsMonthlySeries({ matCode, categoryLabel, monthsBack = 13 }) {
  const metaRes = await fetch(`/api/ins-meta?matCode=${matCode}`, { headers: { Accept: 'application/json' } });
  if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status} la /api/ins-meta (${matCode})`);
  const meta = await metaRes.json();

  const categoryOpt = meta.dimensionsMap[0].options.find((o) => o.label.trim() === categoryLabel);
  const umOpt = meta.dimensionsMap[2].options[0];
  const months = meta.dimensionsMap[1].options.slice(-monthsBack);
  if (!categoryOpt || !umOpt || !months.length) {
    throw new Error(`Structură matrice INS neașteptată pentru ${matCode}`);
  }

  const encQuery = `${categoryOpt.nomItemId}:${months.map((m) => m.nomItemId).join(',')}:${umOpt.nomItemId}`;
  const { matMaxDim, matRegJ, matUMSpec } = meta.details;
  const params = new URLSearchParams({ matCode, encQuery, matMaxDim, matRegJ, matUMSpec });

  const pivotRes = await fetch(`/api/ins-pivot?${params}`, { headers: { Accept: 'text/plain' } });
  if (!pivotRes.ok) throw new Error(`HTTP ${pivotRes.status} la /api/ins-pivot (${matCode})`);
  const csvText = await pivotRes.text();

  const rows = parsePivotCsv(csvText);
  if (!rows.length) throw new Error(`Nu s-au putut extrage date din răspunsul INS (${matCode})`);
  return rows;
}
