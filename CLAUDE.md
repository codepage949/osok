# 회고

## onclick 속성과 addEventListener 동시 등록 버그 (2026-04-02)

**상황:** 텍스트 버튼에 HTML `onclick="handleTextToggle()"` 속성과 JS `addEventListener('click', ...)` 를 동시에 등록했다.

**버그:** 두 번째 클릭(텍스트가 있을 때 업로드 의도) 시 `onclick`이 먼저 실행되어 textarea를 hidden으로 토글한 뒤, `addEventListener` 콜백에서 `classList.contains('visible')`를 확인하면 이미 false라서 업로드가 실행되지 않았다.

**교훈:** 같은 엘리먼트의 동일 이벤트를 HTML 속성과 addEventListener로 분리 등록하지 않는다. 조건 분기가 있는 경우 단일 `addEventListener`에서 모두 처리한다.

## CSS 애니메이션 opacity 상속 버그 (2026-04-15)

**상황:** `.session-key`에 `keyPulse` 애니메이션(opacity 1→0.6 반복)을 적용하고, 그 자식으로 `.copy-toast`를 렌더링했다.

**버그:** CSS opacity 애니메이션은 자식 요소에 상속된다. toast 자체의 `toastFade` 애니메이션과 부모의 `keyPulse`가 합성되어 toast가 pulse 리듬에 반응하며 흔들렸다.

**교훈:** 독립적인 애니메이션이 필요한 요소는 애니메이션이 걸린 요소의 자식으로 두지 않는다. 공통 부모(position: relative 컨테이너) 아래 형제 요소로 배치한다.
