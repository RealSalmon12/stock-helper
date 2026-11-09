import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Disclaimer } from './src/components/Disclaimer';
import { MarketTabs } from './src/components/MarketTabs';
import { Market } from './src/data/types';
import { MarketScreen } from './src/screens/MarketScreen';
import { colors } from './src/theme';

export default function App() {
  const [market, setMarket] = useState<Market>('KR');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.inner}>
            <Text style={styles.appTitle}>주식 도우미</Text>
            <Text style={styles.appSub}>초보부터 고수까지, 쉬운 말로 보는 종목 추천</Text>
            <Disclaimer />
            <View style={{ height: 16 }} />
            <MarketTabs value={market} onChange={setMarket} />
            <MarketScreen market={market} />
            <Text style={styles.note}>현재 보이는 종목은 화면 확인용 예시입니다.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 640 },
  appTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  appSub: { fontSize: 14, color: colors.sub, marginTop: 4 },
  note: { fontSize: 12, color: colors.sub, textAlign: 'center', marginVertical: 20 },
});
