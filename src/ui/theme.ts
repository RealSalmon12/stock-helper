/**
 * "미드나잇" 다크 테마
 * 거의 검은 남색 바탕 위에 한 단계씩 밝은 판을 겹치고, 강조색은 라임 하나만 씁니다.
 * 한국식으로 오르면 빨강, 내리면 파랑.
 */
export const c = {
  bg: '#07090D',
  card: '#10141B',
  raised: '#181D26',
  line: '#232A35',
  text: '#F1F4F8',
  sub: '#A3ADBB',
  faint: '#6B7584',
  soft: '#181D26',

  accent: '#B8F25C',
  accentInk: '#0B1200',
  accentSoft: 'rgba(184,242,92,0.12)',

  up: '#FF5B5B',
  upSoft: 'rgba(255,91,91,0.14)',
  down: '#4C9BFF',
  downSoft: 'rgba(76,155,255,0.14)',
  warn: '#FFB547',
  warnSoft: 'rgba(255,181,71,0.14)',

  // 이전 이름 호환
  blue: '#B8F25C',
  blueSoft: 'rgba(184,242,92,0.12)',
  green: '#B8F25C',
  greenSoft: 'rgba(184,242,92,0.12)',
  orange: '#FFB547',
  orangeSoft: 'rgba(255,181,71,0.14)',

  dim: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
};

export const f = {
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

export const changeColor = (v: number | null | undefined) => (v == null || !Number.isFinite(v) || v === 0 ? c.sub : v > 0 ? c.up : c.down);

export const toneColor = {
  great: { fg: c.accent, bg: c.accentSoft },
  good: { fg: '#7FD8A6', bg: 'rgba(127,216,166,0.12)' },
  soso: { fg: c.warn, bg: c.warnSoft },
  weak: { fg: c.faint, bg: c.raised },
};

/** 점수 색: 높을수록 라임, 낮을수록 회색 */
export function scoreColor(v: number) {
  return v >= 65 ? c.accent : v >= 45 ? '#D9E4C3' : c.faint;
}

/** 종목 로고 대신 쓰는 동그라미 색 (이름으로 고정, 어두운 바탕에 맞는 차분한 색) */
const PALETTE = ['#3A4BE0', '#C2410C', '#0F766E', '#7C3AED', '#B91C1C', '#0369A1', '#A16207', '#BE185D', '#15803D', '#4338CA'];
export function logoColor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
