# 업로드 완료 후 초기화 전까지 UI 잠금 유지

## 문제
업로드 성공 후 "✅ 전송 완료!" 메시지가 표시되는 3초 동안 UI 잠금이 해제되어 상호작용이 가능했던 문제.

## 원인
`finally` 블록에서 `setUploadLocked(false)`가 즉시 호출되므로 성공/실패 분기 이전에 잠금이 풀렸음.

## 변경 사항

### `public/index.js`

- `finally` 블록에서 `setUploadLocked(false)` 제거
- 실패 시: 에러 상태 설정 직후 `setUploadLocked(false)` 호출 (즉시 해제, 재시도 가능)
- 성공 시: `setTimeout` 콜백 안 초기화 직후 `setUploadLocked(false)` 호출 (3초 후 해제)

## 동작 흐름
- 성공: 업로드 완료 → "✅ 전송 완료!" → 3초 잠금 유지 → 초기화 + 잠금 해제
- 실패: 업로드 완료 → 에러 메시지 + 즉시 잠금 해제
