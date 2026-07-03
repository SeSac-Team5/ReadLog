# DB 스키마 변경 이력

Alembic 미세팅 기간 동안 수동 변경 사항을 기록합니다.
각 항목의 SQL을 DBeaver 등에서 직접 실행하여 로컬 DB에 반영하세요.

---

## [2026-07-03] reading_groups.is_public 컬럼 제거

**배경:** 공개 모임 탐색 기능 기획 폐기로 인해 공개/비공개 구분 자체가 불필요해짐.

**대상 테이블:** `reading_groups`

**실행 SQL:**
```sql
ALTER TABLE reading_groups DROP COLUMN is_public;
```

**함께 변경된 코드 (C 모듈):**
- `backend/app/modules/reading_group/models/group.py` — `is_public` 컬럼 제거
- `backend/app/modules/reading_group/schemas/group.py` — `GroupCreate`, `GroupUpdate`, `GroupResponse`에서 제거
- `backend/app/modules/reading_group/services/group_service.py` — `create_group` 인자에서 제거
- `frontend/src/types/reading-group/index.ts` — `ReadingGroup`, `CreateGroupPayload`, `UpdateGroupPayload`에서 제거
- `frontend/src/screens/reading-group/GroupListScreen.tsx` — 공개/비공개 뱃지 제거
- `frontend/src/screens/reading-group/CreateGroupScreen.tsx` — 공개 여부 토글 제거
- `frontend/src/screens/reading-group/GroupSettingsScreen.tsx` — 공개 여부 설정 행 제거

**UI 백업:** `frontend/src/screens/reading-group/_backup/` (변경 전 원본 3개 파일)
