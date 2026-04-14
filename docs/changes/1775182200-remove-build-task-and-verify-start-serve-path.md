# build task 제거와 start 서빙 경로 확인

## 변경 사항

- `deno.json`
  - `build` task 제거
  - `start` task는 그대로 유지

## 확인 내용

- `deno task start`는 먼저 `deno run -A npm:vite build`를 실행한다.
- 그 다음 `deno run -A main.ts`로 서버를 실행한다.
- 서버는 `main.ts`에서 `serveStatic({ root: "./dist" })`로 Vite 빌드 결과물인 `dist` 디렉터리를 정적 서빙한다.

## 판단

- 현재 구조에서는 `start` 실행 시점마다 Vite 빌드 결과를 새로 만든 뒤 서버가 그 결과를 사용한다.
- 따라서 별도 `build` task가 없어도 `start` 기준 동작에는 문제가 없다.
