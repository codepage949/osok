# UI 세련화 리팩토링 및 고정 레이아웃

## 변경 사항

### UI 세련화 (`src/App.tsx`, `src/globals.css`)

이모지 기반 데모스러운 요소를 제거하고 elegant/modern 스타일로 전환.
배경 애니메이션, 로딩 애니메이션, 전체 레이아웃 틀은 유지.

#### `src/App.tsx`
- 타이틀에서 ✈️ 이모지 제거
- 드롭존 아이콘: `📂` → 업로드 SVG 아이콘
- 파일 아이콘: `📄` → 문서 SVG 아이콘
- 전송 버튼 레이블: `📝 텍스트 전송` → send arrow SVG + `전송`

#### `src/globals.css`
- 타이틀: 4색 무지개 그라디언트 → 흰→라벤더 2색 그라디언트, `letter-spacing: 0.08em`, `text-transform: uppercase`
- 드롭존: `border` 2px → 1px, hover 시 미묘한 배경 tint, dragging 시 glow 대신 ring
- 드롭존 아이콘: `font-size: 2.5rem` → SVG 색상 지정 (`rgba(139,162,255,0.55)`)
- 파일 아이템: 배경/테두리 opacity 감소, `color: var(--text-soft)`
- 버튼: 진한 cyan/teal 그라디언트 → glass-morphism (반투명 배경 + 테두리)
  - `.btn`: `rgba(107,140,255,0.1)` 배경 + `rgba(107,140,255,0.22)` 테두리
  - `.btn-upload`: `rgba(71,215,176,0.08)` 배경 + `rgba(71,215,176,0.2)` 테두리
- `text-compose`: 배경/테두리 opacity 감소
- 세션키: `font-weight: 900` → `700`, `letter-spacing: 0.3rem` → `0.22rem`, pulse 주기 1.5s → 2s
- 세션키 밑줄: `text-decoration: underline`, `text-decoration-color: rgba(139,162,255,0.35)`, `text-underline-offset: 6px`, `text-decoration-thickness: 1px` — 링크 클릭 유도
- copy toast: 초록 불투명 pill → 다크 배경 + 블루 계열 테두리 얇은 레이블 (팔레트 통일)
- copy toast 애니메이션: `translateY` 이동 제거 → opacity 페이드인/아웃만 (`toastFade`)
- `#status`: `0.9rem` → `0.82rem`

---

### 드롭존 고정 레이아웃 및 파일 목록 내부 표시 (`src/App.tsx`, `src/globals.css`)

파일 선택 시 목록이 드롭존 아래에 나타나며 컨테이너 전체 높이가 늘어나는 레이아웃 시프트 방지.

#### `src/App.tsx`
- 드롭존 내부를 조건부 렌더링으로 변경:
  - 파일 없음: 업로드 SVG 아이콘 + 텍스트 + 힌트
  - 파일 있음: `.file-list` (드롭존 내부에 표시)
- 기존 드롭존 바깥의 `{files.length > 0 && <div className="file-list">...}` 블록 제거
- copy toast를 `.session-key` 자식 → `#msg` 직속 자식으로 이동:
  - `.session-key`의 `keyPulse` opacity 애니메이션이 자식 요소에 상속되어 toast가 pulse에 반응하던 문제 수정

#### `src/globals.css`
- `.drop-zone`에 고정 높이 추가: `height: 180px`
- `.drop-zone`에 `justify-content: center` 추가 (빈 상태 수직 중앙 정렬)
- `.drop-zone`에 `overflow: hidden` 추가
- `.drop-zone .file-list` 추가:
  - `width: 100%; flex: 1; align-self: stretch` — 드롭존 내부를 꽉 채움
  - `max-height: 100%; overflow-y: auto` — 파일 많을 때 스크롤
  - `text-align: left` — 파일명 좌측 정렬
- `#msg` `min-height: 3rem` → `height: 4rem`:
  - 세션키 폰트(2.6rem)의 실제 렌더 높이(라인하이트 포함 ~3.1rem)가 `min-height: 3rem`보다 커서
    세션키 등장 시 레이아웃이 흔들리는 문제 수정
