import { Platform } from 'react-native';

/** 토스 느낌의 밝고 깔끔한 색. 한국식으로 오르면 빨강, 내리면 파랑. */
export const c = {
  bg: '#F2F4F6',
  card: '#FFFFFF',
  text: '#191F28',
  sub: '#4E5968',
  faint: '#8B95A1',
  line: '#E5E8EB',
  soft: '#F2F4F6',
  blue: '#3182F6',
  blueSoft: '#E8F3FF',
  up: '#F04452',
  upSoft: '#FFEEEF',
  down: '#3182F6',
  downSoft: '#E8F3FF',
  green: '#00B76A',
  greenSoft: '#E5F8EF',
  orange: '#FF8A00',
  orangeSoft: '#FFF3E0',
  dim: 'rgba(0,0,0,0.4)',
};

export const f = {
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

export const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } as object,
  default: {},
});

export const changeColor = (v: number | null | undefined) => (v == null || !Number.isFinite(v) || v === 0 ? c.sub : v > 0 ? c.up : c.down);

export const toneColor = {
  great: { fg: c.blue, bg: c.blueSoft },
  good: { fg: c.green, bg: c.greenSoft },
  soso: { fg: c.orange, bg: c.orangeSoft },
  weak: { fg: c.faint, bg: c.soft },
};

/** 종목 로고 대신 쓰는 동그라미 색 (이름으로 고정) */
const PALETTE = ['#3182F6', '#F04452', '#00B76A', '#FF8A00', '#8B5CF6', '#0EA5E9', '#EC4899', '#14B8A6', '#6366F1', '#F59E0B'];
export function logoColor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
