# server https redirect middleware 제거

## 구현 계획

- `server.ts`에서 HTTPS 리다이렉트 미들웨어를 제거

## 변경 사항

### `server.ts`

- `X-Forwarded-Proto`를 검사해 HTTPS로 리다이렉트하던 미들웨어를 제거

## 테스트 계획

- `deno check server.ts main.ts dev.ts`로 타입 검증
- `deno task build`로 기존 빌드 경로 영향 여부 확인

## 테스트 결과

- `deno check server.ts main.ts dev.ts` 통과
- `deno task build` 통과

## 리팩토링 검토

- 이번 변경은 미들웨어 제거 자체가 목적이라 추가 리팩토링은 진행하지 않음
