/**
 * Cloudflare Pages Function — proxy + cache pentru rata dobânzii de politică
 * monetară a BNR (serie istorică, din 2003).
 * GET /api/dobanda → XML de la www.bnr.ro/idbfiles?cid=605...
 * Seria se schimbă doar la ședințele CA ale BNR, deci 6 ore de cache proaspăt.
 */
import { cuCache, preflight } from '../_cache.js';

const BNR_URL = 'https://www.bnr.ro/idbfiles?cid=605&dfrom=&dto=&period=all&format=XML';

export function onRequestGet(context) {
  return cuCache(context, 21600, 'application/xml; charset=utf-8', () =>
    fetch(BNR_URL, {
      headers: {
        'User-Agent': 'indicatori-economici/1.0 (Cloudflare Pages Function)',
        Accept: 'application/xml, text/xml, */*',
      },
    })
  );
}

export const onRequestOptions = preflight;
