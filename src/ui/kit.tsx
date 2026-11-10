import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { c, f, logoColor } from './theme';

type W = 'regular' | 'semibold' | 'bold';

/** 앱 공통 글자. size/weight/color만 주면 됩니다. */
export function T({
  size = 15,
  w = 'regular',
  color = c.text,
  style,
  ...rest
}: TextProps & { size?: number; w?: W; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      {...rest}
      style={[
        { fontSize: size, fontFamily: f[w], color, lineHeight: Math.round(size * 1.45), letterSpacing: size >= 20 ? -0.4 : -0.1 },
        style,
      ]}
    />
  );
}

/** 누르면 살짝 어두워지는 영역 */
export function Tap({ style, children, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}>
      {children}
    </Pressable>
  );
}

export function Card({ children, style, pad = 20 }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  return <View style={[s.card, { padding: pad }, style]}>{children}</View>;
}

export function SectionTitle({ title, sub, action, onAction }: { title: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.secRow}>
      <View style={{ flex: 1 }}>
        <T size={19} w="bold">
          {title}
        </T>
        {sub ? (
          <T size={13} color={c.faint} style={{ marginTop: 2 }}>
            {sub}
          </T>
        ) : null}
      </View>
      {action ? (
        <Tap onPress={onAction} hitSlop={8}>
          <T size={14} w="semibold" color={c.faint}>
            {action}
          </T>
        </Tap>
      ) : null}
    </View>
  );
}

/** 회색 바탕 위 두세 칸짜리 전환 버튼 */
export function Segmented<V extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.seg, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.segItem, on && s.segOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <T size={14} w={on ? 'bold' : 'semibold'} color={on ? c.text : c.faint}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: !!on }}>
      <T size={14} w="semibold" color={on ? c.accentInk : c.sub}>
        {label}
      </T>
    </Pressable>
  );
}

export function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <T size={12} w="semibold" color={fg}>
        {label}
      </T>
    </View>
  );
}

/** 회사 로고 대신 쓰는 이름 첫 글자 동그라미 */
export function Logo({ name, code, size = 40 }: { name: string; code: string; size?: number }) {
  const bg = logoColor(code);
  const letter = name.replace(/[()]/g, '').slice(0, 1).toUpperCase();
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <T size={size * 0.42} w="bold" color={c.white} style={{ lineHeight: size * 0.6 }}>
        {letter}
      </T>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: c.line }, style]} />;
}

export function Gap({ h = 12 }: { h?: number }) {
  return <View style={{ height: h }} />;
}

const s = StyleSheet.create({
  card: { backgroundColor: c.card, borderRadius: 22, borderWidth: 1, borderColor: c.line },
  secRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, gap: 12 },
  seg: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: c.line },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  segOn: { backgroundColor: c.raised },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: c.card, borderWidth: 1, borderColor: c.line },
  chipOn: { backgroundColor: c.accent, borderColor: c.accent },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
});
