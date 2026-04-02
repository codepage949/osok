# 파일 목록 스크롤바 스타일 조정

## 변경 목표

- 파일 목록의 스크롤바가 주변 다크 글래스 UI와 어울리도록 정리
- 기본 시스템 스크롤바의 이질감을 줄이고 목록 영역만 선택적으로 스타일링

## 구현 내용

- `public/index.html`
  - `.file-list`에 Firefox용 `scrollbar-width`, `scrollbar-color` 적용
  - WebKit 계열 브라우저용 트랙, 엄지, hover 상태 스타일 추가
  - 파일 목록 영역에만 한정되도록 스코프를 `.file-list`로 제한

## 테스트 계획

- 다음 정적 검증 수행
  - `deno fmt`
  - 로컬 서버에서 스타일 반영 여부 확인
