# API 계약 — reading-group

> 구현 기준 확정 문서. 변경 시 PR 리뷰 필수.

## 인증
모든 엔드포인트에 `Authorization: Bearer <token>` 헤더 필요.

---

## 엔드포인트 목록

| Method | Path | 설명 |
|---|---|---|
| GET | `/groups` | 내가 참여 중인 모임 목록 |
| POST | `/groups` | 모임 개설 |
| GET | `/groups/{id}` | 모임 상세 |
| PATCH | `/groups/{id}/settings` | 모임 설정 수정 (OWNER/MANAGER) |
| DELETE | `/groups/{id}` | 모임 삭제 (OWNER) |
| GET | `/groups/{id}/members` | 멤버 목록 |
| DELETE | `/groups/{id}/members/{userId}` | 멤버 강퇴 (OWNER) |
| POST | `/groups/{id}/members/{userId}/delegate` | 소유권 위임 (OWNER) |
| POST | `/groups/{id}/members/{userId}/promote` | 매니저 승격 (OWNER) |
| DELETE | `/groups/{id}/members/me` | 모임 탈퇴 |
| POST | `/groups/{id}/invite` | 임시 초대 링크 생성 |
| POST | `/groups/{id}/join` | 초대 코드로 모임 참가 |
| GET | `/groups/{id}/chapter-goals` | 챕터 목표 목록 |
| POST | `/groups/{id}/chapter-goals` | 챕터 목표 추가 (OWNER/MANAGER) |
| PATCH | `/groups/{id}/chapter-goals/{goalId}` | 챕터 목표 수정 (OWNER/MANAGER) |
| GET | `/groups/{id}/progress` | 전체 진도 기록 |
| POST | `/groups/{id}/progress` | 진도 공유 |
| GET | `/groups/{id}/comments` | 댓글 목록 (최상위만, 답글은 replies 필드) |
| POST | `/groups/{id}/comments` | 댓글 작성 |
| DELETE | `/groups/{id}/comments/{commentId}` | 댓글 삭제 (본인) |
| POST | `/groups/{id}/comments/{commentId}/reactions` | 이모지 반응 토글 |

---

## 주요 스키마

### POST /groups (요청)
```json
{
  "book_id": 1,
  "name": "한강 읽기 모임",
  "description": "한강 작품 읽기",
  "is_public": true,
  "max_member": 8,
  "start_date": "2024-12-01T00:00:00",
  "end_date": "2024-12-31T23:59:59"
}
```

### POST /groups/{id}/join (요청)
```json
{ "code": "RDLG-A7B3" }
```
- `code`는 상시 초대 코드(`reading_groups.invite_code`) 또는 임시 코드(`group_invites.invite_code`) 둘 다 허용
- 임시 코드는 만료 및 used 여부 검증

### POST /groups/{id}/progress (요청)
```json
{
  "chapter": "Chapter 2 - 몽고반점",
  "page": 128,
  "progress": 52.0,
  "memo": "이 부분이 인상적이었어요."
}
```
- `page` 또는 `progress` 중 하나는 필수

### POST /groups/{id}/comments (요청)
```json
{
  "content": "영혜의 꿈 장면이 인상적이었어요.",
  "is_spoiler": false,
  "quote": "나는 꿈을 꾸었어.",
  "progress_id": 5,
  "parent_comment_id": null
}
```

---

## 권한 규칙 요약

| 액션 | 필요 권한 |
|---|---|
| 모임 조회/진도/댓글 읽기 | MEMBER 이상 |
| 진도 공유 / 댓글 작성 | MEMBER 이상 |
| 모임 설정 수정 / 챕터 목표 | OWNER 또는 MANAGER |
| 멤버 강퇴 / 소유권 위임 | OWNER |

## 초대 코드 정책

- **상시 코드** (`reading_groups.invite_code`): 모임당 1개, 만료 없음
- **임시 코드** (`group_invites`): 기본 72시간, 1회성 (`used` 플래그)
- 개인정보(이메일 등)를 코드에 포함하지 않음

## 소유권 위임 트랜잭션

`POST /groups/{id}/members/{userId}/delegate` 는 단일 트랜잭션으로:
1. 현재 OWNER → MANAGER
2. 대상 MEMBER/MANAGER → OWNER

OWNER가 2명 동시에 존재하는 순간이 없도록 보장.
