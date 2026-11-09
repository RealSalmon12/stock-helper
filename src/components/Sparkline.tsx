import { useId } from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface Props {
  data: number[];
  width: number;
  height: number;
  color: string;
  fill?: boolean;
  strokeWidth?: number;
}

export function Sparkline({ data, width, height, color, fill = true, strokeWidth = 2 }: Props) {
  const id = useId().replace(/:/g, '');
  if (data.length < 2 || width <= 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = strokeWidth;
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {fill && <Path d={area} fill={`url(#g${id})`} />}
      <Path d={line} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
