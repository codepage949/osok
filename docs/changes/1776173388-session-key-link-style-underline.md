# 세션키 링크 스타일 밑줄 추가

## 변경 사항

- `src/globals.css`의 `.session-key`에 링크 스타일 밑줄 추가:
  - `text-decoration: underline`
  - `text-decoration-color: rgba(107, 140, 255, 0.55)` — 파란 계열로 테마와 통일
  - `text-underline-offset: 6px` — 대형 폰트에 맞게 밑줄 간격 확보

## 이유

사용자가 세션키를 클릭할 수 있다는 것을 직관적으로 인식하도록 링크처럼 보이게 함.
