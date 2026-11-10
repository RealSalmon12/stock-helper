import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { FACTORS, Factors } from '../engine/factors';
import { fmtPrice } from '../engine/format';
import { T } from './kit';
import { c, f, scoreColor } from './theme';

/** 점수 고리 */
export function ScoreRing({ value, size = 76, label }: { value: number; size?: number; label?: string }) {
  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const color = scoreColor(value);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(len * value) / 100} ${len}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <T size={size * 0.32} w="bold" color={color} style={{ lineHeight: size * 0.38 }}>
        {value}
      </T>
      {label ? (
        <T size={Math.max(9, size * 0.12)} color={c.faint} style={{ lineHeight: size * 0.15 }}>
          {label}
        </T>
      ) : null}
    </View>
  );
}

/** 다섯 과목 오각형 그래프 */
export function Radar({ f: fac, size = 220 }: { f: Factors; size?: number }) {
  const cx = size / 2;
  const cy = size / 2 + 6;
  const R = size * 0.34;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / FACTORS.length;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v] as const;
  };
  const ring = (v: number) => FACTORS.map((_, i) => pt(i, v).join(',')).join(' ');
  const shape = FACTORS.map((x, i) => pt(i, Math.max(0.06, fac[x.key] / 100)).join(',')).join(' ');
  return (
    <Svg width={size} height={size + 8}>
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <Polygon key={v} points={ring(v)} fill="none" stroke={c.line} strokeWidth={1} />
      ))}
      {FACTORS.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={c.line} strokeWidth={1} />;
      })}
      <Polygon points={shape} fill={c.accentSoft} stroke={c.accent} strokeWidth={2} strokeLinejoin="round" />
      {FACTORS.map((x, i) => {
        const [px, py] = pt(i, Math.max(0.06, fac[x.key] / 100));
        const [lx, ly] = pt(i, 1.28);
        return (
          <G key={x.key}>
            <Circle cx={px} cy={py} r={3.5} fill={c.accent} />
            <SvgText x={lx} y={ly - 2} fill={c.sub} fontSize={12} fontFamily={f.semibold} textAnchor="middle">
              {x.label}
            </SvgText>
            <SvgText x={lx} y={ly + 13} fill={scoreColor(fac[x.key])} fontSize={12} fontFamily={f.bold} textAnchor="middle">
              {fac[x.key]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/** 여러 칸으로 나뉜 가로 막대 (의견 분포 등) */
export function StackBar({ parts, height = 10 }: { parts: { value: number; color: string }[]; height?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: c.raised, gap: 2 }}>
      {parts
        .filter((p) => p.value > 0)
        .map((p, i) => (
          <View key={i} style={{ flex: p.value / total, backgroundColor: p.color }} />
        ))}
    </View>
  );
}

/** 목표가 범위: 최저 ─ 평균 ─ 최고 위에 현재가 표시 */
export function TargetRange({
  low,
  mean,
  high,
  now,
  currency,
}: {
  low: number;
  mean: number;
  high: number;
  now: number;
  currency: string;
}) {
  const min = Math.min(low, now);
  const max = Math.max(high, now);
  const pos = (v: number) => `${((v - min) / (max - min || 1)) * 100}%` as const;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ height: 34, justifyContent: 'center' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.raised }} />
        <View
          style={{
            position: 'absolute',
            left: pos(low),
            right: `${100 - ((high - min) / (max - min || 1)) * 100}%`,
            height: 6,
            borderRadius: 3,
            backgroundColor: c.accentSoft,
            borderWidth: 1,
            borderColor: c.accent,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: pos(mean),
            marginLeft: -1.5,
            width: 3,
            height: 18,
            borderRadius: 2,
            backgroundColor: c.accent,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: pos(now),
            marginLeft: -8,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: c.text,
            borderWidth: 3,
            borderColor: c.card,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Label k="최저" v={fmtPrice(low, currency)} />
        <Label k="평균" v={fmtPrice(mean, currency)} accent center />
        <Label k="최고" v={fmtPrice(high, currency)} right />
      </View>
    </View>
  );
}

function Label({ k, v, accent, center, right }: { k: string; v: string; accent?: boolean; center?: boolean; right?: boolean }) {
  return (
    <View style={{ alignItems: center ? 'center' : right ? 'flex-end' : 'flex-start' }}>
      <T size={11} color={c.faint}>
        {k}
      </T>
      <T size={13} w="semibold" color={accent ? c.accent : c.sub}>
        {v}
      </T>
    </View>
  );
}
