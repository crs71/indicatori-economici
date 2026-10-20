/**
 * Cloudflare Pages Function — proxy pentru interogarea de date INS TEMPO Online.
 * GET /api/ins-pivot?matCode=...&encQuery=...&matMaxDim=...&matRegJ=...&matUMSpec=...
 * → CSV simplu de la statistici.insse.ro/tempo-ins/pivot (endpoint intern, cere
 * POST cu JSON — expus aici ca GET, ca răspunsul să poată fi pus în cache).
 *
 * Format descoperit prin reverse-engineering (biblioteca open-source tempo.py,
 * github.com/mark-veres/tempo.py) — nu există documentație oficială publică.
 *
 * Cache explicit (vezi _cache.js): fiind POST spre sursă, `cf: { cacheTtl }` nu
 * se aplica, deci înainte fiecare vizitator aștepta după serverul INS.
 */
import { cuCache, preflight, MATRICE_INS, cerereGresita } from '../_cache.js';

export function onRequestGet(context) {
  const searchParams = new URL(context.request.url).searchParams;
  const matCode = searchParams.get('matCode');
  const encQuery = searchParams.get('encQuery');
  const matMaxDim = Number(searchParams.get('matMaxDim') || 3);
  const matRegJ = Number(searchParams.get('matRegJ') || 0);
  const matUMSpec = Number(searchParams.get('matUMSpec') || 0);

  if (!matCode || !MATRICE_INS.has(matCode)) return cerereGresita('matCode lipsă sau nepermis');
  if (!encQuery || encQuery.length > 4000) return cerereGresita('encQuery lipsă sau prea lung');
  if (![matMaxDim, matRegJ, matUMSpec].every(Number.isFinite)) return cerereGresita('parametri numerici invalizi');

  return cuCache(context, 21600, 'text/plain; charset=utf-8', () =>
    fetch('http://statistici.insse.ro:8077/tempo-ins/pivot', {
      method: 'POST',
      headers: {
        'User-Agent': 'indicatori-economici/1.0 (Cloudflare Pages Function)',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encQuery, language: 'ro', matCode, matMaxDim, matRegJ, matUMSpec }),
    })
  );
}

export const onRequestOptions = preflight;
