# osok (One-Shot-OK)

서버 디스크에 흔적을 남기지 않고, 일회성 키를 통해 데이터를 실시간으로 중계하는 현대적인 파일/텍스트 전송 도구입니다.

![osok-preview](https://img.shields.io/badge/Deno-2.0+-blue?logo=deno)
![osok-ui](https://img.shields.io/badge/UI-React_Glassmorphism-61DAFB?logo=react)
![osok-bg](https://img.shields.io/badge/Background-WebGL_Particles-blueviolet)

## 🚀 주요 특징

- **Zero-Storage:** 서버 메모리나 디스크에 파일을 저장하지 않습니다. 업로더와 수신자가 연결된 순간에만 데이터가 스트리밍됩니다.
- **Modern UX:** React 기반의 글래스모피즘 UI와 Three.js Antigravity 스타일 WebGL 파티클 배경을 제공합니다.
- **Smart Upload:**
  - 단일 파일 및 텍스트 전송 지원
  - 다중 파일 드래그 앤 드롭 시 브라우저에서 즉석 **ZIP 압축** 전송 (`fflate` 활용)
  - 실제 전송 속도와 동기화되는 **물 채움(Liquid fill) 진행 애니메이션**
- **Security:** 8자리의 URL-safe 일회성 키를 사용하여 안전하게 경로를 식별합니다.

## 🛠 기술 스택

### Backend
- **Runtime:** [Deno](https://deno.com/)
- **Framework:** [Hono](https://hono.dev/)
- **Key Generation:** `crypto-random-string`

### Frontend
- **Library:** React 19, Vite
- **Rendering:** Three.js (WebGL Particle Simulation)
- **Compression:** fflate (High-speed browser-side ZIP)
- **Styling:** Vanilla CSS (Glassmorphism, Liquid Animation)
- **State Management:** Custom Hooks (useUpload)

## 📂 프로젝트 구조

```text
.
├── main.ts             # Hono 서버: 세션 관리 및 데이터 스트리밍(Relay) 로직
├── dev.ts              # 개발용 서버 러너 (Vite + Hono API 서버 병렬 실행)
├── src/                # React 프론트엔드 소스
│   ├── App.tsx         # 메인 UI 및 업로드 로직
│   ├── BgScene.tsx     # Three.js 배경 컴포넌트
│   ├── hooks/          # 커스텀 훅 (업로드 상태 관리 등)
│   └── lib/            # 비즈니스 로직 (ZIP, WebGL, 애니메이션)
├── deno.json           # Deno 설정 및 태스크 정의
└── docs/changes/       # 기능별 변경 이력 관리
```

## ⚙️ 실행 방법

### 요구 사항
- Deno 2.0 이상

### 개발 서버 실행
Vite 개발 서버와 Hono API 서버를 동시에 실행합니다.
```bash
deno task dev
```

### 프로덕션 빌드 및 실행
프론트엔드를 빌드한 후 서버를 실행합니다.
```bash
deno task start
```

### 환경 변수
| 변수명 | 기본값 | 설명 |
| --- | --- | --- |
| `HTTP_PORT` | `8000` | 서버 포트 번호 |

## 📖 기능 설명 및 실행 경로

### 1. 세션 생성 및 대기
- 사용자가 파일을 드롭하거나 텍스트를 입력하면 `/new-session`을 통해 8자리 키를 발급받습니다.
- 서버는 메모리에 해당 키를 등록하고 수신자의 접속을 기다립니다.
- 프론트엔드는 `/status?key=...`를 폴링하며 수신자 접속 여부를 확인합니다.

### 2. 실시간 스트리밍 전송 (Handoff)
- 수신자가 `/{key}` 경로로 접속하면 서버는 스트림 응답을 유지합니다.
- 수신자 접속이 확인되면 업로더는 `/upload?key=...`로 데이터를 `POST`합니다.
- **핵심 로직:** 서버는 업로드되는 `Request Body`를 수신자의 `Response Body`로 즉시 파이프(`pipeTo`) 처리합니다. 데이터는 서버에 저장되지 않고 실시간으로 통과합니다.

### 3. 지능형 파일 처리
- **단일 파일:** 파일 이름과 타입을 유지하여 전송합니다.
- **다중 파일:** 브라우저에서 즉석 압축 후 `files.zip`으로 전송합니다.
- **텍스트:** 사용자가 입력한 텍스트를 `text/plain` 타입으로 즉시 스트리밍합니다.

### 4. 시각적 피드백
- **WebGL 배경:** 마우스 움직임과 상호작용하는 파티클 시뮬레이션이 배경을 채웁니다.
- **Liquid Progress:** 업로드 시작 시 UI 카드가 액체로 채워지는 애니메이션을 보여주며, 실제 네트워크 전송률과 동기화됩니다.

---

## 📝 특이 사항
- 서버는 중계자 역할만 하므로 업로더의 탭을 닫으면 전송이 중단됩니다.
- 수신자가 접속하기 전까지는 데이터 업로드가 시작되지 않아 대역폭을 낭비하지 않습니다.
