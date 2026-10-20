/**
 * Cache comun pentru proxy-urile spre BNR și INS. Fișierele care încep cu „_"
 * nu devin rute în Cloudflare Pages Functions.
 *
 * De ce: opțiunea `cf: { cacheTtl }` de pe fetch() nu se aplică cererilor POST
 * (deci /api/ins-pivot întreba INS la fiecare vizitator), iar răspunsul unei
 * Functions nu e pus singur în cache-ul CDN. Aici păstrăm explicit, prin Cache
 * API, două copii:
 *   - una „proaspătă", cât spune `ttl`, servită direct, fără drum la sursă;
 *   - una „de rezervă", 30 de zile, servită doar când sursa cade (INS e un
 *     server HTTP pe portul 8077, care nu răspunde mereu). Pagina arată atunci
 *     ultimele date cunoscute în loc de o eroare.
 *
 * Dacă Cache API nu e disponibil, totul merge ca înainte, direct la sursă.
 */
const REZERVA_SECUNDE = 30 * 24 * 3600;

function cheie(request, tip) {
  const url = new URL(request.url);
  url.searchParams.set('__cache', tip);
  return new Request(url.toString(), { method: 'GET' });
}

async function citeste(cache, key) {
  try { return cache ? await cache.match(key) : undefined; } catch { return undefined; }
}

async function scrie(cache, key, body, headers, secunde) {
  if (!cache) return;
  try {
    const h = new Headers(headers);
    h.set('Cache-Control', `public, max-age=${secunde}`);
    await cache.put(key, new Response(body, { status: 200, headers: h }));
  } catch { /* cache indisponibil: nu e o eroare pentru vizitator */ }
}

/**
 * @param context   contextul Functions (are `request` și `waitUntil`)
 * @param ttl       câte secunde e considerat proaspăt răspunsul
 * @param contentType tipul răspunsului de succes
 * @param aduce     async () => Response — cererea spre sursă
 */
export async function cuCache(context, ttl, contentType, aduce) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const proaspat = cheie(context.request, 'proaspat');
  const rezerva = cheie(context.request, 'rezerva');

  const gasit = await citeste(cache, proaspat);
  if (gasit) {
    const r = new Response(gasit.body, gasit);
    r.headers.set('X-Sursa', 'cache');
    return r;
  }

  const headers = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': `public, max-age=${ttl}`,
  };

  let eroare;
  try {
    const upstream = await aduce();
    if (upstream.ok) {
      const body = await upstream.text();
      const salvari = Promise.all([
        scrie(cache, proaspat, body, headers, ttl),
        scrie(cache, rezerva, body, headers, REZERVA_SECUNDE),
      ]);
      if (context.waitUntil) context.waitUntil(salvari); else await salvari;
      return new Response(body, { status: 200, headers: { ...headers, 'X-Sursa': 'live' } });
    }
    eroare = { error: 'Sursa a răspuns cu eroare', status: upstream.status };
  } catch (err) {
    eroare = { error: 'Sursa nu a putut fi contactată', message: String(err) };
  }

  const vechi = await citeste(cache, rezerva);
  if (vechi) {
    const r = new Response(vechi.body, vechi);
    r.headers.set('X-Sursa', 'rezerva');
    // Nu lăsăm browserul să țină minte mult o copie veche.
    r.headers.set('Cache-Control', 'public, max-age=300');
    return r;
  }

  return new Response(JSON.stringify(eroare), {
    status: 502,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export function preflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/** Matricele INS folosite de site. Proxy-ul refuză orice altceva. */
export const MATRICE_INS = new Set(['IPC102E', 'FOM106G', 'AMG157H']);

export function cerereGresita(mesaj) {
  return new Response(JSON.stringify({ error: mesaj }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
