import { StyleSheet, Text, View } from 'react-native';
import { StockPick } from '../data/types';
import { colors } from '../theme';

export function StockCard({ pick }: { pick: StockPick }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name}>{pick.name}</Text>
        <Text style={styles.symbol}>{pick.symbol}</Text>
      </View>
      <Text style={styles.reason}>{pick.reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  symbol: { fontSize: 12, color: colors.sub },
  reason: { marginTop: 6, fontSize: 14, color: colors.sub, lineHeight: 20 },
});
