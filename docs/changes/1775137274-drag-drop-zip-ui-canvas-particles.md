# 드래그앤드롭 / 다중 파일 ZIP / UI 개선 / Antigravity 배경 재구성

## 변경 사항

### 1. 파일 드래그앤드롭 지원

- 드롭존 영역에 파일을 드래그하여 업로드 가능
- `dragover`, `dragleave`, `drop` 이벤트 처리
- 드래그 중 시각적 피드백(하이라이트) 제공

### 2. 다중 파일 ZIP 압축 업로드

- `input[type=file]` → `multiple` 속성 추가
- 드래그앤드롭으로 여러 파일 동시 수용
- fflate 라이브러리(CDN)를 통해 브라우저에서 직접 ZIP 생성
- 단일 파일: 기존 방식 그대로 업로드
- 다중 파일: ZIP으로 묶어 `files.zip` 이름으로 업로드

### 3. 세련된 UI

- 글래스모피즘(glassmorphism) 디자인 적용
- 파일 선택 시 목록 미리보기
- 업로드 진행 상태 애니메이션
- 드롭존 강조 시각 효과

### 4. Antigravity 배경 효과 재구성

- 기존의 어두운 캔버스 파티클 배경 제거
- `https://antigravity.google/` 번들에서 확인한
  `landing-main-particles-component` 입력값 기반으로 시각 구조 재해석
- 초기 2D 재구성 구현을 제거하고, Three.js 기반 WebGL 점 입자 배경으로 재구현
- 확인한 핵심 파라미터:
  - `ringWidth = 0.011`
  - `ringWidth2 = 0.107`
  - `particlesScale = 0.59`
  - `ringDisplacement = 0.53`
  - `density = 230`
- 흰 배경 위에 WebGL 캔버스 한 장으로 점 입자 레이어를 렌더링
- 원본처럼 `DataTexture`를 초기 위치 버퍼로 만들고, `WebGLRenderTarget` 2장을
  번갈아 쓰는 ping-pong 시뮬레이션 구조로 변경
- 초기에는 `morphing particles` 계열 일부를 참고했지만, 이후
  `oauth-callback`에서 실제 사용 중인 `landing-main-particles-component`
  셰이더와 업데이트 루프로 다시 정렬
- 시뮬레이션 셰이더와 렌더 셰이더를 분리해 `uPosition / uPosRefs / uRingPos`
  흐름을 반영
- 정적 2D 좌표 이동이 아니라, 프레임마다 위치 텍스처를 갱신한 뒤 `Points`가 이를
  샘플링해서 렌더링하도록 변경
- 원본 light theme 계열 색상 적용 (`#2C64ED`, `#F84242`, `#FFCF03`)
- 포인트 메시 스케일, 카메라, 링 반경 진동식도 번들에서 확인한 값에 맞춰 조정
- 배경용 기준 포인트는 원본의 `PoissonDiskSampling` 분포를 참고해 브라우저
  안에서 fixed-density 샘플링으로 근접 재현
- 링 중심의 idle 이동도 smooth noise 기반으로 바꿔 원본의 느린 드리프트감에 더
  가깝게 보정
- 업로드 카드 가독성을 유지하도록 밝은 유리 패널 톤으로 UI 색상도 함께 재조정
- 미세 시각 튜닝:
  - 링 두께와 배치 오프셋을 줄여 중심 집중도를 완화
  - 글로우와 그리드 마스크 범위를 넓혀 배경 확산감 보정
  - 모바일/태블릿에서 입자 밀도를 자동 감산해 과밀함 완화
  - 포인터 반응을 즉시 이동 대신 easing 처리로 완만하게 조정
  - 이후 원본 구조에 맞추기 위해 CSS 배경 장식을 제거하고 WebGL 파티클로 통합

### 5. 세션 키 클릭 복사

- 세션 키를 클릭하면 클립보드에 복사
- 복사 완료 시 "복사됨!" 토스트 메시지 표시 (1.5초 후 사라짐)
- 호버/클릭 시 스케일 피드백

## 영향 범위

- `public/index.html` — 배경 레이어를 WebGL 캔버스 중심 구조로 단순화
- `public/index.js` — Three.js 기반 Antigravity 스타일 배경을 RTT 시뮬레이션
  구조로 재구성
- `main.ts` — 변경 없음 (서버는 단순 릴레이라 ZIP도 그대로 처리 가능)

## 참고 소스

- `https://antigravity.google/`
- 확인 자산:
  - `main-SICICGVA.js`
  - `styles-7KLEMMT6.css`
