import { Platform } from 'react-native';
import { RecommendationKind } from './data/types';

export const colors = {
  bg: '#F2F4F8',
  card: '#FFFFFF',
  text: '#121826',
  sub: '#5B6475',
  faint: '#8B93A3',
  border: '#E4E8EF',
  line: '#EEF1F5',
  primary: '#3B5BFD',
  primarySoft: '#ECF0FF',
  navy: '#0F1B3D',
  navy2: '#24346B',
  // 한국식: 상승 빨강, 하락 파랑
  up: '#E5383B',
  upSoft: '#FDECEC',
  down: '#2F6BFF',
  downSoft: '#EAF0FF',
  good: '#11845B',
  goodSoft: '#E6F6EF',
  warn: '#B45309',
  warnSoft: '#FFF4E0',
  info: '#5B6475',
  infoSoft: '#F1F3F7',
  warnBg: '#FFF6E5',
  warnText: '#8A5A00',
};

export const accent: Record<RecommendationKind, { main: string; soft: string; label: string; icon: string }> = {
  buyNow: { main: '#F0562E', soft: '#FFEFE9', label: '지금 사기 좋은 종목', icon: '🚀' },
  stable: { main: '#0E9384', soft: '#E3F6F3', label: '안정적인 종목', icon: '🛡️' },
};

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 6px 18px rgba(16,24,40,0.06)' } as object,
  default: {
    shadowColor: '#101828',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});

export function scoreColor(score: number): string {
  if (score >= 75) return '#11845B';
  if (score >= 60) return '#3B5BFD';
  if (score >= 45) return '#B7791F';
  return '#8B93A3';
}

export function scoreLabel(score: number): string {
  if (score >= 75) return '매우 좋음';
  if (score >= 60) return '좋음';
  if (score >= 45) return '보통';
  return '낮음';
}

export const changeColor = (v: number | null | undefined) =>
  v == null || v === 0 ? colors.sub : v > 0 ? colors.up : colors.down;
