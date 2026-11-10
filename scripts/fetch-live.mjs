// 장중 현재가를 모아 data/live.json 으로 저장합니다 (.github/workflows/live-quotes.yml 이 5분마다 실행).
//   - 국내: 네이버 증권 실시간 시세 (여러 종목 한 번에)
//   - 해외/보조: Yahoo Finance 1일 차트 (오늘 5분봉 + 현재가)
// API 키는 필요 없습니다.

import { mkdir, writeFile } from 'node:fs/promises';
import { KR, US } from './universe.mjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const OUT = new URL('../data/live.json', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (s) => {
  if (s == null) return null;
  const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

async function get(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// 브라우저(웹 버전)에서 직접 부를 수 있는 주소인지 확인용 로그
async function probeCors(label, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Origin: 'https://realsalmon12.github.io' } });
    console.log(`[cors] ${label}: HTTP ${res.status}, allow-origin=${res.headers.get('access-control-allow-origin')}`);
  } catch (e) {
    console.log(`[cors] ${label}: 실패 ${e.message}`);
  }
}

// ---------- 국내: 네이버 ----------
async function naverBatch(codes) {
  const res = await get(`https://polling.finance.naver.com/api/realtime/domestic/stock/${codes.join(',')}`, {
    Referer: 'https://m.stock.naver.com/',
  });
  const j = await res.json();
  const list = j.datas ?? j.result?.areas?.[0]?.datas ?? [];
  if (list.length === 0) console.log('[naver] 응답 형식:', JSON.stringify(j).slice(0, 500));
  const out = {};
  for (const d of list) {
    const code = d.itemCode ?? d.cd;
    const price = num(d.closePriceRaw ?? d.closePrice ?? d.nv);
    if (!code || price == null) continue;
    let pct = num(d.fluctuationsRatioRaw ?? d.fluctuationsRatio ?? d.cr);
    const dir = d.compareToPreviousPrice?.name ?? d.compareToPreviousPrice?.code;
    if (pct != null && /FALL|LOWER_LIMIT|5|4/.test(String(dir)) && pct > 0) pct = -pct;
    out[code] = {
      price,
      changePct: pct,
      state: d.marketStatus ?? null, // OPEN / CLOSE / PREOPEN 등
      t: d.localTradedAt ? Date.parse(d.localTradedAt) / 1000 : null,
      src: 'naver',
    };
  }
  return out;
}

// ---------- Yahoo 1일 차트 ----------
async function yahooDay(symbol) {
  const res = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m&includePrePost=false`);
  const j = await res.json();
  const r = j.chart?.result?.[0];
  if (!r) throw new Error('차트 없음');
  const m = r.meta ?? {};
  const closes = (r.indicators?.quote?.[0]?.close ?? []).filter((v) => v != null);
  const prev = m.chartPreviousClose ?? m.previousClose;
  const price = m.regularMarketPrice ?? closes[closes.length - 1];
  const now = Date.now() / 1000;
  const p = m.currentTradingPeriod?.regular;
  const open = p ? now >= p.start && now <= p.end : null;
  return {
    price,
    changePct: prev ? (price / prev - 1) * 100 : null,
    prevClose: prev ?? null,
    state: open == null ? null : open ? 'OPEN' : 'CLOSE',
    t: m.regularMarketTime ?? null,
    intraday: closes.map((v) => Math.round(v * 100) / 100),
    src: 'yahoo',
  };
}

const quotes = {};

// 국내: 네이버로 현재가, Yahoo로 오늘 흐름
let naver = {};
try {
  for (let i = 0; i < KR.length; i += 20) {
    Object.assign(naver, await naverBatch(KR.slice(i, i + 20).map((s) => s.code)));
  }
  console.log(`[naver] ${Object.keys(naver).length}개`);
} catch (e) {
  console.warn('[naver] 실패, Yahoo만 사용:', e.message);
}
for (const s of KR) {
  let y = null;
  try {
    y = await yahooDay(s.yahoo);
  } catch (e) {
    console.warn(`[${s.code}] yahoo 실패: ${e.message}`);
  }
  const n = naver[s.code];
  if (!n && !y) continue;
  quotes[`KR:${s.code}`] = { ...(y ?? {}), ...(n ?? {}), intraday: y?.intraday ?? [] };
  await sleep(150);
}

for (const s of US) {
  try {
    quotes[`US:${s.code}`] = await yahooDay(s.yahoo);
  } catch (e) {
    console.warn(`[${s.code}] yahoo 실패: ${e.message}`);
  }
  await sleep(150);
}

await probeCors('naver polling', 'https://polling.finance.naver.com/api/realtime/domestic/stock/005930');
await probeCors('yahoo chart', 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=5m');

// 웹용 중계 서버(Cloudflare Worker)가 잘 동작하는지 확인
const PROXY = 'https://stock-helper-proxy.xmfhfhfl.workers.dev';
for (const path of ['/', '/naver?codes=005930', '/yahoo?symbol=AAPL']) {
  try {
    const res = await fetch(PROXY + path, { headers: { Origin: 'https://realsalmon12.github.io' } });
    const text = await res.text();
    console.log(`[proxy] ${path}: HTTP ${res.status}, allow-origin=${res.headers.get('access-control-allow-origin')}, ${text.slice(0, 160)}`);
  } catch (e) {
    console.log(`[proxy] ${path}: 실패 ${e.message} ${e.cause?.code ?? ''} ${e.cause?.message ?? ''}`);
  }
}

const n = Object.keys(quotes).length;
if (n < 20) {
  console.error(`현재가가 너무 적게 모였어요 (${n}개). 저장하지 않습니다.`);
  process.exit(1);
}
for (const q of Object.values(quotes)) {
  if (q.price != null) q.price = Math.round(q.price * 100) / 100;
  if (q.changePct != null) q.changePct = Math.round(q.changePct * 100) / 100;
}
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), quotes }) + '\n');
const sample = quotes['KR:005930'];
console.log(`저장 완료: ${n}개`, sample ? `삼성전자 ${sample.price} (${sample.changePct}%, ${sample.state}, ${sample.src})` : '');
