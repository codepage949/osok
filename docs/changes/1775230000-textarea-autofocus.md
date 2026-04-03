# 텍스트 버튼 클릭 후 입력란 자동 포커스 복원

## 문제
텍스트 버튼 클릭 시 입력란이 나타나도 자동 포커스가 동작하지 않음.

## 원인
React 포팅 과정에서 `setTimeout(() => ref.focus(), 0)`을 사용했으나,
이 시점에 React 리렌더링이 아직 완료되지 않아 textarea가 `display: none` 상태여서 포커스 시도가 무시됨.

## 변경 사항

### `src/App.tsx`
- `setTimeout` 제거
- `useEffect`로 `textVisible` 상태를 감지해 `true`로 바뀐 직후(DOM 업데이트 완료 후) 포커스 실행

```tsx
useEffect(() => {
  if (textVisible) textInputRef.current?.focus();
}, [textVisible]);
```
