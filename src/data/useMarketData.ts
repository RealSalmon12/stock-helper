import { useCallback, useEffect, useState } from 'react';
import bundled from '../../data/market.json';
import { MarketData } from './types';

/**
 * 시세 데이터는 GitHub Actions가 하루 두 번 data/market.json 으로 갱신합니다.
 * 앱은 먼저 앱에 들어있는 데이터를 보여주고, 저장소의 최신 파일을 받아 더 새것이면 바꿉니다.
 * (raw.githubusercontent.com 은 CORS를 허용해서 웹에서도 동작합니다.)
 */
const REMOTE_URL = 'https://raw.githubusercontent.com/RealSalmon12/stock-helper/main/data/market.json';

export type LoadState = 'idle' | 'loading' | 'fresh' | 'offline';

export function useMarketData() {
  const [data, setData] = useState<MarketData>(bundled as unknown as MarketData);
  const [state, setState] = useState<LoadState>('idle');

  const refresh = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`${REMOTE_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error(String(res.status));
      const remote = (await res.json()) as MarketData;
      if (!Array.isArray(remote.stocks) || remote.stocks.length === 0) throw new Error('empty');
      setData((cur) => (new Date(remote.generatedAt) > new Date(cur.generatedAt) ? remote : cur));
      setState('fresh');
    } catch {
      setState('offline');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, state, refresh };
}
