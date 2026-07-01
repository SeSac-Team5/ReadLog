# reading-plan-module

## 트리거 (언제 이 스킬을 로드하는가)
다음에 해당하면 이 스킬을 로드한다:
- `frontend/src/screens/reading-plan/`, `components/reading-plan/`, `store/reading-plan/`, `api/reading-plan/`, `types/reading-plan/`, `hooks/reading-plan/` 경로의 파일을 만들거나 수정할 때
- `backend/app/modules/reading_plan/` 경로의 파일을 만들거나 수정할 때
- 책 검색, 책 등록, 내 서재, 독서 진도 입력, 한줄평, SNS 공유 관련 작업 요청

## 담당자
**B**

## 소유 범위 (이 경로 밖은 수정하지 않음)
```
frontend/src/screens/reading-plan/**
frontend/src/components/reading-plan/**
frontend/src/store/reading-plan/**
frontend/src/api/reading-plan/**
frontend/src/types/reading-plan/**
frontend/src/hooks/reading-plan/**
frontend/__tests__/reading-plan/**
backend/app/modules/reading_plan/**
backend/tests/reading_plan/**
```

## 담당 화면 (Figma 참고: `docs/figma-export/App.tsx`)
| 화면 | 원본 컴포넌트 | 우선순위 |
|---|---|---|
| 책 검색 | `BookSearchScreen` | 상 |
| 책 상세/등록 | `BookDetailScreen` | 상 |
| 내 서재 | `MyLibraryScreen` | 상 |
| 독서 진도 입력 (신규) | `ReadingProgressScreen` | 상 |
| 한줄평 | `OneLineReviewScreen` | 중 |
| SNS 공유 | `SNSShareScreen` | 상 |

## 화면별 필수 요소
- **책 검색**: 검색창, 알라딘 API 기반 검색 결과 리스트(표지+제목 카드형) — 외부 API 연동은 backend에서 프록시
- **책 상세/등록**: 표지, 제목, "내 서재에 추가" 버튼, 독서 상태 선택(읽는 중 / 완독 — **2단계만**, "읽고 싶다" 단계 없음. `edit-prompt.md` §6 확정 사항)
- **내 서재**: 등록한 책 그리드(가변 콘텐츠, 최소/최대 카드 폭 명시), 완독 권수 집계 배너
- **독서 진도 입력** (신규, 상세 컴포넌트 필요):
  - 책 표지/제목 헤더
  - 진도 입력 방식: 전체 페이지 대비 현재 페이지(숫자) 또는 진행률 슬라이더(%) — 선택 가능하게
  - 입력값을 즉시 반영하는 진행 바 (가변 너비, 최소/최대 폭 기준 명시)
  - 진도 기록 자동 타임스탬프, 이전 기록 타임라인(선택 요소)
  - "저장" 버튼 → 저장 시 **내 서재 화면의 진도율 갱신** (동일 모듈 내 상태 동기화, store 공유)
- **한줄평**: 완독한 책에 대한 한 문장 코멘트 입력/수정/삭제
- **SNS 공유**: 사진 업로드 + 이모지 스티커 + 코멘트 입력 + **진도 시각화 오버레이(신규)** + Instagram 공유 버튼
  - 오버레이 3종(택1/혼합): 원형 게이지(%) 스티커 / 가로 진행 바 스티커 / "p.120/350 읽음" 텍스트 배지
  - 오버레이 드래그로 위치/크기 조정, 노출 토글(끄기 가능)
  - 완독 시 진도 대신 "완독" 뱃지로 자동 전환 옵션

## Backend 규칙
- 라우터: `backend/app/modules/reading_plan/routers/` (예: `books.py`, `library.py`, `progress.py`, `reviews.py`)
- 알라딘 API 연동은 backend에서만 호출 (API 키를 프론트에 노출하지 않음), 캐싱 고려
- 진도 저장 시 단위는 `user_library.current_page`(페이지만, % 컬럼 없음). 그룹 진도(C 모듈)는 페이지+% 모두 저장 — 두 모듈 표시 방식이 다를 수 있음을 UI에서 감안 (CLAUDE.md §8)
- 모델: `Book`, `UserBook`(독서 상태/진도), `ReadingProgressLog`(진도 기록 타임라인), `Review`(한줄평)

## DB 테이블 (`docs/db/schema.sql` 기준, 확정 + 확인 필요 항목 포함)
```sql
books (id, isbn13, title, author, publisher, description, cover_url, page_count, published_date, created_at)

user_library (
  id, user_id, book_id,
  status ENUM('WISH','READING','COMPLETED') DEFAULT 'READING',  -- ⚠ 아래 참고
  rating DECIMAL(2,1), current_page INT DEFAULT 0,
  started_at, completed_at, created_at, updated_at
)

bookmarks (id, library_id, title, page, note, created_at)   -- 노트/인용 저장용, 진도 타임라인 아님

reviews (id, user_id, book_id, rating, review, created_at, updated_at)   -- UNIQUE(user_id, book_id), user_library가 아닌 user/book 직접 참조

sns_posts (id, user_id, book_id, image_url, content, created_at)

sns_stickers (id, post_id, emoji, x, y, scale, rotation)   -- ⚠ 아래 참고
```

### ⚠ 확인 필요 (CLAUDE.md §8, 구현 전 팀 확인)
1. **`status`에 `WISH`가 존재** — 기획 확정사항("읽는 중/완독 2단계만")과 다름. 프론트에서 WISH 상태 진입 경로를 안 만들지, 아니면 실제로 "읽고 싶다" 기능을 살릴지 B가 결정하고 CLAUDE.md에 반영.
2. **진도 타임라인 테이블 없음** — 독서 진도 입력 화면의 "이전 진도 기록 리스트"는 `user_library.current_page`(단일 값)로는 구현 불가. `bookmarks`는 용도가 다름(제목+메모 노트). 타임라인이 필수면 마이그레이션으로 `reading_progress_logs(id, library_id, page, percent, recorded_at)` 같은 테이블 추가를 제안할 것. 필수가 아니면 화면에서 "이전 기록" 섹션은 이번 스프린트에서 제외.
3. **`sns_stickers`에 진도 오버레이 구분 컬럼 없음** — emoji 스티커와 "진도 시각화 오버레이"(원형게이지/진행바/텍스트배지)를 같은 테이블에 저장하려면 최소 `type ENUM('emoji','progress_ring','progress_bar','progress_badge')`, `visible BOOLEAN DEFAULT TRUE` 컬럼 추가가 필요해 보임. 추가 전까지는 오버레이를 프론트 상태로만 유지하고(저장 안 함) 게시 시 이미지에 합성해서 `sns_posts.image_url`만 저장하는 방식으로 우회 가능.

### 참고
- 진도 입력 화면의 저장 대상은 `user_library.current_page` (개인 서재 진도는 페이지 단위만 존재, %는 없음). 그룹 진도(`reading_progress`)는 페이지+%를 모두 저장하는 것과 대비됨 — 두 모듈 간 단위를 통일할지는 C와 별개로 조율 가능.

## API 계약
구현 전 `docs/api-contracts/reading-plan.md`에 엔드포인트(`GET /books/search`, `POST /library`, `PATCH /library/{id}/status`, `POST /library/{id}/progress`, `GET /library/{id}/progress-logs`, `POST /library/{id}/review`)를 먼저 정의.

## 하지 말 것
- `components/common`, `navigation/`, 다른 모듈 폴더 직접 수정
- 알라딘 API 키를 프론트엔드 코드/환경변수에 하드코딩
- `user_library.status`에 `WISH`를 임의로 쓰거나 지우는 마이그레이션을 팀 확인 없이 작성 (CLAUDE.md §8 ①)
- 진도 타임라인/스티커 오버레이 컬럼이 스키마에 없다는 이유로 조용히 기능을 생략 — 반드시 위 "확인 필요" 항목으로 팀에 공유 후 진행
