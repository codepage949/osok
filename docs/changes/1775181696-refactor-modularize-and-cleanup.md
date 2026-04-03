# 리팩토링: 모듈화 및 코드 정리

## 1. `formatSize_` 래퍼 제거 (useUpload.ts)

**대상:** `src/hooks/useUpload.ts` 169–171번 줄

### 변경 전
```ts
function formatSize_(bytes: number) {
  return formatSize(bytes);
}
// ...
formatSize: formatSize_,
```

### 변경 후
```ts
formatSize,
```

**이유:** `formatSize_`는 `formatSize`를 그대로 호출하는 불필요한 래퍼. 중간 단계 없이 직접 반환한다.

---

## 2. status 메시지 상수화 (useUpload.ts)

**대상:** `src/hooks/useUpload.ts` 내 `setStatusHtml(...)` 호출부

### 변경 내용
HTML 문자열 리터럴을 파일 상단의 `STATUS` 상수 객체로 추출.

```ts
const STATUS = {
  CREATING_SESSION: '<span class="status-uploading"><span class="spinner"></span> 세션 생성 중...</span>',
  WAITING_CLIENT: '수신자가 연결되기를 기다리는 중...',
  UPLOADING: '<span class="status-uploading"><span class="spinner"></span> 업로드 중...</span>',
  ZIPPING: '<span class="status-uploading"><span class="spinner"></span> ZIP 압축 중...</span>',
  SUCCESS: '<span class="status-ok">✅ 전송 완료!</span>',
  ERROR_UPLOAD: '<span class="status-err">❌ 연결이 끊겼거나 업로드에 실패했습니다</span>',
  ERROR_ZIP: '<span class="status-err">ZIP 압축 실패</span>',
};
```

**이유:** 문자열 리터럴 분산 → 수정/번역 시 단일 위치에서 관리 가능.

---

## 3. 폴링 타임아웃 추가 (useUpload.ts)

**대상:** `src/hooks/useUpload.ts` `waitForClient` 함수

### 변경 전
고정 300ms 간격으로 무한 폴링. 수신자가 연결되지 않으면 영원히 대기.

### 변경 후
30초 타임아웃을 추가해 시간 초과 시 `Error('timeout')` throw. 호출부(`upload`)에서 catch하여 오류 상태 표시.

**이유:** 수신자가 없는 경우 UI가 영구 대기 상태에 빠지는 문제 방지.

---

## 4. background.ts 모듈화

**대상:** `src/lib/background.ts` (705줄 단일 파일)

### 변경 후 구조
```
src/lib/background/
├── config.ts     — CONFIG 상수
├── glsl.ts       — NOISE_GLSL 셰이더 문자열
├── utils.ts      — smoothstep01, hash1D, noise1D, remap
├── particles.ts  — createPointsData, createPositionTexture, createRenderTarget
└── index.ts      — initBackground (씬 설정, 애니메이션 루프, 마우스 상호작용)
```

기존 `background.ts` 삭제. `BgScene.tsx`의 임포트(`../lib/background`)는 변경 없이 `background/index.ts`로 자동 해석.

**이유:** 700줄 단일 파일을 역할별로 분리하여 각 모듈을 독립적으로 파악하고 수정할 수 있게 한다.
