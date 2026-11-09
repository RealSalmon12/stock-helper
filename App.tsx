import { IBMPlexSansKR_400Regular, IBMPlexSansKR_700Bold } from '@expo-google-fonts/ibm-plex-sans-kr';
import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Disclaimer } from './src/components/Disclaimer';
import { Header } from './src/components/Header';
import { TermProvider } from './src/components/Terms';
import { Market, Mode } from './src/data/types';
import { useMarketData } from './src/data/useMarketData';
import { MarketScreen } from './src/screens/MarketScreen';
import { colors, radius, font } from './src/theme';

export default function App() {
  const [market, setMarket] = useState<Market>('KR');
  const [mode, setMode] = useState<Mode>('beginner');
  const [showGuide, setShowGuide] = useState(true);
  const { data, state, refresh } = useMarketData();
  const [fontsLoaded, fontError] = useFonts({ IBMPlexSansKR_400Regular, IBMPlexSansKR_700Bold, NanumPenScript_400Regular });

  // 글꼴을 불러오는 동안은 빈 화면 (실패하면 기본 글꼴로 그냥 보여줌)
  if (!fontsLoaded && !fontError) return <View style={styles.safe} />;

  return (
    <SafeAreaProvider>
      <TermProvider>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <StatusBar style="dark" />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.inner}>
              <Header
                mode={mode}
                onMode={setMode}
                market={market}
                onMarket={setMarket}
                updatedAt={data.generatedAt}
                loadState={state}
                onRefresh={refresh}
              />

              {mode === 'beginner' && showGuide && (
                <View style={styles.guide}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideTitle}>이렇게 보면 돼요</Text>
                    <Text style={styles.guideText}>
                      점수는 0~100점이고, 같은 시장 종목들끼리 비교한 상대 점수예요. 카드를 누르면 왜 이 점수인지 쉬운 말로
                      설명해 드려요. 파란 <Text style={styles.q}>?</Text> 를 누르면 어려운 용어도 풀어 드려요. 숫자를 더 자세히
                      보고 싶으면 위에서 <Text style={styles.bold}>고수</Text> 모드로 바꿔 보세요.
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowGuide(false)} hitSlop={10} accessibilityLabel="안내 닫기">
                    <Text style={styles.guideClose}>✕</Text>
                  </Pressable>
                </View>
              )}

              <Disclaimer compact />

              <MarketScreen market={market} mode={mode} stocks={data.stocks} />

              <Text style={styles.footer}>
                데이터: {data.sources.join(', ')} · 장 마감 후 하루 2번 자동 갱신{'\n'}
                실시간 시세가 아니며 지연되거나 틀릴 수 있어요.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TermProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, alignItems: 'center', paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 640, gap: 14 },
  guide: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.sm,
    padding: 14,
  },
  guideTitle: { fontSize: 14, fontFamily: font.bold, color: colors.text },
  guideText: { fontSize: 13, fontFamily: font.regular, color: colors.text, lineHeight: 20, marginTop: 4 },
  q: { color: colors.primary, fontFamily: font.bold },
  bold: { fontFamily: font.bold },
  guideClose: { fontSize: 14, fontFamily: font.regular, color: colors.sub },
  footer: { fontSize: 11, fontFamily: font.regular, color: colors.faint, textAlign: 'center', lineHeight: 17, marginTop: 8 },
});
