# 드롭존 고정 레이아웃 및 파일 목록 내부 표시

## 변경 사항

### `src/App.tsx`
- 드롭존 내부를 조건부 렌더링으로 변경:
  - 파일 없음: 기존 아이콘 + 텍스트 + 힌트
  - 파일 있음: `.file-list` (드롭존 내부에 표시)
- 기존 드롭존 바깥의 `{files.length > 0 && <div className="file-list">...}` 블록 제거

### `src/globals.css`
- `.drop-zone`에 고정 높이 추가: `height: 180px`
- `.drop-zone`에 `justify-content: center` 추가 (빈 상태 수직 중앙 정렬)
- `.drop-zone`에 `overflow: hidden` 추가
- `.drop-zone .file-list` 추가:
  - `width: 100%; flex: 1; align-self: stretch` — 드롭존 내부를 꽉 채움
  - `max-height: 100%; overflow-y: auto` — 파일 많을 때 스크롤
  - `text-align: left` — 파일명 좌측 정렬

- `#msg`의 `min-height: 3rem` → `height: 4.5rem` 변경:
  - 세션키 폰트(3rem)의 실제 렌더 높이(라인하이트 포함 ~3.6rem)가 `min-height: 3rem`보다 커서 세션키 등장 시 레이아웃이 흔들리는 문제 수정

## 이유

파일 선택 시 목록이 드롭존 아래에 나타나며 컨테이너 전체 높이가 늘어나는 레이아웃 시프트를 방지.
드롭존을 고정 크기 컨테이너로 만들어 파일 유무와 관계없이 레이아웃이 변하지 않도록 함.
`#msg`는 `min-height`가 세션키 실제 높이보다 작아 `height: 4.5rem`으로 완전히 고정.
