import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { usePrefs } from '../data/prefs';
import { COLLECTIONS, collectionById, CollectionId } from '../engine/collections';
import { ok } from '../engine/factors';
import { fmtDate, fmtPct } from '../engine/format';
import { oneLiner, points } from '../engine/insights';
import { INVESTOR } from '../engine/investor';
import { buyShare, crowdMood } from '../engine/outlook';
import { useData, useNav } from '../nav/context';
import { LevelToggle, MarketSwitch } from '../ui/Bars';
import { Spark } from '../ui/Chart';
import { Disclaimer } from '../ui/Disclaimer';
import { ScoreRing, StackBar } from '../ui/Gauges';
import { Icon } from '../ui/Icon';
import { Card, Chip, Divider, Segmented, T, Tap } from '../ui/kit';
import { NewsList } from '../ui/NewsList';
import { StockRow } from '../ui/StockRow';
import { c, changeColor } from '../ui/theme';

export function HomeScreen() {
  const { market, investor } = usePrefs();
  const { boards, data, state, refresh } = useData();
  const nav = useNav();
  const board = boards[market];
  const [col, setCol] = useState<CollectionId>('expert');
  const [moverDir, setMoverDir] = useState<'up' | 'down'>('up');

  // ----- 시장 분위기 -----
  const changes = board.rated.map((r) => r.stock.metrics.change1d).filter(ok);
  const upCount = changes.filter((v) => v > 0).length;
  const downCount = changes.filter((v) => v < 0).length;
  const avg = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const share = changes.length ? upCount / changes.length : 0.5;
  const mood =
    share >= 0.7
      ? '대부분 올랐어요'
      : share >= 0.5
        ? '오른 종목이 조금 더 많아요'
        : share >= 0.3
          ? '내린 종목이 조금 더 많아요'
          : '대부분 내렸어요';

  const top = board.lists.buy.slice(0, 5);
  const movers = [...board.rated]
    .filter((r) => ok(r.stock.metrics.change1d))
    .sort((a, b) => (moverDir === 'up' ? 1 : -1) * ((b.stock.metrics.change1d ?? 0) - (a.stock.metrics.change1d ?? 0)))
    .slice(0, 5);

  // 시장 전체 최신 뉴스
  const feed = board.rated
    .flatMap((r) => (r.stock.news ?? []).filter((n) => n.rel).map((n) => ({ ...n, tag: r.stock.name })))
    .filter((n) => n.t)
    .sort((a, b) => (b.t ?? 0) - (a.t ?? 0))
    .filter((n, i, arr) => arr.findIndex((x) => x.title === n.title) === i)
    .slice(0, 6);

  const mine = investor ? INVESTOR[investor] : null;
  const curCol = collectionById(col);
  const today = new Date(data.generatedAt);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
      {/* 머리글 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
          <T size={16} w="bold" color={c.accentInk} style={{ lineHeight: 20 }}>
            ↗
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T size={18} w="bold" style={{ lineHeight: 22 }}>
            주식 도우미
          </T>
          <T size={12} color={c.faint} style={{ lineHeight: 16 }}>
            {today.getMonth() + 1}월 {today.getDate()}일 장 마감 기준
          </T>
        </View>
        <LevelToggle />
      </View>
      <MarketSwitch />

      <View style={{ padding: 16, gap: 14 }}>
        {/* 시장 분위기 */}
        <Card>
          <T size={13} color={c.faint}>
            오늘 {market === 'KR' ? '국내' : '미국'} 대형주 {changes.length}개 평균
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 2 }}>
            <T size={40} w="bold" color={changeColor(avg)} style={{ lineHeight: 48, letterSpacing: -1 }}>
              {fmtPct(avg, 2)}
            </T>
            <T size={15} w="semibold" color={c.sub} style={{ marginBottom: 8 }}>
              {mood}
            </T>
          </View>
          <View style={{ marginTop: 14 }}>
            <StackBar
              height={8}
              parts={[
                { value: upCount, color: c.up },
                { value: changes.length - upCount - downCount, color: c.faint },
                { value: downCount, color: c.down },
              ]}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <T size={13} w="semibold" color={c.up}>
                ▲ 오름 {upCount}
              </T>
              <T size={13} w="semibold" color={c.down}>
                내림 {downCount} ▼
              </T>
            </View>
          </View>
          <Tap
            onPress={refresh}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}
            accessibilityLabel="새로고침"
          >
            <T size={12} color={c.faint}>
              {fmtDate(data.generatedAt)} 업데이트 · {state === 'loading' ? '불러오는 중…' : state === 'offline' ? '저장된 데이터' : '최신'}
            </T>
            <Icon name="refresh" size={14} color={c.faint} />
          </Tap>
        </Card>

        {/* 오늘의 추천 캐러셀 */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, paddingHorizontal: 4 }}>
            <View style={{ flex: 1 }}>
              <T size={12} w="bold" color={c.accent} style={{ letterSpacing: 1 }}>
                TODAY'S PICKS
              </T>
              <T size={20} w="bold">
                지금 사기 좋은 종목
              </T>
            </View>
            <Tap onPress={() => nav.push({ name: 'collection', market, id: 'buy' })} hitSlop={8}>
              <T size={13} w="semibold" color={c.faint}>
                전체 보기
              </T>
            </Tap>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            style={{ marginHorizontal: -16, paddingLeft: 16 }}
          >
            {top.map((p) => {
              const s = p.rated.stock;
              const bs = buyShare(s.outlook);
              const cm = crowdMood(s.crowd);
              return (
                <Tap
                  key={s.code}
                  onPress={() => nav.push({ name: 'stock', market, code: s.code })}
                  style={{ width: 252, backgroundColor: c.card, borderRadius: 22, borderWidth: 1, borderColor: c.line, padding: 18 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <T size={12} w="bold" color={c.faint}>
                        #{p.rank} · {s.sector}
                      </T>
                      <T size={19} w="bold" numberOfLines={1}>
                        {s.name}
                      </T>
                      <T size={13} w="semibold" color={changeColor(s.metrics.change1d)}>
                        {fmtPct(s.metrics.change1d)} 오늘
                      </T>
                    </View>
                    <ScoreRing value={p.score} size={54} />
                  </View>
                  <View style={{ marginVertical: 12 }}>
                    <Spark data={s.spark.slice(-26)} width={214} height={44} />
                  </View>
                  <T size={13} color={c.sub} numberOfLines={3} style={{ minHeight: 56 }}>
                    {oneLiner(p.rated, points(s))}
                  </T>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {bs != null && <Tag text={`전문가 매수 ${Math.round(bs)}%`} />}
                    {cm?.bullPct != null && <Tag text={`투자자 낙관 ${Math.round(cm.bullPct)}%`} />}
                  </View>
                </Tap>
              );
            })}
          </ScrollView>
        </View>

        {/* 목적별 목록 */}
        <Card pad={18}>
          <T size={20} w="bold" style={{ marginBottom: 12 }}>
            목적별로 골라보기
          </T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {COLLECTIONS.filter((x) => x.id !== 'buy').map((x) => (
              <Chip key={x.id} label={`${x.emoji} ${x.title}`} on={col === x.id} onPress={() => setCol(x.id)} />
            ))}
          </ScrollView>
          <T size={13} color={c.faint} style={{ marginTop: 12 }}>
            {curCol.desc}
          </T>
          {board.lists[col].length === 0 && (
            <T size={14} color={c.faint} style={{ paddingVertical: 16 }}>
              지금 기준에 맞는 종목이 없어요.
            </T>
          )}
          {board.lists[col].slice(0, 5).map((p) => (
            <StockRow key={p.rated.stock.code} stock={p.rated.stock} rank={p.rank} score={p.score} right="score" />
          ))}
          <MoreButton onPress={() => nav.push({ name: 'collection', market, id: col })} label={`${curCol.title} 전체 보기`} />
        </Card>

        {/* 학생 추천 */}
        <Card pad={18}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T size={28} style={{ lineHeight: 36 }}>
              🎒
            </T>
            <View style={{ flex: 1 }}>
              <T size={18} w="bold">
                학생 추천 종목
              </T>
              <T size={13} color={c.faint}>
                용돈으로 시작하기 좋은, 잘 알려진 튼튼한 회사
              </T>
            </View>
          </View>
          {board.lists.student.slice(0, 3).map((p) => (
            <StockRow key={p.rated.stock.code} stock={p.rated.stock} rank={p.rank} score={p.score} right="score" />
          ))}
          <MoreButton onPress={() => nav.push({ name: 'collection', market, id: 'student' })} />
        </Card>

        {/* 성향 */}
        {mine ? (
          <Card pad={18}>
            <Tap onPress={() => nav.push({ name: 'test' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <T size={13} w="semibold" color={c.accent}>
                {mine.emoji} {mine.name} 맞춤
              </T>
              <T size={12} color={c.faint}>
                다시 하기
              </T>
            </Tap>
            <T size={18} w="bold">
              나에게 맞는 {collectionById(mine.list).title} 종목
            </T>
            {board.lists[mine.list].slice(0, 3).map((p) => (
              <StockRow key={p.rated.stock.code} stock={p.rated.stock} rank={p.rank} score={p.score} right="score" />
            ))}
          </Card>
        ) : (
          <Tap onPress={() => nav.push({ name: 'test' })}>
            <View style={{ backgroundColor: c.accent, borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <T size={32} style={{ lineHeight: 40 }}>
                🧭
              </T>
              <View style={{ flex: 1 }}>
                <T size={17} w="bold" color={c.accentInk}>
                  나에게 맞는 종목 찾기
                </T>
                <T size={13} color={c.accentInk} style={{ opacity: 0.75 }}>
                  4문제로 투자 성향을 알아보고 맞춤 추천을 받아요
                </T>
              </View>
              <Icon name="chevron" color={c.accentInk} />
            </View>
          </Tap>
        )}

        {/* 최신 뉴스 */}
        {feed.length > 0 && (
          <Card pad={18}>
            <T size={20} w="bold">
              지금 나온 뉴스
            </T>
            <T size={12} color={c.faint} style={{ marginBottom: 4 }}>
              빨간 점은 좋은 소식, 파란 점은 걱정스러운 소식 단어가 들어간 제목이에요
            </T>
            <NewsList items={feed} tag />
          </Card>
        )}

        {/* 많이 움직인 */}
        <Card pad={18}>
          <T size={20} w="bold" style={{ marginBottom: 12 }}>
            오늘 많이 움직인 종목
          </T>
          <Segmented
            value={moverDir}
            onChange={setMoverDir}
            options={[
              { value: 'up', label: '많이 오른' },
              { value: 'down', label: '많이 내린' },
            ]}
          />
          <View style={{ marginTop: 6 }}>
            {movers.map((r, i) => (
              <StockRow key={r.stock.code} stock={r.stock} rank={i + 1} />
            ))}
          </View>
        </Card>

        <Disclaimer />
      </View>
    </ScrollView>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: c.raised, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <T size={11} w="semibold" color={c.sub}>
        {text}
      </T>
    </View>
  );
}

function MoreButton({ onPress, label = '더 보기' }: { onPress: () => void; label?: string }) {
  return (
    <>
      <Divider style={{ marginTop: 6 }} />
      <Tap onPress={onPress} style={{ paddingTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <T size={14} w="semibold" color={c.sub}>
          {label}
        </T>
        <Icon name="chevron" size={16} color={c.sub} />
      </Tap>
    </>
  );
}
