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
// INS poate accepta conexiunea și apoi nu răspunde deloc (observat direct în
// sesiune — nu doar erori rapide). Fără timeout explicit, fetch() ar aștepta
// la nesfârșit, iar UI-ul ar rămâne blocat pe "Se încarcă..." în loc să treacă
// pe datele de rezervă.
const FETCH_TIMEOUT_MS = 10000;

export async function fetchInsMonthlySeries({ matCode, categoryLabel, monthsBack = 13 }) {
  const metaRes = await fetch(`/api/ins-meta?matCode=${matCode}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
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

  const pivotRes = await fetch(`/api/ins-pivot?${params}`, {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!pivotRes.ok) throw new Error(`HTTP ${pivotRes.status} la /api/ins-pivot (${matCode})`);
  const csvText = await pivotRes.text();

  const rows = parsePivotCsv(csvText);
  if (!rows.length) throw new Error(`Nu s-au putut extrage date din răspunsul INS (${matCode})`);
  return rows;
}

/**
 * Variantă pentru matrici INS cu mai multe dimensiuni de categorie înainte de
 * cea de luni — de ex. rata șomajului BIM (AMG157H), care are simultan
 * "grupe de vârstă" ȘI "sexe" ca dimensiuni separate, nu doar una ca la
 * inflație/salariu. `categoryLabels` conține eticheta de ales pentru fiecare
 * dimensiune de categorie, în ordinea din `meta.dimensionsMap` — dimensiunea
 * de luni e detectată automat (opțiuni de forma "Luna ..."), la fel și cea
 * de unitate de măsură, dacă are o singură opțiune posibilă.
 */
export async function fetchInsMonthlySeriesMulti({ matCode, categoryLabels, monthsBack = 13 }) {
  const metaRes = await fetch(`/api/ins-meta?matCode=${matCode}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status} la /api/ins-meta (${matCode})`);
  const meta = await metaRes.json();

  const dims = meta.dimensionsMap;
  const monthsDimIndex = dims.findIndex((d) => d.options.some((o) => /^Luna\s/i.test(o.label.trim())));
  if (monthsDimIndex === -1) throw new Error(`Nu s-a găsit dimensiunea de luni pentru ${matCode}`);
  const months = dims[monthsDimIndex].options.slice(-monthsBack);
  if (!months.length) throw new Error(`Structură matrice INS neașteptată pentru ${matCode}`);

  let labelIdx = 0;
  const dimSelections = dims.map((dim, i) => {
    if (i === monthsDimIndex) return months.map((m) => m.nomItemId).join(',');
    if (dim.options.length === 1) return dim.options[0].nomItemId;
    const label = categoryLabels[labelIdx++];
    const opt = dim.options.find((o) => o.label.trim() === label);
    if (!opt) throw new Error(`Categoria "${label}" nu există în dimensiunea "${dim.label}" (${matCode})`);
    return opt.nomItemId;
  });

  const encQuery = dimSelections.join(':');
  const { matMaxDim, matRegJ, matUMSpec } = meta.details;
  const params = new URLSearchParams({ matCode, encQuery, matMaxDim, matRegJ, matUMSpec });

  const pivotRes = await fetch(`/api/ins-pivot?${params}`, {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!pivotRes.ok) throw new Error(`HTTP ${pivotRes.status} la /api/ins-pivot (${matCode})`);
  const csvText = await pivotRes.text();

  const rows = parsePivotCsv(csvText);
  if (!rows.length) throw new Error(`Nu s-au putut extrage date din răspunsul INS (${matCode})`);
  return rows;
}
