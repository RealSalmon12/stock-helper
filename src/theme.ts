import { RecommendationKind } from './data/types';

// 콘셉트: "주식 공부 노트" — 모눈 노트 위에 남색 잉크로 적고, 점수는 형광펜으로 표시합니다.
export const colors = {
  bg: '#F3F5F8', // 책상
  card: '#FFFFFF', // 노트 종이
  text: '#1D2B53', // 남색 잉크
  sub: '#56607A',
  faint: '#8E97AB', // 연필
  border: '#DCE2EC',
  line: '#E9EDF4', // 노트 줄
  grid: '#E3E9F2', // 모눈
  primary: '#2347C5',
  primarySoft: '#E8EDFC',
  navy: '#1D2B53',
  navy2: '#2A3C70',
  // 한국식: 상승 빨강, 하락 파랑
  up: '#D7263D',
  upSoft: '#FCEBED',
  down: '#1F5FD1',
  downSoft: '#E8EFFC',
  good: '#167A55',
  goodSoft: '#E5F4EC',
  warn: '#A8530A',
  warnSoft: '#FFF1DE',
  info: '#56607A',
  infoSoft: '#EFF2F7',
  warnBg: '#FFF7E8',
  warnText: '#7A4A06',
};

/** 글꼴: 본문은 IBM Plex Sans KR, 점수와 선생님 한마디는 손글씨(나눔펜) */
export const font = {
  regular: 'IBMPlexSansKR_400Regular',
  bold: 'IBMPlexSansKR_700Bold',
  pen: 'NanumPenScript_400Regular',
};

/** 추천 종류별 색. hl은 점수 뒤에 칠하는 형광펜 색 */
export const accent: Record<
  RecommendationKind,
  { main: string; soft: string; hl: string; label: string; short: string; icon: string }
> = {
  buyNow: { main: '#C2410C', soft: '#FFEEDF', hl: '#FFC98A', label: '지금 사기 좋은 종목', short: '지금 사기', icon: '🚀' },
  stable: { main: '#0F766E', soft: '#E0F4F1', hl: '#9BE6D3', label: '안정적인 종목', short: '안정적', icon: '🛡️' },
  student: { main: '#6D4AE0', soft: '#EFEAFF', hl: '#D5C8FF', label: '학생에게 좋은 종목', short: '학생용', icon: '🎒' },
};

export const radius = { sm: 4, md: 8, lg: 10, pill: 999 };

/** 종이는 그림자 대신 얇은 테두리로 구분합니다 */
export const shadow = {
  borderWidth: 1,
  borderColor: '#DCE2EC',
} as object;

export function scoreColor(score: number): string {
  if (score >= 75) return '#167A55';
  if (score >= 60) return '#2347C5';
  if (score >= 45) return '#A8650A';
  return '#8E97AB';
}

export function scoreLabel(score: number): string {
  if (score >= 75) return '매우 좋음';
  if (score >= 60) return '좋음';
  if (score >= 45) return '보통';
  return '낮음';
}

export const changeColor = (v: number | null | undefined) =>
  v == null || v === 0 ? colors.sub : v > 0 ? colors.up : colors.down;
