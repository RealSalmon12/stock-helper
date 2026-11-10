# 주식 도우미

초보부터 고수까지 쓸 수 있는 주식 종목 추천 앱입니다. Expo(React Native)로 iOS, Android, 웹을 한 코드로 만듭니다.

> 이 앱의 정보는 투자 조언이 아닌 참고용 정보입니다.

## 웹으로 보기

설치 없이 [realsalmon12.github.io/stock-helper](https://realsalmon12.github.io/stock-helper/)에서 바로 볼 수 있어요. `main`이 바뀌면 자동으로 다시 올라갑니다.

## 실행

```bash
npm install
npm run web      # 웹 브라우저
npm run android  # 안드로이드 (Expo Go)
npm run ios      # iOS (Expo Go, 또는 macOS)
```

## 화면 (어두운 테마)

- **홈**: 오늘 시장 날씨, 내 투자 성향 맞춤 추천, 오늘의 추천 TOP 3, 목적별 추천 목록 7개(전문가가 주목하는 포함), 최신 뉴스, 학생 추천·안정적인 종목, 오늘 많이 움직인 종목
- **종목 찾기**: 검색, 정렬(종합 점수·등락·안정성·배당·PER·회사 크기), 업종별 보기
- **관심**: 하트를 누른 종목 모아 보기 (기기에 저장)
- **공부**: 왕초보 가이드, 용어 사전, 투자 성향 테스트
- **종목 상세**: 가격 그래프, 그리고 네 가지 탭
  - 요약: 종합 점수, 다섯 과목 오각형 그래프, 좋은 점/조심할 점
  - 전망: 애널리스트 의견 분포, 목표가 범위, 실적 전망, 최근 투자의견 변경
  - 반응·뉴스: 투자자 낙관/비관 비율(네이버 종목토론, StockTwits), 최근 뉴스
  - 지표: 핵심 숫자 6개(쉽게) 또는 전체 지표(자세히)
- 모든 화면에서 **국내/해외** 전환, **쉽게/자세히** 보기 전환

## 구조

- `App.tsx`: 글꼴, 탭 바, 화면 이동, 용어 설명 시트
- `src/engine/`: 추천 엔진 (`factors.ts` 다섯 과목 채점, `collections.ts` 추천 목록, `insights.ts` 설명 문장, `investor.ts` 성향 테스트)
- `src/screens/`: 화면들
- `src/ui/`: 공통 부품 (글자, 카드, 그래프, 목록 줄 등)
- `src/data/`: 시세 데이터 불러오기, 사용자 설정 저장
- 글꼴: Pretendard (OFL), 자주 쓰는 한글 2,350자만 남겨 용량을 줄였어요 (`assets/fonts`)

점수 계산 방법은 [docs/recommendation.md](docs/recommendation.md)에 있어요.

## 안드로이드 APK

`main`에 코드가 올라가면 GitHub Actions가 APK를 자동으로 빌드해서 [apk-latest 릴리스](https://github.com/RealSalmon12/stock-helper/releases/tag/apk-latest)에 올립니다. 폰에서 APK 파일을 받아 설치하면 됩니다 ("출처를 알 수 없는 앱 설치" 허용 필요).
