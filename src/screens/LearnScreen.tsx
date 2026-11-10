import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { usePrefs } from '../data/prefs';
import { GLOSSARY, TermKey } from '../engine/glossary';
import { INVESTOR } from '../engine/investor';
import { useNav } from '../nav/context';
import { TopBar } from '../ui/Bars';
import { Icon } from '../ui/Icon';
import { Card, Divider, T, Tap } from '../ui/kit';
import { c, f } from '../ui/theme';

const GUIDES: { emoji: string; title: string; body: string[] }[] = [
  {
    emoji: '🍰',
    title: '주식이 뭐예요?',
    body: [
      '주식은 회사를 아주 잘게 나눈 조각이에요. 한 주를 사면 그 회사의 아주 작은 주인이 되는 거예요.',
      '회사가 돈을 잘 벌고 커지면 조각의 값(주가)이 오르고, 번 돈의 일부를 배당으로 나눠 받기도 해요.',
      '반대로 회사가 어려워지면 주가가 떨어져서 산 값보다 적게 돌려받을 수 있어요. 원금이 보장되지 않아요.',
    ],
  },
  {
    emoji: '✅',
    title: '처음 살 때 꼭 볼 3가지',
    body: [
      '1. 무슨 일로 돈을 버는 회사인지 한 문장으로 말할 수 있나요? 모르는 회사는 사지 않는 게 좋아요.',
      '2. 돈을 벌고 있나요? 상세 화면의 "실적" 점수와 PER이 "적자"가 아닌지 확인해요.',
      '3. 얼마나 흔들리나요? "안정" 점수와 변동성을 보고, 반토막이 나도 버틸 수 있는 만큼만 사요.',
    ],
  },
  {
    emoji: '🧺',
    title: '달걀을 한 바구니에 담지 마세요',
    body: [
      '한 종목에 다 넣으면 그 회사에 문제가 생겼을 때 크게 잃어요. 업종이 다른 여러 종목에 나눠 담는 걸 분산투자라고 해요.',
      '한 번에 다 사지 말고 몇 번에 나눠 사면 비싸게 몰아서 사는 걸 피할 수 있어요.',
      '처음에는 전체 돈의 일부만, 잃어도 생활에 지장 없는 돈으로 시작해요.',
    ],
  },
  {
    emoji: '🌏',
    title: '국내 주식과 해외 주식, 뭐가 달라요?',
    body: [
      '해외(미국) 주식은 달러로 사고팔아서 주가뿐 아니라 환율에 따라서도 수익이 달라져요.',
      '미국 주식은 국내 증권사 앱에서 0.1주처럼 소수점으로도 살 수 있어서 비싼 종목도 적은 돈으로 시작할 수 있어요.',
      '세금도 달라요. 해외 주식은 1년 동안 번 돈이 일정 금액을 넘으면 따로 양도소득세를 신고해야 해요.',
    ],
  },
  {
    emoji: '🎒',
    title: '학생도 주식 할 수 있어요?',
    body: [
      '만 19세 미만은 부모님(법정대리인) 동의를 받아 미성년자 계좌를 만들 수 있어요. 보통 부모님과 함께 증권사나 은행에 가거나 앱으로 신청해요.',
      '용돈으로 시작한다면 "학생 추천" 목록처럼 잘 알려지고 덜 흔들리는 큰 회사부터 소액으로 경험해 보는 게 좋아요.',
      '돈을 불리는 것보다 "왜 오르고 왜 내리는지" 공부하는 게 처음엔 더 큰 수익이에요.',
    ],
  },
  {
    emoji: '🧮',
    title: '이 앱의 점수는 어떻게 매겨요?',
    body: [
      '같은 시장(국내끼리, 해외끼리) 대형주 40개 안에서 흐름·가치·실적·안정·배당 다섯 과목을 0~100점으로 매겨요.',
      '각 숫자가 40개 중 몇 등쯤인지를 점수로 바꾼 거라, 50점이면 딱 중간이에요.',
      '추천 목록은 목적에 따라 과목 비중을 다르게 섞은 순위예요. 과거 숫자로 만든 참고용이라 앞으로 오른다는 보장은 없어요.',
    ],
  },
];

export function LearnScreen() {
  const nav = useNav();
  const { investor } = usePrefs();
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState('');
  const terms = (Object.keys(GLOSSARY) as TermKey[]).filter((k) => {
    const t = GLOSSARY[k];
    return !q.trim() || (t.name + t.short).toLowerCase().includes(q.trim().toLowerCase());
  });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <TopBar title="주식 공부" />
      <View style={{ padding: 16, gap: 12 }}>
        <Tap onPress={() => nav.push({ name: 'test' })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <T size={34} style={{ lineHeight: 44 }}>
              {investor ? INVESTOR[investor].emoji : '🧭'}
            </T>
            <View style={{ flex: 1 }}>
              <T size={13} color={c.faint}>
                투자 성향 테스트
              </T>
              <T size={17} w="bold">
                {investor ? `나는 ${INVESTOR[investor].name}` : '나는 어떤 투자자일까?'}
              </T>
            </View>
            <Icon name="chevron" color={c.faint} />
          </Card>
        </Tap>

        <Card pad={8}>
          <T size={19} w="bold" style={{ padding: 12, paddingBottom: 4 }}>
            왕초보 가이드
          </T>
          {GUIDES.map((g, i) => (
            <View key={g.title}>
              {i > 0 && <Divider style={{ marginHorizontal: 12 }} />}
              <Tap
                onPress={() => setOpen(open === i ? null : i)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}
              >
                <T size={22} style={{ lineHeight: 30 }}>
                  {g.emoji}
                </T>
                <T size={16} w="semibold" style={{ flex: 1 }}>
                  {g.title}
                </T>
                <View style={{ transform: [{ rotate: open === i ? '90deg' : '0deg' }] }}>
                  <Icon name="chevron" size={18} color={c.faint} />
                </View>
              </Tap>
              {open === i && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
                  {g.body.map((b) => (
                    <T key={b} size={15} color={c.sub}>
                      {b}
                    </T>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Card>

        <Card pad={8}>
          <T size={19} w="bold" style={{ padding: 12, paddingBottom: 8 }}>
            용어 사전
          </T>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: c.soft,
              borderRadius: 12,
              marginHorizontal: 12,
              marginBottom: 4,
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            <Icon name="search" size={18} color={c.faint} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="PER, 배당, 변동성…"
              placeholderTextColor={c.faint}
              style={{ flex: 1, paddingVertical: 11, fontSize: 15, fontFamily: f.regular, color: c.text }}
            />
          </View>
          {terms.map((k) => (
            <Tap key={k} onPress={() => nav.showTerm(k)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
              <View style={{ flex: 1 }}>
                <T size={15} w="semibold">
                  {GLOSSARY[k].name}
                </T>
                <T size={13} color={c.faint}>
                  {GLOSSARY[k].short}
                </T>
              </View>
              <Icon name="chevron" size={18} color={c.faint} />
            </Tap>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
