# 모바일 세로 스크롤 활성화 및 배경 효과 비활성화

## 문제
모바일 화면에서 뷰포트 높이보다 컨텐츠가 길어질 경우 상하 스크롤이 불가능해 UI 하단이 잘려 보이는 문제.

## 원인
`body { overflow: hidden }` 설정이 수직 스크롤을 완전히 차단.  
또한 `align-items: center`로 인해 flex 세로 중앙 정렬 상태에서 컨텐츠가 뷰포트 상단 위로 넘칠 경우 스크롤해도 접근 불가.

## 변경 사항

### `public/index.html`

- `body { overflow: hidden }` → `overflow-x: hidden` (수평 스크롤만 차단, 수직은 허용)
- `@media (max-width: 640px)` 안에 `body` 스타일 추가:
  - `align-items: flex-start` — flex 세로 중앙 정렬 해제, 위에서부터 쌓이게
  - `padding: 1.5rem 0` — 상하 여백 확보
  - `overflow-y: auto` — 모바일에서 수직 스크롤 명시적 허용

### `public/index.js`

- `initAntigravityBackground()` 시작부에 모바일 감지 조기 종료 추가:
  - `window.matchMedia("(max-width: 640px)").matches` 시 return — Three.js 로딩 및 WebGL 렌더링 자체를 건너뜀
  - CSS로 숨기는 것과 달리 GPU/CPU 자원 소모 없음

## 영향
- 데스크탑: 기존 동작 유지 (중앙 정렬, 배경 애니메이션)
- 모바일 (≤640px):
  - 컨텐츠가 화면보다 길어질 때 자연스럽게 스크롤 가능
  - Three.js / WebGL 배경 효과 미실행 → 배터리 및 성능 절약
