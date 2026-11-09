# 주식 도우미

초보부터 고수까지 쓸 수 있는 주식 종목 추천 앱입니다. Expo(React Native)로 iOS, Android, 웹을 한 코드로 만듭니다.

> 이 앱의 정보는 투자 조언이 아닌 참고용 정보입니다.

## 실행

```bash
npm install
npm run web      # 웹 브라우저
npm run android  # 안드로이드 (Expo Go)
npm run ios      # iOS (Expo Go, 또는 macOS)
```

## 구조

- `App.tsx`: 메인 화면 (한국장/미국장 탭)
- `src/screens/MarketScreen.tsx`: 시장별 추천 목록 ("지금 사기 좋은 종목", "안정적인 종목")
- `src/data/placeholder.ts`: 지금은 화면 확인용 예시 데이터

## 다음 단계

1. 실제 시세 데이터 연결 (한국: KRX/공공데이터, 미국: Yahoo Finance 계열)
2. 추천 로직과 쉬운 말 설명
3. 초보/고수 모드

## 안드로이드 APK

`main`에 코드가 올라가면 GitHub Actions가 APK를 자동으로 빌드해서 [apk-latest 릴리스](https://github.com/RealSalmon12/stock-helper/releases/tag/apk-latest)에 올립니다. 폰에서 APK 파일을 받아 설치하면 됩니다 ("출처를 알 수 없는 앱 설치" 허용 필요).
