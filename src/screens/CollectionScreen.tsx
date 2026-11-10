import { ScrollView, View } from 'react-native';
import { Market } from '../data/types';
import { usePrefs } from '../data/prefs';
import { collectionById, CollectionId } from '../engine/collections';
import { fmtPrice } from '../engine/format';
import { oneLiner, points } from '../engine/insights';
import { useData, useNav } from '../nav/context';
import { BackBar } from '../ui/Bars';
import { Disclaimer } from '../ui/Disclaimer';
import { Card, Divider, T } from '../ui/kit';
import { StockRow } from '../ui/StockRow';
import { c } from '../ui/theme';

export function CollectionScreen({ market, id }: { market: Market; id: CollectionId }) {
  const nav = useNav();
  const { boards } = useData();
  const { level } = usePrefs();
  const col = collectionById(id);
  const list = boards[market].lists[id];

  return (
    <View style={{ flex: 1 }}>
      <BackBar onBack={nav.back} title={`${col.title} 종목`} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <Card>
          <T size={40} style={{ lineHeight: 50 }}>
            {col.emoji}
          </T>
          <T size={22} w="bold" style={{ marginTop: 6 }}>
            {market === 'KR' ? '국내' : '해외'} {col.title} 종목
          </T>
          <T size={15} color={c.sub} style={{ marginTop: 4 }}>
            {col.desc}
          </T>
          <View style={{ backgroundColor: c.soft, borderRadius: 12, padding: 12, marginTop: 14 }}>
            <T size={13} w="semibold" color={c.sub}>
              이렇게 골랐어요
            </T>
            <T size={13} color={c.sub} style={{ marginTop: 2 }}>
              {col.how}
            </T>
          </View>
        </Card>

        <Card pad={16}>
          {list.length === 0 && (
            <T size={14} color={c.faint} style={{ padding: 8 }}>
              지금 기준에 맞는 종목이 없어요.
            </T>
          )}
          {list.map((p, i) => (
            <View key={p.rated.stock.code}>
              {i > 0 && <Divider style={{ marginLeft: 32 }} />}
              <StockRow
                stock={p.rated.stock}
                rank={p.rank}
                score={p.score}
                right="score"
                sub={
                  id === 'student'
                    ? `1주 ${fmtPrice(p.rated.stock.metrics.price, p.rated.stock.currency)} · ${level === 'easy' ? oneLiner(p.rated, points(p.rated.stock)) : p.rated.stock.sector}`
                    : level === 'easy'
                      ? oneLiner(p.rated, points(p.rated.stock))
                      : undefined
                }
              />
            </View>
          ))}
        </Card>
        <Disclaimer />
      </ScrollView>
    </View>
  );
}
