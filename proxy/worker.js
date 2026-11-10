// 웹 버전에서 실시간 시세를 바로바로 받기 위한 작은 중계 서버 (Cloudflare Workers 무료 요금제로 충분해요).
// 브라우저는 보안 정책(CORS) 때문에 네이버·Yahoo에 직접 물어볼 수 없어서, 이 Worker가 대신 받아 전달해요.
// 정해진 두 주소만 중계하고, 결과는 2초 동안 캐시해서 요청이 몰려도 원래 사이트에 부담이 적어요.
//
// 사용법: proxy/README.md 참고. 배포한 주소를 src/data/useLiveQuotes.ts 의 LIVE_PROXY 에 넣으면 끝.
//   GET /naver?codes=005930,000660   → 네이버 국내 실시간 시세
//   GET /yahoo?symbol=AAPL            → Yahoo 1일 차트 (현재가 + 오늘 5분봉)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=2',
};

function json(body, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  });
}

export default {
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    let target;
    let headers = { 'User-Agent': UA, Accept: 'application/json' };

    if (url.pathname === '/naver') {
      const codes = (url.searchParams.get('codes') ?? '').split(',').filter((c) => /^\d{6}$/.test(c)).slice(0, 20);
      if (!codes.length) return json({ error: 'codes 필요' }, 400);
      target = `https://polling.finance.naver.com/api/realtime/domestic/stock/${codes.join(',')}`;
      headers.Referer = 'https://m.stock.naver.com/';
    } else if (url.pathname === '/yahoo') {
      const sym = url.searchParams.get('symbol') ?? '';
      if (!/^[A-Z0-9.^=-]{1,12}$/.test(sym)) return json({ error: 'symbol 필요' }, 400);
      target = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=5m&includePrePost=false`;
    } else {
      return json({ ok: true, routes: ['/naver?codes=005930', '/yahoo?symbol=AAPL'] });
    }

    const cache = caches.default;
    const key = new Request(target);
    const hit = await cache.match(key);
    if (hit) return json(await hit.text());

    const res = await fetch(target, { headers });
    const text = await res.text();
    if (!res.ok) return json({ error: `원본 HTTP ${res.status}` }, 502);
    ctx.waitUntil(cache.put(key, new Response(text, { headers: { 'Cache-Control': 'max-age=2' } })));
    return json(text);
  },
};
