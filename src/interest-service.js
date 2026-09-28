/**
 * interest-service.js
 * Preluare, parsare și calcul pentru rata dobânzii de politică monetară BNR
 * (serie istorică din 2003, cu o intrare la fiecare schimbare de decizie CA — nu zilnică).
 */

// Date oficiale de rezervă (cotate real de BNR) în cazul în care conexiunea este offline
const FALLBACK_HISTORY = [
  { date: '2020-08-06', dpm: 1.50, dfc: 2.00, dfd: 1.00 },
  { date: '2021-01-18', dpm: 1.25, dfc: 1.75, dfd: 0.75 },
  { date: '2021-10-06', dpm: 1.50, dfc: 2.00, dfd: 1.00 },
  { date: '2021-11-10', dpm: 1.75, dfc: 2.50, dfd: 1.00 },
  { date: '2022-01-11', dpm: 2.00, dfc: 3.00, dfd: 1.00 },
  { date: '2022-02-10', dpm: 2.50, dfc: 3.50, dfd: 1.50 },
  { date: '2022-04-06', dpm: 3.00, dfc: 4.00, dfd: 2.00 },
  { date: '2022-05-11', dpm: 3.75, dfc: 4.75, dfd: 2.75 },
  { date: '2022-07-07', dpm: 4.75, dfc: 5.75, dfd: 3.75 },
  { date: '2022-08-08', dpm: 5.50, dfc: 6.50, dfd: 4.50 },
  { date: '2022-10-06', dpm: 6.25, dfc: 7.25, dfd: 5.25 },
  { date: '2022-11-09', dpm: 6.75, dfc: 7.75, dfd: 5.75 },
  { date: '2023-01-11', dpm: 7.00, dfc: 8.00, dfd: 6.00 },
  { date: '2024-07-08', dpm: 6.75, dfc: 7.75, dfd: 5.75 },
  { date: '2024-08-08', dpm: 6.50, dfc: 7.50, dfd: 5.50 },
];

/**
 * Convertește o dată DD.MM.YYYY (format BNR) în ISO YYYY-MM-DD
 */
function toIsoDate(dmyString) {
  const [day, month, year] = dmyString.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Convertește un număr cu virgulă zecimală românească ("6,50") în float
 */
function parseRoNumber(str) {
  if (!str) return NaN;
  return parseFloat(str.trim().replace(',', '.'));
}

/**
 * Parsează XML-ul "Ratele dobânzilor BNR" (idbfiles, cid=605)
 */
function parseInterestXml(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const rows = xmlDoc.getElementsByTagName('Row');
  const history = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateEl = row.getElementsByTagName('Data')[0];
    if (!dateEl?.textContent) continue;

    const dpmEl = row.getElementsByTagName('BNRDOBO_DPM')[0];
    const dfcEl = row.getElementsByTagName('BNRDOBO_DFC')[0];
    const dfdEl = row.getElementsByTagName('BNRDOBO_DFD')[0];

    const dpm = parseRoNumber(dpmEl?.textContent);
    if (isNaN(dpm)) continue;

    history.push({
      date: toIsoDate(dateEl.textContent.trim()),
      dpm,
      dfc: parseRoNumber(dfcEl?.textContent),
      dfd: parseRoNumber(dfdEl?.textContent),
    });
  }

  if (history.length === 0) {
    throw new Error('Nu s-au putut extrage ratele dobânzii din XML-ul BNR');
  }

  history.sort((a, b) => new Date(a.date) - new Date(b.date));
  return history;
}

export function formatDateRo(isoString) {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-');
  const monthsRo = [
    'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
  ];
  return `${parseInt(day, 10)} ${monthsRo[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Preluare + calcul: rata curentă, rata anterioară (înainte de ultima schimbare),
 * și seria completă pentru graficul „în trepte".
 */
export async function getInterestRateData() {
  let history = null;
  let isFallback = false;

  try {
    const res = await fetch('/api/dobanda', {
      headers: { Accept: 'application/xml, text/xml' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} la /api/dobanda`);
    const xmlText = await res.text();
    history = parseInterestXml(xmlText);
  } catch (err) {
    console.warn('Nu s-au putut prelua ratele dobânzii BNR. Se utilizează datele de rezervă:', err);
    history = [...FALLBACK_HISTORY];
    isFallback = true;
  }

  const n = history.length;
  const current = history[n - 1];
  const previous = n > 1 ? history[n - 2] : current;
  const delta = current.dpm - previous.dpm;
  const daysSinceChange = Math.max(0, Math.floor((Date.now() - new Date(current.date)) / 86400000));

  return {
    isFallback,
    current,
    previous,
    delta,
    daysSinceChange,
    currentDateFormatted: formatDateRo(current.date),
    previousDateFormatted: formatDateRo(previous.date),
    history,
  };
}
