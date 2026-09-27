/**
 * Cloudflare Pages Function — proxy + cache pentru rata dobânzii de politică
 * monetară a BNR (serie istorică, din 2003).
 * GET /api/dobanda → XML de la www.bnr.ro/idbfiles?cid=605...
 */
export async function onRequestGet(context) {
  const BNR_URL = 'https://www.bnr.ro/idbfiles?cid=605&dfrom=&dto=&period=all&format=XML';

  try {
    const upstream = await fetch(BNR_URL, {
      headers: {
        'User-Agent': 'indicatori-economici/1.0 (Cloudflare Pages Function)',
        Accept: 'application/xml, text/xml, */*',
      },
      // seria se schimbă doar la ședințele CA ale BNR, nu zilnic — cache mai lung
      cf: { cacheTtl: 21600, cacheEverything: true },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: 'BNR upstream failed', status: upstream.status }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const body = await upstream.text();

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=21600',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: String(err) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
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
