import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TermKey } from '../data/types';
import { GLOSSARY } from '../logic/glossary';
import { colors, radius } from '../theme';

const Ctx = createContext<(k: TermKey) => void>(() => {});

export const useOpenTerm = () => useContext(Ctx);

/** 앱 어디서든 용어를 누르면 설명 창을 띄울 수 있게 해 주는 Provider */
export function TermProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState<TermKey | null>(null);
  const open = useCallback((k: TermKey) => setTerm(k), []);
  const t = term ? GLOSSARY[term] : null;
  return (
    <Ctx.Provider value={open}>
      {children}
      <Modal visible={!!t} transparent animationType="fade" onRequestClose={() => setTerm(null)}>
        <Pressable style={styles.backdrop} onPress={() => setTerm(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.kicker}>용어 설명</Text>
            <Text style={styles.name}>{t?.name}</Text>
            <Text style={styles.short}>{t?.short}</Text>
            <Text style={styles.long}>{t?.long}</Text>
            <Pressable style={styles.close} onPress={() => setTerm(null)} accessibilityRole="button">
              <Text style={styles.closeText}>알겠어요</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Ctx.Provider>
  );
}

/** 탭하면 용어 설명이 뜨는 작은 칩 */
export function TermChip({ term, label }: { term: TermKey; label?: string }) {
  const open = useOpenTerm();
  return (
    <Pressable onPress={() => open(term)} style={styles.chip} accessibilityRole="button" hitSlop={6}>
      <Text style={styles.chipText}>{label ?? GLOSSARY[term].name.split(' ')[0]} ?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,27,61,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 22, width: '100%', maxWidth: 420 },
  kicker: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  short: { fontSize: 14, color: colors.sub, marginTop: 4, fontWeight: '600' },
  long: { fontSize: 15, color: colors.text, lineHeight: 23, marginTop: 14 },
  close: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  chipText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
});
