import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { MarketData, Stock } from './types';

/**
 * 장중 현재가
 *
 * 1) GitHub Actions가 장중 약 5분마다 live 브랜치에 올리는 live.json 을 1분마다 확인해요. (웹·앱 공통)
 * 2) 휴대폰 앱에서는 네이버 증권 실시간 시세를 15초마다 직접 받아 국내 종목 가격을 더 빨리 바꿔요.
 *    (웹 브라우저는 보안 정책(CORS) 때문에 네이버에 직접 물어볼 수 없어서 1번만 써요.)
 */
const LIVE_URL = 'https://raw.githubusercontent.com/RealSalmon12/stock-helper/live/live.json';
const NAVER_URL = 'https://polling.finance.naver.com/api/realtime/domestic/stock/';

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
    const res = await fetch(NAVER_URL + codes.slice(i, i + 20).join(','), { headers: { Referer: 'https://m.stock.naver.com/' } });
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

export function useLiveQuotes(krCodes: string[]) {
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

  const codesKey = krCodes.join(',');
  const pullDirect = useCallback(async () => {
    if (Platform.OS === 'web' || !codesKey) return;
    try {
      merge(await fetchNaver(codesKey.split(',')));
      setDirect(true);
    } catch {
      setDirect(false);
    }
  }, [codesKey, merge]);

  useEffect(() => {
    pullFile();
    pullDirect();
    const a = setInterval(() => active.current && pullFile(), 60_000);
    const b = setInterval(() => active.current && pullDirect(), 15_000);
    const sub = AppState.addEventListener('change', (st) => {
      active.current = st === 'active';
      if (active.current) {
        pullFile();
        pullDirect();
      }
    });
    return () => {
      clearInterval(a);
      clearInterval(b);
      sub.remove();
    };
  }, [pullFile, pullDirect]);

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
