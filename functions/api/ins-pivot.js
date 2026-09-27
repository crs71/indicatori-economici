/**
 * Cloudflare Pages Function — proxy pentru interogarea de date INS TEMPO Online.
 * GET /api/ins-pivot?matCode=...&encQuery=...&matMaxDim=...&matRegJ=...&matUMSpec=...
 * → CSV simplu de la statistici.insse.ro/tempo-ins/pivot (endpoint intern, cere
 * POST cu JSON — expus aici ca GET cu query params, ca răspunsul să poată fi
 * cache-uit normal de CDN, indiferent de metoda folosită de INS pe dinăuntru).
 *
 * Generic — folosit de orice indicator bazat pe INS. Format descoperit prin
 * reverse-engineering (biblioteca open-source tempo.py,
 * github.com/mark-veres/tempo.py) — nu există documentație oficială publică
 * pentru acest endpoint.
 */
export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const matCode = searchParams.get('matCode');
  const encQuery = searchParams.get('encQuery');
  const matMaxDim = Number(searchParams.get('matMaxDim') || 3);
  const matRegJ = Number(searchParams.get('matRegJ') || 0);
  const matUMSpec = Number(searchParams.get('matUMSpec') || 0);

  if (!matCode || !/^[A-Z0-9]+$/i.test(matCode) || !encQuery) {
    return new Response(JSON.stringify({ error: 'Missing matCode or encQuery param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const INS_URL = 'http://statistici.insse.ro:8077/tempo-ins/pivot';

  try {
    const upstream = await fetch(INS_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'indicatori-economici/1.0 (Cloudflare Pages Function)',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encQuery,
        language: 'ro',
        matCode,
        matMaxDim,
        matRegJ,
        matUMSpec,
      }),
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
        'Content-Type': 'text/plain; charset=utf-8',
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
