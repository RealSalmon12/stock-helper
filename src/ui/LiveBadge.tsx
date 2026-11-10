import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { T } from './kit';
import { c } from './theme';

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 실시간 표시: 장중이면 깜빡이는 초록 점 */
export function LiveBadge({ open, t, label }: { open: boolean; t: number | null; label?: string }) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!open) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.25, duration: 700, useNativeDriver: false }),
        Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [open, a]);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: open ? 'rgba(61,220,151,0.12)' : c.raised,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: open ? '#3DDC97' : c.faint, opacity: open ? a : 1 }} />
      <T size={12} w="semibold" color={open ? '#3DDC97' : c.sub}>
        {label ?? (open ? '실시간' : '장 마감')}
        {t ? ` · ${hhmm(t)}` : ''}
      </T>
    </View>
  );
}
