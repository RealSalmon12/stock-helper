import { ReactNode } from 'react';
import { View } from 'react-native';
import { Market } from '../data/types';
import { usePrefs } from '../data/prefs';
import { Icon } from './Icon';
import { Segmented, T, Tap } from './kit';
import { c } from './theme';

/** 탭 화면 맨 위: 큰 제목 + 오른쪽 초보/고수 전환 */
export function TopBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 10 }}>
      <T size={24} w="bold" style={{ flex: 1 }}>
        {title}
      </T>
      {right}
      <LevelToggle />
    </View>
  );
}

/** 국내/해외 전환 */
export function MarketSwitch() {
  const { market, set } = usePrefs();
  return (
    <Segmented<Market>
      value={market}
      onChange={(m) => set({ market: m })}
      options={[
        { value: 'KR', label: '🇰🇷 국내 주식' },
        { value: 'US', label: '🇺🇸 해외 주식' },
      ]}
      style={{ marginHorizontal: 20, marginBottom: 4 }}
    />
  );
}

/** 상세 화면 맨 위: 뒤로가기 + 제목 + 오른쪽 */
export function BackBar({ title, onBack, right }: { title?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 8, backgroundColor: c.card }}>
      <Tap onPress={onBack} hitSlop={10} style={{ padding: 8 }} accessibilityLabel="뒤로 가기">
        <Icon name="back" />
      </Tap>
      <T size={17} w="semibold" style={{ flex: 1, marginLeft: 4 }} numberOfLines={1}>
        {title ?? ''}
      </T>
      {right}
    </View>
  );
}

/** 쉽게(초보) / 자세히(고수) 보기 전환 */
export function LevelToggle() {
  const { level, set } = usePrefs();
  return (
    <Tap
      onPress={() => set({ level: level === 'easy' ? 'pro' : 'easy' })}
      style={{ flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 999, padding: 3 }}
      accessibilityRole="switch"
      accessibilityLabel="초보/고수 보기 전환"
    >
      {(['easy', 'pro'] as const).map((l) => (
        <View
          key={l}
          style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: level === l ? '#fff' : 'transparent' }}
        >
          <T size={13} w={level === l ? 'bold' : 'semibold'} color={level === l ? c.text : c.faint}>
            {l === 'easy' ? '쉽게' : '자세히'}
          </T>
        </View>
      ))}
    </Tap>
  );
}
