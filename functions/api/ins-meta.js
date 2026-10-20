/**
 * Cloudflare Pages Function — proxy + cache pentru metadatele unei matrice INS
 * TEMPO Online (dimensiuni: categorii, luni, unitate de măsură).
 * GET /api/ins-meta?matCode=IPC102E → JSON de la statistici.insse.ro
 *
 * statistici.insse.ro:8077 nu are HTTPS (deci „mixed content" ar bloca fetch-ul
 * direct din browser) și nu trimite Access-Control-Allow-Origin, deci proxy-ul
 * e obligatoriu. Acceptă doar matricele folosite de site (MATRICE_INS), ca să nu
 * fie un proxy deschis spre INS pentru oricine.
 */
import { cuCache, preflight, MATRICE_INS, cerereGresita } from '../_cache.js';

export function onRequestGet(context) {
  const matCode = new URL(context.request.url).searchParams.get('matCode');
  if (!matCode || !MATRICE_INS.has(matCode)) return cerereGresita('matCode lipsă sau nepermis');

  const INS_URL = `http://statistici.insse.ro:8077/tempo-ins/matrix/${matCode}`;
  return cuCache(context, 21600, 'application/json; charset=utf-8', () =>
    fetch(INS_URL, {
      headers: {
        'User-Agent': 'indicatori-economici/1.0 (Cloudflare Pages Function)',
        Accept: 'application/json',
      },
    })
  );
}

export const onRequestOptions = preflight;
