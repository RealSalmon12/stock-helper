import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { c } from './theme';

function build(points: number[], w: number, h: number, pad = 4) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const xy = points.map((v, i) => [(i / (points.length - 1)) * w, pad + (1 - (v - min) / span) * (h - pad * 2)] as const);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return { xy, line, area: `${line} L${w},${h} L0,${h} Z` };
}

/** 작은 선 그래프 (목록용) */
export function Spark({ data, width = 64, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return <View style={{ width, height }} />;
  const color = data[data.length - 1] >= data[0] ? c.up : c.down;
  const { line } = build(data, width, height, 3);
  return (
    <Svg width={width} height={height}>
      <Path d={line} stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

/** 상세 화면 큰 그래프 (아래로 은은한 그라데이션) */
export function AreaChart({ data, height = 180 }: { data: number[]; height?: number }) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  const up = data.length > 1 && data[data.length - 1] >= data[0];
  const color = up ? c.up : c.down;
  const g = w > 0 && data.length > 1 ? build(data, w, height, 10) : null;
  const last = g?.xy[g.xy.length - 1];
  return (
    <View onLayout={onLayout} style={{ height }}>
      {g && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.16} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={g.area} fill="url(#fill)" />
          <Path d={g.line} stroke={color} strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {last && <Circle cx={Math.min(last[0], w - 5)} cy={last[1]} r={4.5} fill={color} stroke="#fff" strokeWidth={2} />}
        </Svg>
      )}
    </View>
  );
}
