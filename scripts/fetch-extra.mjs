// 종목별 "전망"과 "반응" 정보를 모읍니다. API 키 없이 공개된 주소만 씁니다.
//   - 전망: Yahoo Finance 애널리스트 의견 분포, 목표가 범위, 실적 전망, 최근 투자의견 변경
//   - 뉴스: 네이버 증권(국내), Yahoo Finance(해외)
//   - 투자자 반응: 네이버 종목토론(국내), StockTwits(해외)
// 어느 하나가 실패해도 나머지는 그대로 저장합니다.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

let debugLeft = 4;
function debug(label, data) {
  if (debugLeft <= 0) return;
  debugLeft--;
  console.log(`[debug] ${label}:`, JSON.stringify(data)?.slice(0, 700));
}

async function get(url, headers = {}, type = 'json') {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*', ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return type === 'json' ? res.json() : res.text();
}

const raw = (v) => (v && typeof v === 'object' && 'raw' in v ? v.raw : typeof v === 'number' ? v : null);
const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);

// ---------- 전망 (Yahoo quoteSummary) ----------
export async function fetchOutlook(symbol, auth) {
  if (!auth) return null;
  const modules = 'financialData,recommendationTrend,earningsTrend,upgradeDowngradeHistory';
  const j = await get(
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(auth.crumb)}`,
    { Cookie: auth.cookie },
  );
  const q = j.quoteSummary?.result?.[0];
  if (!q) return null;
  const fd = q.financialData ?? {};
  const now = q.recommendationTrend?.trend?.find((t) => t.period === '0m') ?? q.recommendationTrend?.trend?.[0];
  const et = q.earningsTrend?.trend ?? [];
  const yr = (p) => et.find((t) => t.period === p);
  const pct = (v) => (v == null ? null : r2(v * 100));
  const cutoff = Date.now() / 1000 - 120 * 86400;
  const changes = (q.upgradeDowngradeHistory?.history ?? [])
    .filter((h) => h.epochGradeDate >= cutoff)
    .slice(0, 6)
    .map((h) => ({ firm: h.firm, action: h.action, from: h.fromGrade || null, to: h.toGrade || null, t: h.epochGradeDate }));

  return {
    targetMean: r2(raw(fd.targetMeanPrice)),
    targetHigh: r2(raw(fd.targetHighPrice)),
    targetLow: r2(raw(fd.targetLowPrice)),
    analysts: raw(fd.numberOfAnalystOpinions),
    recKey: fd.recommendationKey ?? null,
    recMean: r2(raw(fd.recommendationMean)),
    votes: now
      ? { strongBuy: now.strongBuy ?? 0, buy: now.buy ?? 0, hold: now.hold ?? 0, sell: now.sell ?? 0, strongSell: now.strongSell ?? 0 }
      : null,
    epsGrowthThisYear: pct(raw(yr('0y')?.growth)),
    epsGrowthNextYear: pct(raw(yr('+1y')?.growth)),
    revGrowthNextYear: pct(raw(yr('+1y')?.revenueEstimate?.growth)),
    changes,
  };
}

// ---------- 뉴스 ----------
const POS = [
  '상승', '급등', '최고', '신고가', '호실적', '흑자', '수주', '성장', '돌파', '강세', '기대', '확대', '개선', '증가', '상향', '매수', '반등', '사상 최대', '최대 실적',
  'beat', 'beats', 'surge', 'soar', 'jump', 'rally', 'record', 'upgrade', 'raises', 'growth', 'strong', 'gain', 'buy', 'bullish', 'outperform', 'tops',
];
const NEG = [
  '하락', '급락', '최저', '신저가', '적자', '부진', '우려', '감소', '약세', '하향', '매도', '리스크', '소송', '악재', '쇼크', '충격', '손실', '경고', '둔화',
  'miss', 'misses', 'plunge', 'fall', 'falls', 'drop', 'slump', 'downgrade', 'cuts', 'weak', 'loss', 'lawsuit', 'probe', 'sell', 'bearish', 'warning', 'concern', 'risk',
];
export function tone(text) {
  const t = String(text).toLowerCase();
  let s = 0;
  for (const w of POS) if (t.includes(w)) s++;
  for (const w of NEG) if (t.includes(w)) s--;
  return s > 0 ? 1 : s < 0 ? -1 : 0;
}

function stripTags(s) {
  return String(s ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .trim();
}

function naverTime(s) {
  // "202611101530" 또는 "2026-11-10T15:30:00" 같은 형식
  if (!s) return null;
  const d = String(s);
  if (/^\d{12}$/.test(d)) return Date.parse(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(8, 10)}:${d.slice(10, 12)}:00+09:00`) / 1000;
  const p = Date.parse(d);
  return Number.isFinite(p) ? p / 1000 : null;
}

async function newsNaver(code) {
  const j = await get(`https://m.stock.naver.com/api/news/stock/${code}?pageSize=10&page=1`, { Referer: 'https://m.stock.naver.com/' });
  debug(`naver news ${code}`, j);
  const groups = Array.isArray(j) ? j : (j.items ?? j.result ?? []);
  const items = groups.flatMap((g) => (Array.isArray(g.items) ? g.items : [g]));
  return items
    .map((it) => {
      const office = it.officeId ?? it.oid;
      const article = it.articleId ?? it.aid;
      return {
        title: stripTags(it.title ?? it.titleFull),
        source: it.officeName ?? it.office ?? '네이버 뉴스',
        url: it.mobileNewsUrl ?? it.linkUrl ?? (office && article ? `https://n.news.naver.com/mnews/article/${office}/${article}` : null),
        t: naverTime(it.datetime ?? it.dt ?? it.date),
      };
    })
    .filter((n) => n.title && n.url);
}

async function newsYahoo(symbol) {
  const j = await get(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=10`);
  return (j.news ?? [])
    .filter((n) => !n.relatedTickers || n.relatedTickers.includes(symbol))
    .map((n) => ({ title: n.title, source: n.publisher, url: n.link, t: n.providerPublishTime ?? null }))
    .filter((n) => n.title && n.url);
}

export async function fetchNews(market, code, symbol) {
  let list = [];
  try {
    list = market === 'KR' ? await newsNaver(code) : await newsYahoo(symbol);
  } catch (e) {
    console.warn(`[${code}] 뉴스 실패: ${e.message}`);
  }
  if (list.length === 0 && market === 'KR') {
    try {
      list = await newsYahoo(symbol);
    } catch {}
  }
  const seen = new Set();
  return list
    .filter((n) => (seen.has(n.title) ? false : seen.add(n.title)))
    .slice(0, 6)
    .map((n) => ({ ...n, tone: tone(n.title) }));
}

// ---------- 투자자 반응 ----------
async function crowdStocktwits(symbol) {
  const j = await get(`https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(symbol)}.json`);
  const msgs = j.messages ?? [];
  let bull = 0,
    bear = 0;
  for (const m of msgs) {
    const s = m.entities?.sentiment?.basic;
    if (s === 'Bullish') bull++;
    else if (s === 'Bearish') bear++;
  }
  return {
    source: 'StockTwits',
    posts: msgs.length,
    bull,
    bear,
    watchers: j.symbol?.watchlist_count ?? null,
    method: '글쓴이가 직접 고른 상승(Bullish)/하락(Bearish) 표시',
  };
}

async function crowdNaver(code) {
  const url = `https://m.stock.naver.com/front-api/discussion/list?discussionType=domesticStock&itemCode=${code}&isHolderOnly=false&excludesItemNews=false&isItemNewsOnly=false&isCleanbotPassedOnly=true&pageSize=40`;
  const j = await get(url, { Referer: `https://m.stock.naver.com/domestic/stock/${code}/discussion` });
  debug(`naver discussion ${code}`, j);
  const posts = j.result?.posts ?? j.posts ?? j.result ?? [];
  if (!Array.isArray(posts) || posts.length === 0) throw new Error('토론 글 없음');
  let bull = 0,
    bear = 0,
    holders = 0;
  for (const p of posts) {
    const t = tone(`${p.title ?? ''} ${p.contentSwReplaced ?? p.contents ?? ''}`);
    if (t > 0) bull++;
    else if (t < 0) bear++;
    if (p.isHolderVerified || p.holderVerified) holders++;
  }
  return {
    source: '네이버 종목토론',
    posts: posts.length,
    bull,
    bear,
    holders,
    method: '최근 글 제목·내용의 낙관/비관 단어를 세어 분류',
  };
}

export async function fetchCrowd(market, code, symbol) {
  try {
    return market === 'KR' ? await crowdNaver(code) : await crowdStocktwits(symbol);
  } catch (e) {
    console.warn(`[${code}] 투자자 반응 실패: ${e.message}`);
    return null;
  }
}
