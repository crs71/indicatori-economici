/**
 * Cloudflare Pages Function — proxy + cache pentru metadatele unei matrice INS
 * TEMPO Online (dimensiuni: categorii, luni, unitate de măsură).
 * GET /api/ins-meta?matCode=IPC102E → JSON de la statistici.insse.ro
 *
 * Generic — folosit de orice indicator bazat pe INS (inflație, salariu mediu
 * etc.), ca să nu se dubleze aceeași logică de proxy pentru fiecare matrice.
 *
 * Notă: statistici.insse.ro:8077 nu are HTTPS (deci "mixed content" ar bloca
 * fetch-ul direct din browser oricum) și nu trimite Access-Control-Allow-Origin
 * — verificat manual — deci un proxy e obligatoriu, nu doar o chestiune de CORS.
 */
export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const matCode = searchParams.get('matCode');

  if (!matCode || !/^[A-Z0-9]+$/i.test(matCode)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid matCode param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const INS_URL = `http://statistici.insse.ro:8077/tempo-ins/matrix/${matCode}`;

  try {
    const upstream = await fetch(INS_URL, {
      headers: {
        'User-Agent': 'indicatori-economici/1.0 (Cloudflare Pages Function)',
        Accept: 'application/json',
      },
      cf: { cacheTtl: 21600, cacheEverything: true },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: 'INS upstream failed', status: upstream.status }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const body = await upstream.text();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=21600',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
