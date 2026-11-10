import Svg, { Circle, Path } from 'react-native-svg';
import { c } from './theme';

export type IconName = 'home' | 'search' | 'heart' | 'heartFill' | 'book' | 'back' | 'chevron' | 'close' | 'info' | 'refresh';

/** 앱에서 쓰는 단순한 선 아이콘 몇 가지 */
export function Icon({ name, size = 24, color = c.text }: { name: IconName; size?: number; color?: string }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" {...p} fill={color} />}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={6.5} {...p} />
          <Path d="m16 16 4 4" {...p} />
        </>
      )}
      {(name === 'heart' || name === 'heartFill') && (
        <Path
          d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"
          {...p}
          fill={name === 'heartFill' ? color : 'none'}
        />
      )}
      {name === 'book' && (
        <Path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v13H7.5A2.5 2.5 0 0 1 5 17.5zM17 7h2v13h-2M5 17.5A2.5 2.5 0 0 1 7.5 15H17" {...p} />
      )}
      {name === 'back' && <Path d="M15 5 8 12l7 7" {...p} strokeWidth={2.2} />}
      {name === 'chevron' && <Path d="m9 6 6 6-6 6" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...p} />}
      {name === 'info' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...p} />
          <Path d="M12 11v5M12 8h.01" {...p} />
        </>
      )}
      {name === 'refresh' && <Path d="M19 12a7 7 0 1 1-2.05-4.95M19 5v3.5h-3.5" {...p} />}
    </Svg>
  );
}
