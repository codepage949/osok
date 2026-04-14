# 프로덕션 빌드에서 backdrop-filter 누락 버그 수정

## 증상

중앙 컨테이너의 배경 투명도(frosted glass 효과)가 dev 모드와 release 모드에서 다르게 보임.

## 원인

Vite 8은 프로덕션 빌드 시 LightningCSS를 CSS 미니파이어로 사용한다.
프로젝트에 `browserslist` 설정이 없어 LightningCSS가 브라우저 타깃을 알 수 없는 상태에서,
`backdrop-filter`와 `-webkit-backdrop-filter`를 같은 속성의 중복으로 인식하고
webkit 접두사 버전만 남기고 표준 속성을 제거했다.

결과:
- Dev 모드: 소스 CSS 그대로 적용 → `backdrop-filter` 동작 → frosted glass
- 프로덕션 빌드: `-webkit-backdrop-filter`만 존재 → Firefox에서 blur 완전 미적용, Chrome/Edge도 외관 차이 발생

## 수정

### `vite.config.ts`
LightningCSS의 `targets`를 명시적으로 설정.
`backdrop-filter`를 지원하는 모던 브라우저(Chrome 103+, Firefox 103+, Safari 15.4+, Edge 103+)를 타깃으로 지정.
LightningCSS는 해당 타깃에서 불필요한 webkit 접두사를 자동 제거하고 표준 `backdrop-filter`를 올바르게 출력한다.

### `src/globals.css`
LightningCSS가 vendor prefix를 자동 관리하므로 소스에서 `-webkit-backdrop-filter` 중복 선언 제거.
