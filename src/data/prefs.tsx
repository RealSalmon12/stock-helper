import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Market } from './types';

/** 사용자 설정: 기기에 저장됩니다 (웹은 브라우저 저장소). */
export type Level = 'easy' | 'pro';
export type InvestorType = 'safe' | 'balance' | 'growth' | 'income';

export interface Prefs {
  market: Market;
  level: Level;
  watch: string[]; // "KR:005930" 형식
  investor: InvestorType | null;
}

const DEFAULT: Prefs = { market: 'KR', level: 'easy', watch: [], investor: null };
const KEY = 'stock-helper:prefs:v2';

interface Ctx extends Prefs {
  ready: boolean;
  set: (patch: Partial<Prefs>) => void;
  toggleWatch: (market: Market, code: string) => void;
  isWatched: (market: Market, code: string) => boolean;
}

const PrefsContext = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setPrefs({ ...DEFAULT, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const save = useCallback((next: Prefs) => {
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    return next;
  }, []);

  const set = useCallback((patch: Partial<Prefs>) => setPrefs((p) => save({ ...p, ...patch })), [save]);

  const toggleWatch = useCallback(
    (market: Market, code: string) =>
      setPrefs((p) => {
        const id = `${market}:${code}`;
        const watch = p.watch.includes(id) ? p.watch.filter((x) => x !== id) : [id, ...p.watch];
        return save({ ...p, watch });
      }),
    [save],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...prefs,
      ready,
      set,
      toggleWatch,
      isWatched: (m, code) => prefs.watch.includes(`${m}:${code}`),
    }),
    [prefs, ready, set, toggleWatch],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const v = useContext(PrefsContext);
  if (!v) throw new Error('PrefsProvider 밖에서 사용됨');
  return v;
}
