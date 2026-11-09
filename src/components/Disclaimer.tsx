import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Disclaimer() {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        이 앱의 정보는 투자 조언이 아닌 참고용 정보입니다. 투자 판단과 그 결과의 책임은 본인에게 있습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.warnBg, borderRadius: 10, padding: 12, marginTop: 8 },
  text: { color: colors.warnText, fontSize: 12, lineHeight: 18 },
});
