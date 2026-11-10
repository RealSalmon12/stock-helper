import { Linking, View } from 'react-native';
import { NewsItem } from '../data/types';
import { timeAgo } from '../engine/outlook';
import { T, Tap } from './kit';
import { c } from './theme';

/** 뉴스 제목 목록. 누르면 기사 원문을 엽니다. */
export function NewsList({ items, tag }: { items: (NewsItem & { tag?: string })[]; tag?: boolean }) {
  return (
    <View>
      {items.map((n, i) => (
        <Tap
          key={n.url + i}
          onPress={() => Linking.openURL(n.url).catch(() => {})}
          style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}
          accessibilityRole="link"
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              marginTop: 9,
              backgroundColor: n.tone > 0 ? c.up : n.tone < 0 ? c.down : c.faint,
            }}
          />
          <View style={{ flex: 1 }}>
            <T size={15} w="semibold" numberOfLines={2}>
              {n.title}
            </T>
            <T size={12} color={c.faint} style={{ marginTop: 3 }}>
              {tag && n.tag ? `${n.tag} · ` : ''}
              {n.source}
              {n.t ? ` · ${timeAgo(n.t)}` : ''}
            </T>
          </View>
        </Tap>
      ))}
    </View>
  );
}
