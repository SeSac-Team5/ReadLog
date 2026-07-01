# reading-group-module

## 트리거 (언제 이 스킬을 로드하는가)
다음에 해당하면 이 스킬을 로드한다:
- `frontend/src/screens/reading-group/`, `components/reading-group/`, `store/reading-group/`, `api/reading-group/`, `types/reading-group/`, `hooks/reading-group/` 경로의 파일을 만들거나 수정할 때
- `backend/app/modules/reading_group/` 경로의 파일을 만들거나 수정할 때
- 독서모임 목록/개설/참가, 모임 홈, 멤버 초대, 진도 공유, 공유 책 댓글, 모임 설정 관련 작업 요청

## 담당자
**C**

## 소유 범위 (이 경로 밖은 수정하지 않음)
```
frontend/src/screens/reading-group/**
frontend/src/components/reading-group/**
frontend/src/store/reading-group/**
frontend/src/api/reading-group/**
frontend/src/types/reading-group/**
frontend/src/hooks/reading-group/**
frontend/__tests__/reading-group/**
backend/app/modules/reading_group/**
backend/tests/reading_group/**
```

## 담당 화면 (Figma 참고: `docs/figma-export/App.tsx`)
| 화면 | 원본 컴포넌트 | 우선순위 |
|---|---|---|
| 독서모임 목록 | `GroupListScreen` | 상 |
| 모임 개설 | `CreateGroupScreen` | 상 |
| 모임 참가 | `JoinGroupScreen` | 중 |
| 모임 홈 | `GroupHomeScreen` | 상 |
| 초대 | `InviteScreen` | 상 |
| 진도 공유 | `ProgressShareScreen` | 상 |
| 공유 책 댓글 | `CommentsScreen` | 상 (스포일러 방지 포함) |
| 모임 설정 | `GroupSettingsScreen` | 중 |

## 화면별 필수 요소
- **모임 목록**: 모임 카드 리스트(모임명, 인원, 진행 도서), 모임 개설 버튼
- **모임 개설**: 모임명, 공개/비공개 토글, 최대 인원, 독서 기간(시작~종료일), 도서 선택
- **모임 참가**: 초대 코드/링크 입력 필드
- **모임 홈**: 모임 정보, 멤버 리스트, 진행 도서, **진도 현황판(멤버별 진도 바)**, 댓글/설정 이동
  - 진도 바 색상: 100% 완독 → 초록 강조 / 진행 중 → 딥그린(브랜드 컬러) — `MainHomeScreen` 미리보기와 동일 패턴 유지
- **초대**: 초대 링크 복사, 초대 코드 표시, 공유 버튼
- **진도 공유**: 진도 북마크 추가, 챕터/위치 입력
- **공유 책 댓글**: 댓글 리스트(**스포일러 블러 처리 포함**), 댓글 입력창, 이모지 반응, 원문 인용 버튼
- **모임 설정**: 공개여부/인원/기간/챕터별 목표 수정, 멤버 권한 관리(강퇴, 위임)

## Backend 규칙
- 라우터: `backend/app/modules/reading_group/routers/` (예: `groups.py`, `members.py`, `invites.py`, `progress.py`, `comments.py`)
- 초대 코드/링크: 서버에서 발급하는 고유 토큰, 만료 정책 정의 필요
- 스포일러 블러 처리: 댓글에 `is_spoiler` 플래그 저장 → 프론트에서 블러 렌더링, 사용자가 명시적으로 해제
- 멤버 권한(강퇴/위임)은 모임장(owner)만 호출 가능하도록 서비스 레이어에서 권한 검증

## DB 테이블 (`docs/db/schema.sql` 기준, 확정)
```sql
reading_groups (id, owner_id, book_id, name, description, is_public, max_member,
                 invite_code UNIQUE,   -- 상시 초대코드
                 start_date, end_date, created_at)

group_invites (id, group_id, invite_code, expires_at, used BOOLEAN)  -- 만료/1회성 초대 링크 (상시 코드와 별개)

group_members (id, group_id, user_id, role ENUM('OWNER','MANAGER','MEMBER'), joined_at)
              -- UNIQUE(group_id, user_id) — MANAGER = 모임 설정 화면의 "위임" 대상

chapter_goals (id, group_id, chapter_name, target_date)

reading_progress (id, group_id, user_id, chapter, page,
                   progress FLOAT CHECK(0~100),   -- 페이지+퍼센트 동시 저장 → 진도 단위 문제 해소
                   bookmark_title, memo, created_at)

group_comments (id, group_id, user_id, progress_id, parent_comment_id,
                content, quote, is_spoiler BOOLEAN, created_at)
                -- progress_id: 특정 진도 기록에 댓글 연결 / parent_comment_id: 답글(스레드) / quote: 원문 인용

comment_reactions (id, comment_id, user_id, emoji)  -- UNIQUE(comment_id, user_id, emoji)
```

### 참고
- **진도 단위 문제는 해소됨**: `reading_progress`가 `page`와 `progress(%)`를 함께 저장하므로 화면에서 어느 쪽을 기본 입력으로 보여줄지만 정하면 된다 (CLAUDE.md §8).
- **초대 방식이 2종류**: `reading_groups.invite_code`(상시, 모임당 1개)와 `group_invites`(만료시간 + 1회성 `used` 플래그)가 공존한다. 초대 화면에서 "고정 코드 보기"와 "임시 링크 생성"을 구분해서 보여줄 것.
- **멤버 권한 위임**: `role`에 `MANAGER`가 있으므로 모임 설정 화면의 "위임" 버튼은 대상 멤버의 role을 `MEMBER → MANAGER`로 바꾸는 API. `OWNER`는 유일해야 하므로 소유권 이전 로직은 트랜잭션으로 처리(기존 OWNER를 MANAGER로, 대상을 OWNER로 동시 변경).
- **스포일러 처리**는 `group_comments.is_spoiler` 플래그로, `quote`(원문 인용)는 별도 컬럼으로 이미 준비되어 있다.

## API 계약
구현 전 `docs/api-contracts/reading-group.md`에 엔드포인트(`GET /groups`, `POST /groups`, `POST /groups/{id}/join`, `GET /groups/{id}`, `POST /groups/{id}/invite`, `POST /groups/{id}/progress`, `GET/POST /groups/{id}/comments`, `PATCH /groups/{id}/settings`, `DELETE /groups/{id}/members/{userId}`)를 먼저 정의.

## 하지 말 것
- `components/common`, `navigation/`, 다른 모듈 폴더 직접 수정
- 초대 코드/링크에 개인정보(이메일 등)를 그대로 노출
- 권한 검증 없이 강퇴/설정 변경 API를 호출 가능하게 구현
- `group_members`에 `OWNER`가 2명 이상 동시에 존재하게 되는 소유권 이전 로직 작성 (반드시 트랜잭션으로 원자적 처리)
