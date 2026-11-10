import { createContext, ReactNode, useContext, useMemo } from 'react';
import { CollectionId, buildBoard, MarketBoard } from '../engine/collections';
import { Market, MarketData } from '../data/types';
import { LoadState } from '../data/useMarketData';
import { TermKey } from '../engine/glossary';

export type Tab = 'home' | 'explore' | 'watch' | 'learn';

export type Route =
  | { name: 'stock'; market: Market; code: string }
  | { name: 'collection'; market: Market; id: CollectionId }
  | { name: 'test' };

export interface Nav {
  tab: Tab;
  setTab: (t: Tab) => void;
  push: (r: Route) => void;
  back: () => void;
  showTerm: (k: TermKey) => void;
}

export const NavContext = createContext<Nav | null>(null);
export const useNav = () => useContext(NavContext)!;

interface Data {
  data: MarketData;
  state: LoadState;
  refresh: () => void;
  boards: Record<Market, MarketBoard>;
}

const DataContext = createContext<Data | null>(null);
export const useData = () => useContext(DataContext)!;

export function DataProvider({
  data,
  state,
  refresh,
  children,
}: {
  data: MarketData;
  state: LoadState;
  refresh: () => void;
  children: ReactNode;
}) {
  const boards = useMemo(() => ({ KR: buildBoard(data.stocks, 'KR'), US: buildBoard(data.stocks, 'US') }), [data]);
  const value = useMemo(() => ({ data, state, refresh, boards }), [data, state, refresh, boards]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
