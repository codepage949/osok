# React + Vite 포팅 및 Deno 기반 빌드 환경 통합

## 개요
Vanilla JS + 단일 HTML 파일 구성을 React 18 + Vite 5 + TypeScript 기반으로 이식하고,
빌드 환경을 `deno.json` 하나로 통합했다. 화면 구현과 기능은 완전히 동일하게 유지.

## 파일 구조 변경

### 제거
- `public/index.html` — Vanilla JS 기반 HTML 진입점
- `public/index.js` — Vanilla JS 기반 프론트엔드 로직
- `package.json`, `package-lock.json` — npm 의존성 파일

### 신규
| 파일 | 역할 |
|------|------|
| `index.html` | Vite 진입점 HTML |
| `vite.config.ts` | Vite 설정 (개발 서버 프록시 포함) |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TypeScript 설정 |
| `src/globals.css` | 기존 CSS 전체 이식 |
| `src/main.tsx` | React 루트 마운트 |
| `src/App.tsx` | 메인 컴포넌트 (모든 UI 및 상태 관리) |
| `src/BgScene.tsx` | Three.js 배경 컴포넌트 |
| `src/lib/background.ts` | Three.js IIFE → `initBackground(canvas): cleanup` 함수 |
| `src/lib/uploadFill.ts` | `createUploadFillController` TypeScript 이식 |
| `src/lib/zip.ts` | fflate ESM 모듈 기반 ZIP 생성 |
| `src/hooks/useUpload.ts` | 업로드 전체 흐름 커스텀 훅 |

## 주요 변경 사항

### 프론트엔드 이식
- Three.js: CDN 동적 import → `npm:three` 정적 import
- fflate: CDN UMD → `npm:fflate` ESM
- 배경 초기화 함수가 cleanup 함수를 반환하도록 변경 → `useEffect` 생명주기와 연동
- `BgScene` 컴포넌트: 모바일(`max-width: 640px`) 감지 시 Three.js 초기화 건너뜀

### CSS 구조 수정
- `#root { display: contents }` 추가 — React의 `#root` div가 flex 레이아웃에 영향을 주지 않도록 처리, 포팅 전과 동일한 컨테이너 너비 유지

### 서버 (`main.ts`) 변경
- 정적 서빙 경로: `./public` → `./dist`
- 라우트 순서 재배치: API 라우트(`/new-session`, `/status`, `/upload`) → 정적 서빙(`./dist`) → `/:key`

### 빌드 환경 (`deno.json`) 통합
- `"nodeModulesDir": "auto"` 설정으로 `deno install` 시 `node_modules` 자동 생성
- 모든 의존성(백엔드 + 프론트엔드)을 `imports`에 `npm:`/`jsr:` 스펙으로 통합
- `package.json` 완전 제거
- tasks: `start`(빌드 후 서버 실행), `dev`(Vite 개발 서버)만 유지

```json
"start": "deno run -A npm:vite build && deno run -A main.ts",
"dev": "deno run -A npm:vite"
```

## 의존성

| 패키지 | 용도 |
|--------|------|
| `npm:react@^18.3.1` | UI 프레임워크 |
| `npm:react-dom@^18.3.1` | React DOM 렌더러 |
| `npm:three@^0.161.0` | WebGL 배경 파티클 |
| `npm:fflate@^0.8.2` | 브라우저 사이드 ZIP 압축 |
| `npm:vite@^5.4.1` | 빌드 도구 및 개발 서버 |
| `npm:@vitejs/plugin-react@^4.3.1` | Vite React 플러그인 |
| `jsr:@hono/hono@4.6.1` | 백엔드 웹 프레임워크 |
| `npm:crypto-random-string@3.3.1` | 세션 키 생성 |

## 개발 방법
```sh
deno task dev     # Vite 개발 서버 (port 5173, API는 8000으로 프록시)
deno task start   # 프론트 빌드 후 백엔드 실행 (프로덕션)
deno install      # 최초 의존성 설치 (node_modules 생성)
```
