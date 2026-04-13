# P15: 웹 알람 인라인 편집 UI

## 집은 항목
웹: 알람 편집 인라인 UI (시간/반복 수정)

## 접근
알람 카드를 클릭하면 AlarmEditInline 컴포넌트로 교체. 시간, 반복 요일, 메시지를 변경할 수 있음.
변경 감지(hasChanges)로 불필요한 API 호출 방지. 변경된 필드만 PATCH 요청에 포함.
토글/삭제 버튼 영역은 stopPropagation으로 편집 모드 진입 방지.

## 변경 파일
- `packages/web/src/pages/AlarmsPage.tsx`
  - editingId state 추가
  - editMutation 추가
  - 알람 카드에 onClick → setEditingId, hover border 스타일
  - AlarmEditInline 컴포넌트 신규 (파일 하단)

## 검증
- `npx tsc --noEmit` 통과
- `npm run build` 통과 (252ms)

## 다음 루프 주의사항
- 메시지 변경 시 알람 목록의 message_text/voice_name도 갱신됨 (invalidateQueries)
- 편집 중 다른 알람 클릭 시 자동으로 이전 편집 취소됨 (editingId 교체)
