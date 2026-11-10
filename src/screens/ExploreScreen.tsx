import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { usePrefs } from '../data/prefs';
import { ok, Rated } from '../engine/factors';
import { fmtCap, fmtNum, fmtPct } from '../engine/format';
import { useData } from '../nav/context';
import { MarketSwitch, TopBar } from '../ui/Bars';
import { Icon } from '../ui/Icon';
import { Card, Chip, Divider, T } from '../ui/kit';
import { StockRow } from '../ui/StockRow';
import { c, f } from '../ui/theme';

type Sort = 'total' | 'change' | 'div' | 'cap' | 'per' | 'safe';

const SORTS: { key: Sort; label: string; get: (r: Rated) => number | null; asc?: boolean; sub: (r: Rated) => string }[] = [
  { key: 'total', label: '종합 점수', get: (r) => r.total, sub: (r) => `종합 ${r.total}점 · ${r.stock.sector}` },
  { key: 'change', label: '오늘 등락', get: (r) => r.stock.metrics.change1d ?? null, sub: (r) => r.stock.sector },
  { key: 'safe', label: '안정성', get: (r) => r.f.safe, sub: (r) => `변동성 ${fmtNum(r.stock.metrics.vol, 0, '%')} · ${r.stock.sector}` },
  {
    key: 'div',
    label: '배당',
    get: (r) => r.stock.metrics.divYield ?? 0,
    sub: (r) => `배당 ${fmtNum(r.stock.metrics.divYield, 2, '%')} · ${r.stock.sector}`,
  },
  {
    key: 'per',
    label: '싼 순서(PER)',
    get: (r) => (ok(r.stock.metrics.per) && r.stock.metrics.per > 0 ? r.stock.metrics.per : null),
    asc: true,
    sub: (r) => `PER ${fmtNum(r.stock.metrics.per, 1, '배')} · ${r.stock.sector}`,
  },
  {
    key: 'cap',
    label: '회사 크기',
    get: (r) => r.stock.metrics.marketCap ?? null,
    sub: (r) => `시총 ${fmtCap(r.stock.metrics.marketCap, r.stock.currency)}`,
  },
];

export function ExploreScreen() {
  const { market } = usePrefs();
  const { boards } = useData();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('total');
  const [sector, setSector] = useState<string | null>(null);
  const board = boards[market];

  const sectors = useMemo(() => {
    const count = new Map<string, number>();
    board.rated.forEach((r) => count.set(r.stock.sector, (count.get(r.stock.sector) ?? 0) + 1));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [board]);

  const def = SORTS.find((x) => x.key === sort)!;
  const query = q.trim().toLowerCase();
  const list = board.rated
    .filter((r) => !sector || r.stock.sector === sector)
    .filter(
      (r) =>
        !query ||
        r.stock.name.toLowerCase().includes(query) ||
        r.stock.code.toLowerCase().includes(query) ||
        r.stock.sector.includes(query),
    )
    .sort((a, b) => {
      const va = def.get(a);
      const vb = def.get(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      return def.asc ? va - vb : vb - va;
    });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <TopBar title="종목 찾기" />
      <MarketSwitch />
      <View style={{ padding: 16, gap: 12 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 14, paddingHorizontal: 14, gap: 8 }}
        >
          <Icon name="search" size={20} color={c.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="종목 이름, 코드, 업종 검색"
            placeholderTextColor={c.faint}
            style={{ flex: 1, paddingVertical: 14, fontSize: 16, fontFamily: f.regular, color: c.text }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SORTS.map((s) => (
            <Chip key={s.key} label={s.label} on={sort === s.key} onPress={() => setSort(s.key)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="모든 업종" on={!sector} onPress={() => setSector(null)} />
          {sectors.map((s) => (
            <Chip key={s} label={s} on={sector === s} onPress={() => setSector(sector === s ? null : s)} />
          ))}
        </ScrollView>

        <Card pad={16}>
          <T size={13} color={c.faint} style={{ marginBottom: 4 }}>
            {list.length}개 종목 · {def.label} 순
          </T>
          {list.length === 0 && (
            <T size={15} color={c.faint} style={{ paddingVertical: 24, textAlign: 'center' }}>
              찾는 종목이 없어요. 후보 목록에 없는 종목일 수 있어요.
            </T>
          )}
          {list.map((r, i) => (
            <View key={r.stock.code}>
              {i > 0 && <Divider style={{ marginLeft: 52 }} />}
              <StockRow
                stock={r.stock}
                sub={sort === 'change' ? `${r.stock.sector} · 1년 ${fmtPct(r.stock.metrics.ret1y, 0)}` : def.sub(r)}
              />
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
