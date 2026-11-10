export function fmtPrice(v: number, currency: string): string {
  if (currency === 'KRW') return `${Math.round(v).toLocaleString('ko-KR')}원`;
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 퍼센트 값(이미 % 단위)을 "+12.3%" 형태로 */
export function fmtPct(v: number | null | undefined, digits = 1, sign = true): string {
  if (v == null || !Number.isFinite(v)) return '-';
  const s = v.toFixed(digits);
  return `${sign && v > 0 ? '+' : ''}${s}%`;
}

export function fmtNum(v: number | null | undefined, digits = 1, suffix = ''): string {
  if (v == null || !Number.isFinite(v)) return '-';
  return `${v.toFixed(digits)}${suffix}`;
}

export function fmtCap(v: number | null | undefined, currency: string): string {
  if (v == null || !Number.isFinite(v)) return '-';
  if (currency === 'KRW') {
    if (v >= 1e12) return `${(v / 1e12).toFixed(1)}조원`;
    return `${Math.round(v / 1e8).toLocaleString('ko-KR')}억원`;
  }
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  return `$${(v / 1e9).toFixed(1)}B`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
