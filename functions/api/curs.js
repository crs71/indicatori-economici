/**
 * Cloudflare Pages Function — proxy + cache pentru cursul BNR (10 zile).
 * GET /api/curs → XML de la curs.bnr.ro/nbrfxrates10days.xml
 * Cache: o oră proaspăt, 30 de zile ca rezervă când BNR nu răspunde (vezi _cache.js).
 */
import { cuCache, preflight } from '../_cache.js';

const BNR_URL = 'https://curs.bnr.ro/nbrfxrates10days.xml';

export function onRequestGet(context) {
  return cuCache(context, 3600, 'application/xml; charset=utf-8', () =>
    fetch(BNR_URL, {
      headers: {
        'User-Agent': 'indicatori-economici/1.0 (Cloudflare Pages Function)',
        Accept: 'application/xml, text/xml, */*',
      },
    })
  );
}

export const onRequestOptions = preflight;
