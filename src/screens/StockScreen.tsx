import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Market, Stock } from '../data/types';
import { usePrefs } from '../data/prefs';
import { memberships, MarketBoard } from '../engine/collections';
import { grade, ok, Rated } from '../engine/factors';
import { fmtPct, fmtPrice } from '../engine/format';
import { allStats, keyStats, oneLiner, Point, points } from '../engine/insights';
import { actionKo, buyShare, consensusLabel, crowdMood, gradeKo, newsMood, targetUpside, timeAgo, voteTotal } from '../engine/outlook';
import { useData, useNav } from '../nav/context';
import { AreaChart } from '../ui/Chart';
import { BackBar, LevelToggle } from '../ui/Bars';
import { Disclaimer } from '../ui/Disclaimer';
import { Radar, ScoreRing, StackBar, TargetRange } from '../ui/Gauges';
import { Icon } from '../ui/Icon';
import { Card, Divider, Logo, Pill, Segmented, T, Tap } from '../ui/kit';
import { LiveBadge } from '../ui/LiveBadge';
import { NewsList } from '../ui/NewsList';
import { c, changeColor, toneColor } from '../ui/theme';

type Period = '1d' | '3m' | '6m' | '1y';
type Section = 'summary' | 'outlook' | 'crowd' | 'stats';
const PERIOD_POINTS: Record<Period, number> = { '1d': 0, '3m': 14, '6m': 27, '1y': 999 };

export function StockScreen({ market, code }: { market: Market; code: string }) {
  const nav = useNav();
  const { boards } = useData();
  const { level, isWatched, toggleWatch } = usePrefs();
  const [period, setPeriod] = useState<Period>('1y');
  const [section, setSection] = useState<Section>('summary');
  const board = boards[market];
  const r = board.byCode.get(code);

  if (!r) {
    return (
      <View style={{ flex: 1 }}>
        <BackBar onBack={nav.back} />
        <T style={{ padding: 20 }} color={c.faint}>
          종목 정보를 찾을 수 없어요.
        </T>
      </View>
    );
  }

  const s = r.stock;
  const m = s.metrics;
  const pro = level === 'pro';
  const watched = isWatched(market, code);
  const intraday = s.live?.intraday ?? [];
  const chart = period === '1d' ? intraday : s.spark.slice(-PERIOD_POINTS[period]);
  const periodRet = period === '1d' ? m.change1d : chart.length > 1 ? (chart[chart.length - 1] / chart[0] - 1) * 100 : null;

  return (
    <View style={{ flex: 1 }}>
      <BackBar
        onBack={nav.back}
        title={s.name}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <LevelToggle />
            <Tap
              onPress={() => toggleWatch(market, code)}
              hitSlop={10}
              style={{ padding: 8 }}
              accessibilityLabel={watched ? '관심 종목에서 빼기' : '관심 종목에 추가'}
            >
              <Icon name={watched ? 'heartFill' : 'heart'} color={watched ? c.up : c.faint} />
            </Tap>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} stickyHeaderIndices={[1]}>
        {/* 가격 + 그래프 */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <Logo name={s.name} code={s.code} size={44} />
            <View style={{ flex: 1 }}>
              <T size={13} color={c.faint}>
                {s.code} · {s.sector}
              </T>
              <T size={28} w="bold" style={{ lineHeight: 34, letterSpacing: -0.6 }}>
                {fmtPrice(m.price, s.currency)}
              </T>
            </View>
            <View
              style={{
                backgroundColor: m.change1d && m.change1d < 0 ? c.downSoft : c.upSoft,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <T size={15} w="bold" color={changeColor(m.change1d)}>
                {fmtPct(m.change1d, 2)}
              </T>
            </View>
          </View>
          {s.live && (
            <View style={{ marginTop: 10 }}>
              <LiveBadge open={s.live.state === 'OPEN'} t={s.live.t ? s.live.t * 1000 : null} />
            </View>
          )}
          <View style={{ marginTop: 16 }}>
            <AreaChart data={chart} height={170} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
            <Segmented<Period>
              value={period}
              onChange={setPeriod}
              options={[
                ...(intraday.length > 1 ? [{ value: '1d' as Period, label: '오늘' }] : []),
                { value: '3m', label: '3개월' },
                { value: '6m', label: '6개월' },
                { value: '1y', label: '1년' },
              ]}
              style={{ flex: 1 }}
            />
            <T size={14} w="bold" color={changeColor(periodRet)} style={{ minWidth: 64, textAlign: 'right' }}>
              {fmtPct(periodRet, 1)}
            </T>
          </View>
        </View>

        {/* 섹션 탭 (스크롤해도 위에 붙어 있음) */}
        <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 4, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <View style={{ flexDirection: 'row' }}>
            {(
              [
                ['summary', '요약'],
                ['outlook', '전망'],
                ['crowd', '반응·뉴스'],
                ['stats', '지표'],
              ] as [Section, string][]
            ).map(([k, label]) => {
              const on = section === k;
              return (
                <Tap key={k} onPress={() => setSection(k)} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
                  <T size={15} w={on ? 'bold' : 'semibold'} color={on ? c.text : c.faint}>
                    {label}
                  </T>
                  <View style={{ height: 3, width: 32, borderRadius: 2, marginTop: 8, backgroundColor: on ? c.accent : 'transparent' }} />
                </Tap>
              );
            })}
          </View>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          {section === 'summary' && <Summary r={r} board={board} pro={pro} />}
          {section === 'outlook' && <OutlookView s={s} pro={pro} />}
          {section === 'crowd' && <CrowdView s={s} />}
          {section === 'stats' && <StatsView s={s} pro={pro} />}
          <Disclaimer />
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------- 요약 ----------------
function Summary({ r, board, pro }: { r: Rated; board: MarketBoard; pro: boolean }) {
  const nav = useNav();
  const s = r.stock;
  const pts = points(s);
  const good = pts.filter((x) => x.good).slice(0, pro ? 6 : 3);
  const bad = pts.filter((x) => !x.good).slice(0, pro ? 6 : 3);
  const g = grade(r.total);
  const tone = toneColor[g.tone];
  const inLists = memberships(board, s.code);
  const cons = consensusLabel(s.outlook);
  const cm = crowdMood(s.crowd);
  const up = targetUpside(s);

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <ScoreRing value={r.total} size={84} label="종합" />
          <View style={{ flex: 1 }}>
            <T size={13} color={c.faint}>
              {s.market === 'KR' ? '국내' : '해외'} 후보 {board.rated.length}개 중
            </T>
            <T size={22} w="bold" color={tone.fg}>
              {g.label}
            </T>
          </View>
        </View>
        <T size={15} w="semibold" style={{ marginTop: 16, lineHeight: 23 }}>
          {oneLiner(r, pts)}
        </T>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Eye label="성적표" value={`${r.total}점`} sub={g.label} />
          <Eye
            label="전문가 의견"
            value={cons ? cons.label.replace(' (보유)', '') : '정보 없음'}
            sub={ok(up) ? `목표가 ${fmtPct(up, 0)}` : ''}
            color={cons?.tone === 'up' ? c.up : cons?.tone === 'down' ? c.down : undefined}
          />
          <Eye
            label="투자자 반응"
            value={cm?.bullPct != null ? `낙관 ${Math.round(cm.bullPct)}%` : '정보 없음'}
            sub={s.crowd ? `글 ${s.crowd.posts}개` : ''}
            color={cm?.tone === 'up' ? c.up : cm?.tone === 'down' ? c.down : undefined}
          />
        </View>
      </Card>

      <Card>
        <T size={17} w="bold">
          다섯 과목 성적
        </T>
        <T size={12} color={c.faint}>
          같은 시장 후보들과 비교한 점수예요. 50점이 딱 중간이에요.
        </T>
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <Radar f={r.f} size={250} />
        </View>
        {r.coverage < 0.6 && (
          <T size={12} color={c.warn} style={{ marginTop: 4 }}>
            ⚠️ 빠진 데이터가 많아서 점수가 덜 정확할 수 있어요.
          </T>
        )}
      </Card>

      <Card>
        <T size={17} w="bold" style={{ marginBottom: 6 }}>
          👍 이런 점이 좋아요
        </T>
        {good.length ? good.map((p) => <PointRow key={p.title} p={p} pro={pro} />) : <Empty text="눈에 띄게 좋은 점은 아직 없어요." />}
        <Divider style={{ marginVertical: 14 }} />
        <T size={17} w="bold" style={{ marginBottom: 6 }}>
          ✋ 이런 점은 조심하세요
        </T>
        {bad.length ? bad.map((p) => <PointRow key={p.title} p={p} pro={pro} />) : <Empty text="크게 걱정할 점은 보이지 않아요." />}
      </Card>

      {inLists.length > 0 && (
        <Card>
          <T size={17} w="bold" style={{ marginBottom: 10 }}>
            이런 추천 목록에 들어 있어요
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {inLists.map(({ c: col, rank }) => (
              <Tap
                key={col.id}
                onPress={() => nav.push({ name: 'collection', market: s.market, id: col.id })}
                style={{ backgroundColor: c.accentSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <T size={14} w="semibold" color={c.accent}>
                  {col.emoji} {col.title} {rank}위
                </T>
              </Tap>
            ))}
          </View>
        </Card>
      )}
    </>
  );
}

function Eye({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.raised, borderRadius: 14, padding: 12 }}>
      <T size={11} color={c.faint} numberOfLines={1}>
        {label}
      </T>
      <T size={15} w="bold" color={color ?? c.text} numberOfLines={1}>
        {value}
      </T>
      {sub ? (
        <T size={11} color={c.sub} numberOfLines={1}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

// ---------------- 전망 ----------------
function OutlookView({ s, pro }: { s: Stock; pro: boolean }) {
  const o = s.outlook;
  const m = s.metrics;
  const cons = consensusLabel(o);
  const n = voteTotal(o);
  const share = buyShare(o);
  const up = targetUpside(s);
  const mean = o?.targetMean ?? m.targetPrice;

  if (!o && !ok(mean)) {
    return (
      <Card>
        <T size={15} color={c.faint}>
          이 종목은 애널리스트 전망 정보가 아직 없어요. 다음 데이터 업데이트 때 다시 확인해 보세요.
        </T>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <T size={13} color={c.faint}>
          증권사 애널리스트 {o?.analysts ?? (n || m.analystCount || 0)}명의 평균 의견
        </T>
        <T size={28} w="bold" color={cons?.tone === 'up' ? c.up : cons?.tone === 'down' ? c.down : c.text} style={{ marginTop: 2 }}>
          {cons?.label ?? '정보 없음'}
        </T>
        {o?.votes && n > 0 && (
          <View style={{ marginTop: 16 }}>
            <StackBar
              height={12}
              parts={[
                { value: o.votes.strongBuy, color: '#FF3B3B' },
                { value: o.votes.buy, color: '#FF8A8A' },
                { value: o.votes.hold, color: c.faint },
                { value: o.votes.sell, color: '#8CC0FF' },
                { value: o.votes.strongSell, color: '#3A86FF' },
              ]}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Vote k="적극 매수" v={o.votes.strongBuy} color="#FF3B3B" />
              <Vote k="매수" v={o.votes.buy} color="#FF8A8A" />
              <Vote k="보유" v={o.votes.hold} color={c.faint} />
              <Vote k="매도" v={o.votes.sell} color="#8CC0FF" />
              <Vote k="적극 매도" v={o.votes.strongSell} color="#3A86FF" />
            </View>
            {share != null && (
              <T size={14} color={c.sub} style={{ marginTop: 12 }}>
                이번 달 의견 {n}개 중 {Math.round(share)}%가 &quot;사라&quot;였어요.
              </T>
            )}
          </View>
        )}
      </Card>

      {ok(mean) && (
        <Card>
          <T size={17} w="bold">
            목표주가
          </T>
          <T size={14} color={c.sub} style={{ marginTop: 4 }}>
            평균 목표가는 {fmtPrice(mean, s.currency)}로, 지금보다{' '}
            <T size={14} w="bold" color={changeColor(up)}>
              {fmtPct(up, 1)}
            </T>{' '}
            {up != null && up >= 0 ? '높아요' : '낮아요'}.
          </T>
          {ok(o?.targetLow) && ok(o?.targetHigh) && (
            <TargetRange low={o.targetLow} mean={mean} high={o.targetHigh} now={m.price} currency={s.currency} />
          )}
          <T size={12} color={c.faint} style={{ marginTop: 12 }}>
            흰 점이 지금 가격이에요. 목표가는 보통 1년 뒤를 보고 내고, 실제보다 낙관적인 경우가 많아요.
          </T>
        </Card>
      )}

      {(ok(o?.epsGrowthThisYear) || ok(o?.epsGrowthNextYear) || ok(o?.revGrowthNextYear)) && (
        <Card>
          <T size={17} w="bold" style={{ marginBottom: 12 }}>
            실적 전망
          </T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Grow label="올해 이익" v={o?.epsGrowthThisYear} />
            <Grow label="내년 이익" v={o?.epsGrowthNextYear} />
            <Grow label="내년 매출" v={o?.revGrowthNextYear} />
          </View>
          <T size={12} color={c.faint} style={{ marginTop: 10 }}>
            애널리스트들이 예상한 전년 대비 성장률 평균이에요.
          </T>
        </Card>
      )}

      {o?.changes && o.changes.length > 0 && (
        <Card>
          <T size={17} w="bold" style={{ marginBottom: 4 }}>
            최근 투자의견 변화
          </T>
          {o.changes.slice(0, pro ? 6 : 4).map((ch, i) => {
            const color = ch.action === 'up' ? c.up : ch.action === 'down' ? c.down : c.sub;
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: c.line,
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <T size={14} w="semibold">
                    {ch.firm}
                  </T>
                  <T size={12} color={c.faint}>
                    {timeAgo(ch.t)}
                  </T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T size={13} w="bold" color={color}>
                    {actionKo(ch.action)}
                  </T>
                  <T size={12} color={c.sub}>
                    {ch.from && ch.from !== ch.to ? `${gradeKo(ch.from)} → ` : ''}
                    {gradeKo(ch.to) ?? ''}
                  </T>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

function Vote({ k, v, color }: { k: string; v: number; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <T size={16} w="bold" color={color}>
        {v}
      </T>
      <T size={11} color={c.faint}>
        {k}
      </T>
    </View>
  );
}

function Grow({ label, v }: { label: string; v: number | null | undefined }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.raised, borderRadius: 14, padding: 12 }}>
      <T size={12} color={c.faint}>
        {label}
      </T>
      <T size={17} w="bold" color={changeColor(v)}>
        {fmtPct(v, 0)}
      </T>
    </View>
  );
}

// ---------------- 반응·뉴스 ----------------
function CrowdView({ s }: { s: Stock }) {
  const cr = s.crowd;
  const cm = crowdMood(cr);
  const nm = newsMood(s.news);
  return (
    <>
      <Card>
        <T size={13} color={c.faint}>
          {cr ? `${cr.source} 최근 글 ${cr.posts}개` : '투자자 반응'}
        </T>
        {cm && cr ? (
          <>
            <T size={22} w="bold" style={{ marginTop: 2 }} color={cm.tone === 'up' ? c.up : cm.tone === 'down' ? c.down : c.text}>
              {cm.label}
            </T>
            {cm.bullPct != null && (
              <View style={{ marginTop: 16 }}>
                <StackBar
                  height={12}
                  parts={[
                    { value: cr.bull, color: c.up },
                    { value: cr.bear, color: c.down },
                  ]}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <T size={14} w="bold" color={c.up}>
                    오른다 {Math.round(cm.bullPct)}%
                  </T>
                  <T size={14} w="bold" color={c.down}>
                    {100 - Math.round(cm.bullPct)}% 내린다
                  </T>
                </View>
              </View>
            )}
            <T size={12} color={c.faint} style={{ marginTop: 12 }}>
              판단 방법: {cr.method}. 의견이 드러나지 않은 글 {cr.posts - cr.bull - cr.bear}개는 뺐어요.
              {cr.watchers ? ` 이 종목을 관심 등록한 사람 ${cr.watchers.toLocaleString('ko-KR')}명.` : ''} 개인 투자자 의견이라 근거 없는
              글도 섞여 있어요.
            </T>
          </>
        ) : (
          <T size={15} color={c.faint} style={{ marginTop: 6 }}>
            이 종목은 투자자 반응을 아직 모으지 못했어요.
          </T>
        )}
      </Card>

      <Card>
        <T size={17} w="bold">
          최근 뉴스
        </T>
        {nm && (
          <T size={13} color={c.sub} style={{ marginTop: 2 }}>
            {nm.label} · 좋은 소식 {nm.pos} · 걱정 {nm.neg} · 중립 {nm.neutral}
          </T>
        )}
        {s.news && s.news.length > 0 ? (
          <>
            {s.news.some((n) => n.rel !== false) && (
              <View style={{ marginTop: 6 }}>
                <NewsList items={s.news.filter((n) => n.rel !== false)} />
              </View>
            )}
            {s.news.some((n) => n.rel === false) && (
              <>
                <T size={13} w="bold" color={c.faint} style={{ marginTop: 14 }}>
                  관련 업종·시장 뉴스
                </T>
                <NewsList items={s.news.filter((n) => n.rel === false)} />
              </>
            )}
            <T size={12} color={c.faint} style={{ marginTop: 6 }}>
              제목을 누르면 기사 원문이 열려요. 점 색은 제목에 들어간 단어로 정한 거라 실제 내용과 다를 수 있어요.
            </T>
          </>
        ) : (
          <T size={15} color={c.faint} style={{ marginTop: 6 }}>
            모아 둔 뉴스가 아직 없어요.
          </T>
        )}
      </Card>
    </>
  );
}

// ---------------- 지표 ----------------
function StatsView({ s, pro }: { s: Stock; pro: boolean }) {
  const m = s.metrics;
  return (
    <>
      <Card>
        <T size={17} w="bold" style={{ marginBottom: 4 }}>
          {pro ? '전체 지표' : '꼭 봐야 할 숫자 6개'}
        </T>
        <T size={13} color={c.faint} style={{ marginBottom: 12 }}>
          이름을 누르면 무슨 뜻인지 알려 드려요
        </T>
        {pro ? <ProStats stock={s} /> : <EasyStats stock={s} />}
      </Card>
      {ok(m.low52) && ok(m.high52) && (
        <Card>
          <RangeBar low={m.low52} high={m.high52} now={m.price} currency={s.currency} />
        </Card>
      )}
    </>
  );
}

function PointRow({ p, pro }: { p: Point; pro: boolean }) {
  const nav = useNav();
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 9, backgroundColor: p.good ? c.accent : c.warn }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T size={15} w="semibold">
            {p.title}
          </T>
          {p.term && (
            <Tap onPress={() => nav.showTerm(p.term!)} hitSlop={8} accessibilityLabel="용어 설명">
              <Icon name="info" size={16} color={c.faint} />
            </Tap>
          )}
        </View>
        <T size={14} color={c.sub}>
          {p.easy}
        </T>
        {pro && (
          <T size={13} color={c.faint} style={{ marginTop: 2 }}>
            {p.detail}
          </T>
        )}
      </View>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <T size={14} color={c.faint} style={{ paddingVertical: 6 }}>
      {text}
    </T>
  );
}

function EasyStats({ stock }: { stock: Stock }) {
  const nav = useNav();
  const judgeColor = { good: c.accent, soso: c.warn, bad: c.up, none: c.faint };
  const judgeLabel = { good: '좋아요', soso: '보통', bad: '아쉬워요', none: '' };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {keyStats(stock).map((k) => (
        <Tap
          key={k.label}
          onPress={() => k.term && nav.showTerm(k.term)}
          disabled={!k.term}
          style={{ width: '48%', flexGrow: 1, backgroundColor: c.raised, borderRadius: 14, padding: 14 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T size={13} color={c.sub}>
              {k.label}
            </T>
            {k.judge !== 'none' && <Pill label={judgeLabel[k.judge]} fg={judgeColor[k.judge]} bg={c.card} />}
          </View>
          <T size={18} w="bold" style={{ marginTop: 4 }}>
            {k.value}
          </T>
          <T size={12} color={c.faint}>
            {k.plain}
          </T>
        </Tap>
      ))}
    </View>
  );
}

function ProStats({ stock }: { stock: Stock }) {
  const nav = useNav();
  return (
    <View style={{ gap: 16 }}>
      {allStats(stock).map((g) => (
        <View key={g.group}>
          <T size={13} w="bold" color={c.accent} style={{ marginBottom: 4 }}>
            {g.group}
          </T>
          {g.rows.map((row) => (
            <Tap
              key={row.label}
              disabled={!row.term}
              onPress={() => row.term && nav.showTerm(row.term)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 }}
            >
              <T size={14} color={c.sub} style={row.term ? { textDecorationLine: 'underline', textDecorationStyle: 'dotted' } : undefined}>
                {row.label}
              </T>
              <T size={14} w="semibold">
                {row.value}
              </T>
            </Tap>
          ))}
        </View>
      ))}
    </View>
  );
}

function RangeBar({ low, high, now, currency }: { low: number; high: number; now: number; currency: string }) {
  const p = Math.max(0, Math.min(1, (now - low) / (high - low || 1)));
  return (
    <View>
      <T size={17} w="bold" style={{ marginBottom: 14 }}>
        1년 중 지금 가격 위치
      </T>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.raised }}>
        <View
          style={{
            position: 'absolute',
            left: `${p * 100}%`,
            top: -5,
            width: 16,
            height: 16,
            marginLeft: -8,
            borderRadius: 8,
            backgroundColor: c.text,
            borderWidth: 3,
            borderColor: c.card,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <T size={12} color={c.down}>
          1년 최저 {fmtPrice(low, currency)}
        </T>
        <T size={12} color={c.up}>
          1년 최고 {fmtPrice(high, currency)}
        </T>
      </View>
    </View>
  );
}
