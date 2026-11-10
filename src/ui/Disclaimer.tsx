import { View } from 'react-native';
import { useData } from '../nav/context';
import { T } from './kit';
import { c } from './theme';

export function Disclaimer() {
  const { data } = useData();
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 12, gap: 4 }}>
      <T size={12} color={c.faint}>
        이 앱의 점수와 추천은 공개된 숫자를 정해진 기준으로 정리한 참고 정보예요. 투자 조언이 아니며, 투자 결정과 그 결과는 본인 책임이에요.
      </T>
      <T size={12} color={c.faint}>
        데이터: {data.sources.join(', ')} · 평일 하루 2번 자동 갱신 · 실시간 시세가 아니에요.
      </T>
    </View>
  );
}
