import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { MarketData, Stock } from './types';

/**
 * 장중 현재가
 *
 * 1) GitHub Actions가 장중 약 5분마다 live 브랜치에 올리는 live.json 을 1분마다 확인해요. (웹·앱 공통, 예비용)
 * 2) 바로바로 바뀌는 시세:
 *    - 휴대폰 앱: 국내는 네이버 증권에서 5초마다, 해외는 Yahoo Finance에서 10초마다 직접 받아요.
 *    - 웹: 브라우저 보안 정책(CORS) 때문에 직접 못 받아서, LIVE_PROXY(무료 Cloudflare Worker, proxy/worker.js)를
 *      설정하면 그걸 거쳐 같은 간격으로 받아요. 비어 있으면 1번만 써요.
 */
const LIVE_URL = 'https://raw.githubusercontent.com/RealSalmon12/stock-helper/live/live.json';
const NAVER_URL = 'https://polling.finance.naver.com/api/realtime/domestic/stock/';
const YAHOO_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
/** 예: 'https://stock-helper-proxy.내이름.workers.dev' (끝에 / 없이) */
export const LIVE_PROXY = 'https://stock-helper-proxy.xmfhfhfl.workers.dev';

const KR_EVERY = 5_000;
const US_EVERY = 10_000;
const canDirect = Platform.OS !== 'web' || !!LIVE_PROXY;

export interface LiveQuote {
  price: number;
  changePct: number | null;
  state: string | null;
  t: number | null;
  intraday?: number[];
  src?: string;
}

export interface LiveInfo {
  /** 마지막으로 가격을 받은 시각 (ms) */
  at: number | null;
  /** 어느 시장이든 장이 열려 있는지 */
  open: { KR: boolean; US: boolean };
  /** 직접 받는 중인지 (앱) */
  direct: boolean;
}

const num = (s: unknown) => {
  if (s == null) return null;
  const m = String(s)
    .replace(/,/g, '')
    .match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

async function fetchNaver(codes: string[]): Promise<Record<string, LiveQuote>> {
  const out: Record<string, LiveQuote> = {};
  for (let i = 0; i < codes.length; i += 20) {
    const part = codes.slice(i, i + 20).join(',');
    const res =
      Platform.OS === 'web'
        ? await fetch(`${LIVE_PROXY}/naver?codes=${part}`)
        : await fetch(NAVER_URL + part, { headers: { Referer: 'https://m.stock.naver.com/' } });
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    for (const d of j.datas ?? []) {
      const price = num(d.closePriceRaw ?? d.closePrice);
      if (!d.itemCode || price == null) continue;
      let pct = num(d.fluctuationsRatioRaw ?? d.fluctuationsRatio);
      const dir = String(d.compareToPreviousPrice?.name ?? d.compareToPreviousPrice?.code ?? '');
      if (pct != null && pct > 0 && /FALL|LOWER|^5$|^4$/.test(dir)) pct = -pct;
      out[`KR:${d.itemCode}`] = {
        price,
        changePct: pct,
        state: d.marketStatus ?? null,
        t: d.localTradedAt ? Date.parse(d.localTradedAt) / 1000 : Date.now() / 1000,
        src: 'naver',
      };
    }
  }
  return out;
}

async function fetchYahooOne(symbol: string): Promise<LiveQuote | null> {
  const url =
    Platform.OS === 'web'
      ? `${LIVE_PROXY}/yahoo?symbol=${encodeURIComponent(symbol)}`
      : `${YAHOO_URL}${encodeURIComponent(symbol)}?range=1d&interval=5m&includePrePost=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  const r = j.chart?.result?.[0];
  const m = r?.meta;
  if (!m || m.regularMarketPrice == null) return null;
  const prev = m.chartPreviousClose ?? m.previousClose;
  const now = Date.now() / 1000;
  const p = m.currentTradingPeriod?.regular;
  const closes: number[] = (r.indicators?.quote?.[0]?.close ?? []).filter((v: number | null) => v != null);
  return {
    price: m.regularMarketPrice,
    changePct: prev ? (m.regularMarketPrice / prev - 1) * 100 : null,
    state: p ? (now >= p.start && now <= p.end ? 'OPEN' : 'CLOSE') : null,
    t: m.regularMarketTime ?? now,
    intraday: closes,
    src: 'yahoo',
  };
}

async function fetchYahoo(symbols: string[]): Promise<Record<string, LiveQuote>> {
  const out: Record<string, LiveQuote> = {};
  // 8개씩 동시에
  for (let i = 0; i < symbols.length; i += 8) {
    const part = symbols.slice(i, i + 8);
    const got = await Promise.all(part.map((sym) => fetchYahooOne(sym).catch(() => null)));
    got.forEach((q, k) => {
      if (q) out[`US:${part[k]}`] = q;
    });
  }
  return out;
}

export function useLiveQuotes(krCodes: string[], usCodes: string[]) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [at, setAt] = useState<number | null>(null);
  const [direct, setDirect] = useState(false);
  const active = useRef(true);

  const merge = useCallback((next: Record<string, LiveQuote>) => {
    setQuotes((cur) => {
      const out = { ...cur };
      for (const [k, q] of Object.entries(next)) {
        const old = out[k];
        // 더 최근 가격만 반영하고, 오늘 흐름(intraday)은 남겨 둠
        if (!old || (q.t ?? 0) >= (old.t ?? 0)) out[k] = { ...old, ...q, intraday: q.intraday?.length ? q.intraday : old?.intraday };
      }
      return out;
    });
    setAt(Date.now());
  }, []);

  const pullFile = useCallback(async () => {
    try {
      const res = await fetch(`${LIVE_URL}?t=${Math.floor(Date.now() / 30000)}`);
      if (!res.ok) return;
      const j = (await res.json()) as { updatedAt: string; quotes: Record<string, LiveQuote> };
      // 하루 넘게 지난 파일은 쓰지 않음
      if (Date.now() - Date.parse(j.updatedAt) > 36 * 3600 * 1000) return;
      merge(j.quotes);
    } catch {}
  }, [merge]);

  const krKey = krCodes.join(',');
  const usKey = usCodes.join(',');
  const usOpen = useRef(true);

  const pullKR = useCallback(async () => {
    if (!canDirect || !krKey) return;
    try {
      merge(await fetchNaver(krKey.split(',')));
      setDirect(true);
    } catch {
      setDirect(false);
    }
  }, [krKey, merge]);

  const pullUS = useCallback(async () => {
    if (!canDirect || !usKey) return;
    try {
      const got = await fetchYahoo(usKey.split(','));
      if (Object.keys(got).length) {
        usOpen.current = Object.values(got).some((q) => q.state === 'OPEN');
        merge(got);
        setDirect(true);
      }
    } catch {}
  }, [usKey, merge]);

  useEffect(() => {
    pullFile();
    pullKR();
    pullUS();
    let usTick = 0;
    const a = setInterval(() => active.current && pullFile(), 60_000);
    const b = setInterval(() => active.current && pullKR(), KR_EVERY);
    // 미국장이 닫혀 있으면 1분에 한 번만
    const c = setInterval(() => {
      usTick++;
      if (active.current && (usOpen.current || usTick % 6 === 0)) pullUS();
    }, US_EVERY);
    const sub = AppState.addEventListener('change', (st) => {
      active.current = st === 'active';
      if (active.current) {
        pullFile();
        pullKR();
        pullUS();
      }
    });
    return () => {
      clearInterval(a);
      clearInterval(b);
      clearInterval(c);
      sub.remove();
    };
  }, [pullFile, pullKR, pullUS]);

  const open = {
    KR: Object.entries(quotes).some(([k, q]) => k.startsWith('KR:') && q.state === 'OPEN'),
    US: Object.entries(quotes).some(([k, q]) => k.startsWith('US:') && q.state === 'OPEN'),
  };
  return { quotes, info: { at, open, direct } as LiveInfo };
}

/** 저장된 데이터에 현재가를 덮어씌움 */
export function applyLive(data: MarketData, quotes: Record<string, LiveQuote>): MarketData {
  if (Object.keys(quotes).length === 0) return data;
  const base = Date.parse(data.generatedAt) / 1000;
  const stocks = data.stocks.map((s): Stock => {
    const q = quotes[`${s.market}:${s.code}`];
    // 저장된 데이터보다 오래된 가격이면 무시
    if (!q || !Number.isFinite(q.price) || (q.t != null && q.t < base - 60)) return s;
    const spark = s.spark.length ? [...s.spark.slice(0, -1), q.price] : s.spark;
    return {
      ...s,
      spark,
      metrics: { ...s.metrics, price: q.price, change1d: q.changePct ?? s.metrics.change1d },
      live: { state: q.state, t: q.t, intraday: q.intraday ?? [] },
    };
  });
  return { ...data, stocks };
}
