# osok (One-Shot-OK)

서버 디스크에 흔적을 남기지 않고, 일회성 키를 통해 데이터를 실시간으로 중계하는 현대적인 파일/텍스트 전송 도구입니다.

![osok-preview](https://img.shields.io/badge/Deno-2.0+-blue?logo=deno)
![osok-ui](https://img.shields.io/badge/UI-Glassmorphism-brightgreen)
![osok-bg](https://img.shields.io/badge/Background-WebGL_Particles-blueviolet)

## 🚀 주요 특징

- **Zero-Storage:** 서버 메모리나 디스크에 파일을 저장하지 않습니다. 업로더와 수신자가 연결된 순간에만 데이터가 스트리밍됩니다.
- **Modern UX:** Three.js 기반의 Antigravity 스타일 WebGL 파티클 배경과 글래스모피즘 UI를 제공합니다.
- **Smart Upload:**
  - 단일 파일 및 텍스트 전송 지원
  - 다중 파일 드래그 앤 드롭 시 브라우저에서 즉석 **ZIP 압축** 전송 (`fflate` 활용)
  - 실제 전송 속도와 동기화되는 **물 채움(Liquid fill) 진행 애니메이션**
- **Security:** 8자리의 URL-safe 일회성 키를 사용하여 안전하게 경로를 식별합니다.

## 🛠 기술 스택

### Backend
- **Runtime:** [Deno](https://deno.com/)
- **Framework:** [Hono](https://hono.dev/) (High-performance web framework)
- **Key Generation:** `crypto-random-string`

### Frontend
- **Rendering:** Three.js (WebGL Particle Simulation)
- **Compression:** fflate (High-speed browser-side ZIP)
- **Styling:** Vanilla CSS (Glassmorphism, Liquid Animation)
- **Communication:** XMLHttpRequest (for precise upload progress tracking)

## 📂 프로젝트 구조

```text
.
├── main.ts             # Hono 서버: 세션 관리 및 데이터 스트리밍(Relay) 로직
├── public/
│   ├── index.html      # UI 레이아웃 및 CSS 스타일 (Glassmorphism)
│   └── index.js        # 프론트엔드 로직: WebGL 배경, ZIP 압축, 업로드 컨트롤러
├── deno.json           # Deno 설정 및 의존성 정의
└── docs/changes/       # 기능별 변경 이력 관리
```

## ⚙️ 실행 방법

### 요구 사항
- Deno 2.0 이상

### 개발 서버 실행
```bash
deno task dev
```

### 일반 실행
```bash
deno task start
```

### 환경 변수
| 변수명 | 기본값 | 설명 |
| --- | --- | --- |
| `HTTP_PORT` | `8000` | 서버 포트 번호 |
| `DENO_ENV` | - | `production` 설정 시 HTTPS 강제 리다이렉트 활성화 |

## 📖 기능 설명 및 실행 경로

### 1. 세션 생성 및 대기
- 업로더가 파일을 드롭하거나 텍스트를 입력하면 `/new-session`을 통해 8자리 키를 발급받습니다.
- 서버는 메모리(Map)에 해당 키를 등록하고 수신자의 접속을 기다립니다.
- 프론트엔드는 `/status?key=...`를 폴링하며 수신자 준비 상태를 확인합니다.

### 2. 실시간 스트리밍 전송 (Handoff)
- 수신자가 `/{key}` 경로로 접속하면 서버는 응답 스트림(`Promise<Response>`)을 열어둔 채 유지합니다.
- 수신자 접속이 감지되면 업로더는 `/upload?key=...`로 데이터를 `POST`합니다.
- **핵심 로직:** 서버는 업로드되는 `Request Body`를 수신자의 `Response Body`로 즉시 파이프(`pipeTo`) 처리합니다. 데이터는 서버를 통과할 뿐 저장되지 않습니다.

### 3. 지능형 파일 처리
- **단일 파일:** 원본 이름과 타입을 유지하며 전송됩니다.
- **다중 파일:** 브라우저에서 `fflate`를 이용해 `files.zip`으로 압축 후 전송됩니다.
- **텍스트:** `text/plain` 타입으로 즉시 스트리밍됩니다.

### 4. 시각적 피드백
- **WebGL 배경:** 마우스 움직임에 반응하는 고성능 입자 시뮬레이션이 배경에서 동작합니다.
- **Liquid Progress:** 업로드 시작 시 카드가 잔처럼 변하며, 실제 전송 퍼센트에 따라 물이 차오릅니다. 전송 완료 시 부드럽게 가득 차며 종료됩니다.

---

## 📝 특이 사항
- 본 프로젝트는 서버가 단순 중계자(Relay) 역할만 수행하므로, 업로더의 탭이 닫히면 전송이 중단됩니다.
- 수신자가 접속하기 전까지는 실제 데이터 업로드가 시작되지 않아 대역폭을 절약합니다.
