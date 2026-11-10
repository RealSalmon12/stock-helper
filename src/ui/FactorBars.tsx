import { View } from 'react-native';
import { FACTORS, Factors, FactorKey } from '../engine/factors';
import { T } from './kit';
import { c } from './theme';

/** 다섯 과목 점수 막대 */
export function FactorBars({ f, pro, focus = [] }: { f: Factors; pro: boolean; focus?: FactorKey[] }) {
  return (
    <View style={{ gap: 14 }}>
      {FACTORS.map((x) => {
        const v = f[x.key];
        const strong = v >= 65;
        const color = strong ? c.blue : v >= 45 ? '#90C2FF' : '#D1D6DB';
        return (
          <View key={x.key}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
              <T size={15} w="semibold" style={{ width: 44 }}>
                {x.label}
              </T>
              <T size={13} color={c.faint} style={{ flex: 1 }} numberOfLines={1}>
                {x.easy}
                {focus.includes(x.key) ? ' · 이 목록의 핵심' : ''}
              </T>
              <T size={15} w="bold" color={strong ? c.blue : c.sub}>
                {pro ? `${v}점` : v >= 80 ? '최고' : v >= 65 ? '좋음' : v >= 45 ? '보통' : v >= 25 ? '약함' : '낮음'}
              </T>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.soft, overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(4, v)}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
