/**
 * BNR FX rates service — fetch 10-day XML, parse EUR/RON series, offline fallback.
 */

const BNR_LIVE = '/api/curs';
const FALLBACK_SERIES = [
  // Approximate sample so the story works offline / when BNR is down
  { date: '2026-09-11', rate: 4.9751 },
  { date: '2026-09-12', rate: 4.9768 },
  { date: '2026-09-13', rate: 4.9742 },
  { date: '2026-09-14', rate: 4.9789 },
  { date: '2026-09-15', rate: 4.9810 },
  { date: '2026-09-16', rate: 4.9795 },
  { date: '2026-09-17', rate: 4.9822 },
  { date: '2026-09-18', rate: 4.9840 },
  { date: '2026-09-19', rate: 4.9801 },
  { date: '2026-09-20', rate: 4.9775 },
];

/**
 * @typedef {{ date: string, rate: number }} RatePoint
 * @typedef {{
 *   series: RatePoint[],
 *   first: RatePoint,
 *   last: RatePoint,
 *   min: RatePoint,
 *   max: RatePoint,
 *   changeAbs: number,
 *   changePct: number,
 *   source: 'bnr' | 'fallback'
 * }} RateSummary
 */

/**
 * Parse BNR 10-day XML into EUR/RON daily rates (oldest → newest).
 * @param {string} xmlText
 * @returns {RatePoint[]}
 */
export function parseBnrXml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid BNR XML');
  }

  const cubes = Array.from(doc.querySelectorAll('Cube[date]'));
  /** @type {RatePoint[]} */
  const points = [];

  for (const cube of cubes) {
    const date = cube.getAttribute('date');
    if (!date) continue;
    const rateNode = cube.querySelector('Rate[currency="EUR"]');
    if (!rateNode) continue;
    const rate = parseFloat(rateNode.textContent || '');
    if (!Number.isFinite(rate)) continue;
    points.push({ date, rate });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

/**
 * @param {RatePoint[]} series
 * @param {'bnr' | 'fallback'} source
 * @returns {RateSummary}
 */
export function summarizeSeries(series, source) {
  if (!series.length) {
    throw new Error('Empty rate series');
  }
  const first = series[0];
  const last = series[series.length - 1];
  let min = first;
  let max = first;
  for (const p of series) {
    if (p.rate < min.rate) min = p;
    if (p.rate > max.rate) max = p;
  }
  const changeAbs = last.rate - first.rate;
  const changePct = first.rate !== 0 ? (changeAbs / first.rate) * 100 : 0;
  return { series, first, last, min, max, changeAbs, changePct, source };
}

/**
 * Load rates: try live BNR via /api/curs, fall back to embedded sample.
 * @returns {Promise<RateSummary>}
 */
export async function loadRates() {
  try {
    const res = await fetch(BNR_LIVE, {
      headers: { Accept: 'application/xml, text/xml, */*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const series = parseBnrXml(xml);
    if (series.length < 2) throw new Error('Too few points');
    return summarizeSeries(series, 'bnr');
  } catch (err) {
    console.warn('[bnr-service] live fetch failed, using fallback', err);
    return summarizeSeries(FALLBACK_SERIES.map((p) => ({ ...p })), 'fallback');
  }
}

/**
 * Format RON amount for display (ro-RO).
 * @param {number} n
 * @param {number} [digits=4]
 */
export function formatRon(n, digits = 4) {
  return n.toLocaleString('ro-RO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Format percent with sign.
 * @param {number} pct
 * @param {number} [digits=2]
 */
export function formatPct(pct, digits = 2) {
  const sign = pct > 0 ? '+' : '';
  return sign + pct.toLocaleString('ro-RO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) + '%';
}
