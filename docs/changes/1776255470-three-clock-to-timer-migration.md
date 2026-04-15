# THREE.Clock → THREE.Timer 마이그레이션

## 변경 배경

브라우저 콘솔에서 다음 경고가 출력됨:
```
THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

Three.js 0.183.2에서 `THREE.Clock`이 deprecated되고 `THREE.Timer`가 공식 대체제로 제공됨.

## 주요 API 차이

| 항목 | THREE.Clock | THREE.Timer |
|------|------------|-------------|
| 생성자 | `new THREE.Clock(false)` | `new THREE.Timer()` |
| 시작 | `clock.start()` | 불필요 (생성 즉시 사용 가능) |
| 프레임 업데이트 | 없음 | `timer.update(timestamp)` 필수 |
| 델타 취득 | `clock.getDelta()` | `update()` 후 `getDelta()` |
| Page Visibility | 미지원 | `connect(document)` 로 지원 |
| 정리 | 없음 | `timer.dispose()` |

`THREE.Timer`의 개선점:
- 동일 프레임 내 `getDelta()` 여러 번 호출해도 일관된 값 반환
- Page Visibility API로 탭 비활성 시 큰 delta 값 방지

## 변경 파일

- `src/lib/background/index.ts`

## 변경 내용

1. `new THREE.Clock(false)` → `new THREE.Timer()`
2. `clock.connect(document)` 추가 (Page Visibility API 활성화)
3. `renderFrame(timestamp?)` 인자 추가 → `clock.update(timestamp)` 호출
4. `clock.start()` 제거
5. cleanup 함수에 `clock.dispose()` 추가
