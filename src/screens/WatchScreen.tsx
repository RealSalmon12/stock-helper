import { ScrollView, View } from 'react-native';
import { Market } from '../data/types';
import { usePrefs } from '../data/prefs';
import { grade } from '../engine/factors';
import { oneLiner, points } from '../engine/insights';
import { useData, useNav } from '../nav/context';
import { TopBar } from '../ui/Bars';
import { Card, Divider, T, Tap } from '../ui/kit';
import { StockRow } from '../ui/StockRow';
import { c } from '../ui/theme';

export function WatchScreen() {
  const { watch } = usePrefs();
  const { boards } = useData();
  const nav = useNav();
  const items = watch
    .map((id) => {
      const [m, code] = id.split(':') as [Market, string];
      return boards[m]?.byCode.get(code);
    })
    .filter((x) => x != null);

  const groups: { market: Market; title: string }[] = [
    { market: 'KR', title: '🇰🇷 국내' },
    { market: 'US', title: '🇺🇸 해외' },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
      <TopBar title="관심 종목" />
      <View style={{ padding: 16, gap: 12 }}>
        {items.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
            <T size={44} style={{ lineHeight: 56 }}>
              💙
            </T>
            <T size={18} w="bold" style={{ marginTop: 8 }}>
              아직 관심 종목이 없어요
            </T>
            <T size={14} color={c.faint} style={{ marginTop: 4, textAlign: 'center' }}>
              종목 화면 오른쪽 위 하트를 누르면{'\n'}여기에서 모아 볼 수 있어요
            </T>
            <Tap
              onPress={() => nav.setTab('explore')}
              style={{ marginTop: 20, backgroundColor: c.accent, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 }}
            >
              <T size={15} w="bold" color={c.accentInk}>
                종목 둘러보기
              </T>
            </Tap>
          </Card>
        ) : (
          groups.map((g) => {
            const list = items.filter((r) => r.stock.market === g.market);
            if (!list.length) return null;
            return (
              <Card key={g.market} pad={16}>
                <T size={15} w="bold" color={c.sub} style={{ marginBottom: 4 }}>
                  {g.title} {list.length}
                </T>
                {list.map((r, i) => (
                  <View key={r.stock.code}>
                    {i > 0 && <Divider style={{ marginLeft: 52 }} />}
                    <StockRow
                      stock={r.stock}
                      sub={`종합 ${r.total}점 ${grade(r.total).label} · ${oneLiner(r, points(r.stock)).split('.')[0]}`}
                    />
                  </View>
                ))}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
