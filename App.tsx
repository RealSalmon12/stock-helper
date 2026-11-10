import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrefsProvider, usePrefs } from './src/data/prefs';
import { useMarketData } from './src/data/useMarketData';
import { GLOSSARY, TermKey } from './src/engine/glossary';
import { DataProvider, Nav, NavContext, Route, Tab } from './src/nav/context';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { StockScreen } from './src/screens/StockScreen';
import { TestScreen } from './src/screens/TestScreen';
import { WatchScreen } from './src/screens/WatchScreen';
import { Icon, IconName } from './src/ui/Icon';
import { T, Tap } from './src/ui/kit';
import { c } from './src/ui/theme';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });
  const { data, state, refresh } = useMarketData();

  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <SafeAreaProvider>
      <PrefsProvider>
        <DataProvider data={data} state={state} refresh={refresh}>
          <StatusBar style="dark" />
          <View style={styles.outer}>
            <View style={styles.frame}>
              <Shell />
            </View>
          </View>
        </DataProvider>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'explore', label: '종목 찾기', icon: 'search' },
  { key: 'watch', label: '관심', icon: 'heart' },
  { key: 'learn', label: '공부', icon: 'book' },
];

function Shell() {
  const { ready } = usePrefs();
  const [tab, setTabState] = useState<Tab>('home');
  const [stack, setStack] = useState<Route[]>([]);
  const [term, setTerm] = useState<TermKey | null>(null);

  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const nav = useMemo<Nav>(
    () => ({
      tab,
      setTab: (t) => {
        setStack([]);
        setTabState(t);
      },
      push: (r) => setStack((s) => [...s, r]),
      back,
      showTerm: setTerm,
    }),
    [tab, back],
  );

  // 안드로이드 뒤로 가기 버튼
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (term) {
        setTerm(null);
        return true;
      }
      if (stack.length) {
        back();
        return true;
      }
      if (tab !== 'home') {
        setTabState('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, term, back]);

  const top = stack[stack.length - 1];

  return (
    <NavContext.Provider value={nav}>
      <SafeAreaView style={{ flex: 1, backgroundColor: top ? c.card : c.bg }} edges={['top']}>
        {ready && (
          <View style={{ flex: 1 }}>
            {/* 탭 화면은 계속 살려 둬서 스크롤 위치가 유지돼요 */}
            {TABS.map((t) => (
              <View key={t.key} style={[StyleSheet.absoluteFill, { display: tab === t.key && !top ? 'flex' : 'none' }]}>
                {t.key === 'home' && <HomeScreen />}
                {t.key === 'explore' && <ExploreScreen />}
                {t.key === 'watch' && <WatchScreen />}
                {t.key === 'learn' && <LearnScreen />}
              </View>
            ))}
            {top && (
              <View key={stack.length} style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>
                {top.name === 'stock' && <StockScreen key={top.code} market={top.market} code={top.code} />}
                {top.name === 'collection' && <CollectionScreen market={top.market} id={top.id} />}
                {top.name === 'test' && <TestScreen />}
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
      {!top && <TabBar tab={tab} onTab={nav.setTab} />}
      <TermSheet term={term} onClose={() => setTerm(null)} />
    </NavContext.Provider>
  );
}

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const on = tab === t.key;
        const color = on ? c.text : '#B0B8C1';
        return (
          <Pressable
            key={t.key}
            onPress={() => onTab(t.key)}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Icon name={t.key === 'watch' && on ? 'heartFill' : t.icon} size={24} color={color} />
            <T size={11} w={on ? 'semibold' : 'regular'} color={color} style={{ marginTop: 2 }}>
              {t.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 용어 설명: 아래에서 올라오는 시트 */
function TermSheet({ term, onClose }: { term: TermKey | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const t = term ? GLOSSARY[term] : null;
  return (
    <Modal visible={!!t} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="닫기">
        <Pressable style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} onPress={() => {}}>
          {t && (
            <>
              <View style={styles.grabber} />
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <T size={21} w="bold">
                    {t.name}
                  </T>
                  <T size={15} w="semibold" color={c.blue} style={{ marginTop: 2 }}>
                    {t.short}
                  </T>
                </View>
                <Tap onPress={onClose} hitSlop={10} accessibilityLabel="닫기">
                  <Icon name="close" color={c.faint} />
                </Tap>
              </View>
              <T size={16} color={c.sub} style={{ marginTop: 14, lineHeight: 26 }}>
                {t.long}
              </T>
              <Tap onPress={onClose} style={styles.sheetBtn}>
                <T size={16} w="bold" color="#fff">
                  알겠어요
                </T>
              </Tap>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#E5E8EB', alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: 520, backgroundColor: c.bg, overflow: 'hidden' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.line,
    paddingTop: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  dim: { flex: 1, backgroundColor: c.dim, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: c.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 16 },
  sheetBtn: { marginTop: 24, backgroundColor: c.blue, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
});
