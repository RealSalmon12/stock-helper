# 웹 실시간 시세 중계 (Cloudflare Worker)

휴대폰 앱은 시세를 직접 받아서 몇 초마다 바뀌지만, 웹 브라우저는 보안 정책 때문에 네이버·Yahoo에 직접 물어볼 수 없어요.
이 Worker를 한 번 만들어 두면 웹도 앱처럼 5~10초마다 바뀌어요. 무료 요금제(하루 10만 번 요청)로 충분해요.

1. https://dash.cloudflare.com 에서 무료 가입
2. 왼쪽 메뉴 **Workers & Pages** → **Create** → **Create Worker** → 이름 `stock-helper-proxy` → **Deploy**
3. **Edit code**를 눌러 기존 코드를 지우고 `proxy/worker.js` 내용을 그대로 붙여넣기 → **Deploy**
4. 화면에 보이는 주소(예: `https://stock-helper-proxy.내이름.workers.dev`)를 복사
5. `src/data/useLiveQuotes.ts`의 `LIVE_PROXY = ''` 안에 그 주소를 넣고 main에 올리면 웹이 자동으로 다시 배포돼요
