// 시세와 재무 데이터를 모아 data/market.json 으로 저장하는 스크립트입니다.
// GitHub Actions에서 하루 두 번 실행됩니다 (.github/workflows/update-data.yml).
// API 키 없이 쓸 수 있는 공개 데이터만 사용합니다.
//   - Yahoo Finance: 1년치 일별 종가, 재무 지표 (한국/미국 공통)
//   - 네이버 증권: 한국 종목 PER/PBR/배당수익률 (Yahoo에 값이 없을 때만 보충)
// 실행: node scripts/fetch-data.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { KR, US } from './universe.mjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const OUT = new URL('../data/market.json', import.meta.url);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, headers = {}, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await sleep(800 * (i + 1));
    }
  }
  throw lastErr;
}

// ---------- Yahoo 인증(crumb) ----------
let auth = null;
async function yahooAuth() {
  if (auth !== null) return auth;
  try {
    const r1 = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA }, redirect: 'manual' });
    const cookie = (r1.headers.getSetCookie?.() ?? [])
      .map((c) => c.split(';')[0])
      .join('; ');
    const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, Cookie: cookie },
    });
    const crumb = (await r2.text()).trim();
    if (!r2.ok || !crumb || crumb.includes('<')) throw new Error(`crumb 실패 (HTTP ${r2.status})`);
    auth = { cookie, crumb };
  } catch (e) {
    console.warn('[yahoo] 재무 데이터 인증 실패, 시세만 수집합니다:', e.message);
    auth = false;
  }
  return auth;
}

// ---------- 시세 ----------
async function fetchChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d&includePrePost=false`;
  const j = await getJson(url);
  const r = j.chart?.result?.[0];
  if (!r) throw new Error('차트 데이터 없음');
  const ts = r.timestamp ?? [];
  const closes = r.indicators?.adjclose?.[0]?.adjclose ?? r.indicators?.quote?.[0]?.close ?? [];
  const rawClose = r.indicators?.quote?.[0]?.close ?? [];
  const points = [];
  for (let i = 0; i < ts.length; i++) {
    if (closes[i] != null && rawClose[i] != null) points.push({ t: ts[i], adj: closes[i], close: rawClose[i] });
  }
  return { meta: r.meta, points };
}

// ---------- 재무 ----------
const raw = (v) => (v && typeof v === 'object' && 'raw' in v ? v.raw : typeof v === 'number' ? v : null);

async function fetchFundamentals(symbol) {
  const a = await yahooAuth();
  if (!a) return null;
  const modules = 'summaryDetail,defaultKeyStatistics,financialData,price';
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(a.crumb)}`;
  const j = await getJson(url, { Cookie: a.cookie });
  const q = j.quoteSummary?.result?.[0];
  if (!q) return null;
  const sd = q.summaryDetail ?? {};
  const ks = q.defaultKeyStatistics ?? {};
  const fd = q.financialData ?? {};
  const pr = q.price ?? {};
  const pct = (v) => (v == null ? null : v * 100);
  return {
    per: raw(sd.trailingPE),
    fwdPer: raw(sd.forwardPE) ?? raw(ks.forwardPE),
    pbr: raw(ks.priceToBook),
    peg: raw(ks.pegRatio) ?? raw(ks.trailingPegRatio),
    divYield: pickDividend(
      [pct(raw(sd.dividendYield)), pct(raw(sd.trailingAnnualDividendYield))],
      pct(raw(sd.payoutRatio)),
      raw(sd.trailingPE),
    ),
    payout: pct(raw(sd.payoutRatio)),
    beta: raw(sd.beta) ?? raw(ks.beta),
    marketCap: raw(pr.marketCap) ?? raw(sd.marketCap),
    roe: pct(raw(fd.returnOnEquity)),
    profitMargin: pct(raw(fd.profitMargins)),
    opMargin: pct(raw(fd.operatingMargins)),
    revenueGrowth: pct(raw(fd.revenueGrowth)),
    earningsGrowth: pct(raw(fd.earningsGrowth)),
    debtToEquity: raw(fd.debtToEquity),
    currentRatio: raw(fd.currentRatio),
    freeCashflow: raw(fd.freeCashflow),
    targetPrice: raw(fd.targetMeanPrice),
    analystCount: raw(fd.numberOfAnalystOpinions),
    recommendation: fd.recommendationKey ?? null,
  };
}

// 배당수익률 후보가 여러 개일 때(예상/과거 12개월) 배당성향÷PER로 계산한 값과 가장 가까운 것을 고릅니다.
// Yahoo가 가끔 특별배당 등으로 비정상적인 값을 주는 경우를 걸러내기 위함입니다.
function pickDividend(cands, payout, per) {
  const c = cands.filter((v) => v != null && Number.isFinite(v));
  if (c.length === 0) return null;
  if (payout > 0 && per > 0) {
    const implied = payout / per;
    return c.reduce((a, b) => (Math.abs(b - implied) < Math.abs(a - implied) ? b : a));
  }
  return c[0];
}

// 네이버 증권 (한국 종목 보충용)
function num(s) {
  if (s == null) return null;
  const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
async function fetchNaver(code) {
  const j = await getJson(`https://m.stock.naver.com/api/stock/${code}/integration`, {
    Referer: 'https://m.stock.naver.com/',
  });
  const out = {};
  for (const info of j.totalInfos ?? []) {
    const key = `${info.code ?? ''}|${info.key ?? ''}`;
    if (/^per\||\|PER$/i.test(key)) out.per = num(info.value);
    else if (/^pbr\||\|PBR$/i.test(key)) out.pbr = num(info.value);
    else if (/dividendYield|배당수익률/i.test(key)) out.divYield = num(info.value);
    else if (/cnsPer|추정PER/i.test(key)) out.fwdPer = num(info.value);
  }
  return out;
}

// ---------- 지표 계산 ----------
function pctChange(a, b) {
  return a && b ? (b / a - 1) * 100 : null;
}
function sma(arr, n) {
  if (arr.length < n) return null;
  let s = 0;
  for (let i = arr.length - n; i < arr.length; i++) s += arr[i];
  return s / n;
}
function rsi(arr, n = 14) {
  if (arr.length <= n) return null;
  let gain = 0,
    loss = 0;
  for (let i = arr.length - n; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / n / (loss / n);
  return 100 - 100 / (1 + rs);
}

function priceMetrics(points) {
  const adj = points.map((p) => p.adj);
  const last = adj.length - 1;
  const back = (days) => (last - days >= 0 ? adj[last - days] : null);
  const year = adj.slice(-252);
  const closeYear = points.slice(-252).map((p) => p.close);

  // 연간 변동성: 일별 수익률 표준편차 × √252
  const rets = [];
  for (let i = 1; i < year.length; i++) rets.push(Math.log(year[i] / year[i - 1]));
  const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1);
  const vol = Math.sqrt(variance) * Math.sqrt(252) * 100;

  // 최근 1년 최대 낙폭
  let peak = -Infinity,
    mdd = 0;
  for (const v of year) {
    peak = Math.max(peak, v);
    mdd = Math.min(mdd, v / peak - 1);
  }

  const high52 = Math.max(...closeYear);
  const low52 = Math.min(...closeYear);
  const price = points[points.length - 1].close;

  // 화면 차트용: 최근 1년을 약 60개 점으로 줄임
  const step = Math.max(1, Math.floor(closeYear.length / 60));
  const spark = [];
  for (let i = 0; i < closeYear.length; i += step) spark.push(round(closeYear[i]));
  if (spark[spark.length - 1] !== round(price)) spark.push(round(price));

  return {
    price,
    change1d: pctChange(points[points.length - 2]?.close, price),
    ret1m: pctChange(back(21), adj[last]),
    ret3m: pctChange(back(63), adj[last]),
    ret6m: pctChange(back(126), adj[last]),
    ret1y: pctChange(back(252), adj[last]),
    vol,
    mdd: mdd * 100,
    ma50: sma(adj, 50),
    ma200: sma(adj, 200),
    aboveMa50: adj[last] > (sma(adj, 50) ?? Infinity),
    aboveMa200: adj[last] > (sma(adj, 200) ?? Infinity),
    rsi14: rsi(adj),
    high52,
    low52,
    fromHigh: pctChange(high52, price),
    spark,
  };
}

function round(v, d = 4) {
  if (v == null || !Number.isFinite(v)) return null;
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
function roundAll(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'number' ? round(v, Math.abs(v) >= 1000 ? 0 : 2) : v;
  }
  return out;
}

// 지수 대비 베타를 1년 일별 수익률로 직접 계산 (Yahoo 베타는 한국 종목에서 부정확한 경우가 많음)
const dayKey = (t) => new Date(t * 1000).toISOString().slice(0, 10);
function calcBeta(points, indexPoints) {
  if (!indexPoints) return null;
  const idx = new Map(indexPoints.map((p) => [dayKey(p.t), p.adj]));
  const pairs = [];
  let prevS = null,
    prevM = null;
  for (const p of points.slice(-253)) {
    const mv = idx.get(dayKey(p.t));
    if (mv == null) continue;
    if (prevS != null) pairs.push([p.adj / prevS - 1, mv / prevM - 1]);
    prevS = p.adj;
    prevM = mv;
  }
  if (pairs.length < 120) return null;
  const ms = pairs.reduce((a, [x]) => a + x, 0) / pairs.length;
  const mm = pairs.reduce((a, [, y]) => a + y, 0) / pairs.length;
  let cov = 0,
    v = 0;
  for (const [x, y] of pairs) {
    cov += (x - ms) * (y - mm);
    v += (y - mm) ** 2;
  }
  return v > 0 ? cov / v : null;
}

// ---------- 실행 ----------
async function collect(list, market) {
  let indexPoints = null;
  try {
    indexPoints = (await fetchChart(market === 'KR' ? '^KS11' : '^GSPC')).points;
  } catch (e) {
    console.warn(`[${market}] 지수 시세 실패, 베타는 Yahoo 값 사용: ${e.message}`);
  }
  const out = [];
  for (const s of list) {
    try {
      const chart = await fetchChart(s.yahoo);
      if (chart.points.length < 60) throw new Error('시세 기간이 너무 짧음');
      const pm = priceMetrics(chart.points);
      let f = null;
      try {
        f = await fetchFundamentals(s.yahoo);
      } catch (e) {
        console.warn(`[${s.code}] 재무 실패: ${e.message}`);
      }
      f = f ?? {};
      if (market === 'KR') {
        try {
          const n = await fetchNaver(s.code);
          for (const k of ['per', 'pbr', 'divYield', 'fwdPer']) {
            if (f[k] == null && n[k] != null) f[k] = n[k];
          }
        } catch (e) {
          console.warn(`[${s.code}] 네이버 보충 실패: ${e.message}`);
        }
      }
      const beta = calcBeta(chart.points, indexPoints);
      if (beta != null) f.beta = beta;
      const { spark, ...rest } = pm;
      out.push({
        code: s.code,
        name: s.name,
        sector: s.sector,
        market,
        currency: chart.meta?.currency ?? (market === 'KR' ? 'KRW' : 'USD'),
        spark,
        metrics: roundAll({ ...rest, ...f }),
      });
      console.log(`[${s.code}] ${s.name} OK (PER ${f.per ?? '-'}, 배당 ${f.divYield ?? '-'})`);
    } catch (e) {
      console.warn(`[${s.code}] ${s.name} 건너뜀: ${e.message}`);
    }
    await sleep(350);
  }
  return out;
}

const kr = await collect(KR, 'KR');
const us = await collect(US, 'US');
const total = kr.length + us.length;
if (kr.length < 10 || us.length < 10) {
  console.error(`수집된 종목이 너무 적어 저장하지 않습니다 (한국 ${kr.length}, 미국 ${us.length}).`);
  process.exit(1);
}
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sources: ['Yahoo Finance', '네이버 증권'],
      stocks: [...kr, ...us],
    },
    null,
    0,
  ) + '\n',
);
console.log(`저장 완료: ${total}개 종목 (한국 ${kr.length}, 미국 ${us.length})`);
