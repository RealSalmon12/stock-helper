import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Market } from '../data/types';
import { colors } from '../theme';

const TABS: { key: Market; label: string }[] = [
  { key: 'KR', label: '한국장' },
  { key: 'US', label: '미국장' },
];

interface Props {
  value: Market;
  onChange: (m: Market) => void;
}

export function MarketTabs({ value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.card },
  label: { fontSize: 15, color: colors.sub, fontWeight: '600' },
  labelActive: { color: colors.text },
});
