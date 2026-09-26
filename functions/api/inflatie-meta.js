/**
 * Cloudflare Pages Function — proxy + cache pentru metadatele matricei INS
 * IPC102E (indicii prețurilor de consum, evoluție lunară față de anul precedent).
 * GET /api/inflatie-meta → JSON de la statistici.insse.ro (TEMPO Online), care
 * conține dimensiunile matricei (categorii, luni, unitate de măsură) necesare
 * pentru a construi interogarea către /api/inflatie-pivot.
 *
 * Notă: statistici.insse.ro:8077 nu are HTTPS (deci "mixed content" ar bloca
 * fetch-ul direct din browser oricum) și nu trimite Access-Control-Allow-Origin
 * — verificat manual — deci un proxy e obligatoriu, nu doar o chestiune de CORS.
 */
export async function onRequestGet() {
  const INS_URL = 'http://statistici.insse.ro:8077/tempo-ins/matrix/IPC102E';

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
