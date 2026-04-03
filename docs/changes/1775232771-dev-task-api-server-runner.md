# 개발 task에서 API 서버 동시 실행

## 구현 계획

- API 서버 기동 로직을 재사용 가능하게 분리
- `dev.ts`에서 API 서버와 Vite 개발 서버를 함께 실행
- `deno task dev`가 새 개발 러너를 사용하도록 연결

## 변경 사항

### `server.ts`

- Hono 앱 생성과 서버 기동 로직을 `createApp`, `startServer`로 분리
- 기존 `main.ts`가 사용하던 세션 관리 및 스트리밍 라우트를 유지

### `main.ts`

- 프로덕션/일반 실행용 진입점으로 단순화
- 분리된 `startServer`를 호출하도록 변경

### `dev.ts`

- API 서버를 먼저 띄운 뒤 Vite 개발 서버를 자식 프로세스로 실행
- 종료 시그널을 받아 Vite 자식 프로세스를 정리하도록 처리

### `deno.json`

- `dev` task가 `dev.ts`를 실행하도록 변경

### `vite.config.ts`

- 개발 프록시 대상을 `http://127.0.0.1:8000`으로 고정
- API 엔드포인트(`/new-session`, `/status`, `/upload`) 외에 세션 키 경로(`/:key`)도 프록시하도록 추가
- 실제 세션 키 문자셋에 맞춰 `^/[a-z0-9._~-]{8}$` 패턴으로 매칭

## 테스트 계획

- `deno task build`로 기존 빌드 경로가 유지되는지 확인
- `deno task dev`를 짧게 실행해 8000 포트 API와 5173 포트 Vite가 함께 뜨는지 확인

## 테스트 결과

- `deno task build` 통과
- `deno check dev.ts main.ts server.ts src/main.tsx src/App.tsx src/hooks/useUpload.ts` 통과
- `deno task dev` 실행 후 `http://127.0.0.1:8000/new-session`가 JSON 응답을 반환하는 것 확인
- `deno task dev` 실행 후 `http://127.0.0.1:5173`가 `HTTP/1.1 200 OK`를 반환하는 것 확인
- `http://127.0.0.1:5173/new-session`가 프록시를 통해 세션 키 JSON을 반환하는 것 확인
- `http://127.0.0.1:5173/status?key=testkey`가 프록시를 통해 `{"result":false}`를 반환하는 것 확인
- `http://127.0.0.1:5173/<sessionKey>` 접속 후 `http://127.0.0.1:5173/status?key=<sessionKey>`가 `{"result":true}`를 반환하는 것 확인

## 리팩토링 검토

- 서버 라우트와 기동 책임을 분리해 `main.ts`와 `dev.ts`가 같은 서버 로직을 재사용하도록 정리함
- 이번 범위에서는 추가 분리보다 현재 구조가 단순해 후속 리팩토링은 보류
