import { View } from 'react-native';
import { useNav } from '../nav/context';
import { Stock } from '../data/types';
import { fmtPct, fmtPrice } from '../engine/format';
import { Logo, T, Tap } from './kit';
import { c, changeColor } from './theme';

/** 토스 목록처럼: [순위] 로고 이름/설명 ……… 가격/등락률 */
export function StockRow({
  stock,
  rank,
  sub,
  score,
  right,
}: {
  stock: Stock;
  rank?: number;
  sub?: string;
  score?: number;
  right?: 'price' | 'score';
}) {
  const nav = useNav();
  const m = stock.metrics;
  return (
    <Tap
      onPress={() => nav.push({ name: 'stock', market: stock.market, code: stock.code })}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }}
      accessibilityRole="button"
      accessibilityLabel={`${stock.name} 자세히 보기`}
    >
      {rank != null && (
        <T size={16} w="bold" color={rank <= 3 ? c.blue : c.faint} style={{ width: 20, textAlign: 'center' }}>
          {rank}
        </T>
      )}
      <Logo name={stock.name} code={stock.code} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={16} w="semibold" numberOfLines={1}>
          {stock.name}
        </T>
        <T size={13} color={c.faint} numberOfLines={2}>
          {sub ?? stock.sector}
        </T>
      </View>
      {right === 'score' && score != null ? (
        <View style={{ alignItems: 'flex-end' }}>
          <T size={16} w="bold" color={c.blue}>
            {score}점
          </T>
          <T size={13} color={changeColor(m.change1d)}>
            {fmtPct(m.change1d)}
          </T>
        </View>
      ) : (
        <View style={{ alignItems: 'flex-end' }}>
          <T size={16} w="semibold">
            {fmtPrice(m.price, stock.currency)}
          </T>
          <T size={13} w="semibold" color={changeColor(m.change1d)}>
            {fmtPct(m.change1d)}
          </T>
        </View>
      )}
    </Tap>
  );
}
