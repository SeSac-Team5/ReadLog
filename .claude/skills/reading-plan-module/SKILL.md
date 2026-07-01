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
- **책 상세/등록**: 표지, 제목, "내 서재에 추가" 버튼, 독서 상태 선택(**읽고 싶다 / 읽는 중 / 완독 3단계**, `status` ENUM `WISH|READING|COMPLETED`. CLAUDE.md §8 ① — 기존 2단계 결정을 대체함)
- **내 서재**: 등록한 책 그리드(가변 콘텐츠, 최소/최대 카드 폭 명시), 완독 권수 집계 배너
- **독서 진도 입력** (신규, 상세 컴포넌트 필요):
  - 책 표지/제목 헤더
  - 진도 입력 방식: 전체 페이지 대비 현재 페이지(숫자) 또는 진행률 슬라이더(%) — 선택 가능하게
  - 입력값을 즉시 반영하는 진행 바 (가변 너비, 최소/최대 폭 기준 명시)
  - 진도 기록 자동 타임스탬프, 이전 기록 타임라인 — **`reading_progress_logs` 테이블 조회로 구현** (더 이상 선택 요소 아님, 스키마 확정됨)
  - "저장" 버튼 → `reading_progress_logs`에 새 행 추가 + `user_library.current_page` 갱신 → **내 서재 화면의 진도율 갱신** (동일 모듈 내 상태 동기화, store 공유)
- **한줄평**: 완독한 책에 대한 한 문장 코멘트 입력/수정/삭제
- **SNS 공유**: 사진 업로드 + 이모지 스티커 + 코멘트 입력 + **진도 시각화 오버레이** + **코멘트 스티커(신규)** + Instagram 공유 버튼
  - 오버레이 3종(택1/혼합): 원형 게이지(%) 스티커 / 가로 진행 바 스티커 / "p.120/350 읽음" 텍스트 배지 — `sns_stickers.type` = `progress_ring|progress_bar|progress_badge`
  - **코멘트 스티커(신규)**: 하단 고정 코멘트 입력창과는 별개로, 사진 위 어디든 자유배치 가능한 텍스트 스티커. `sns_stickers.type='comment'`, 텍스트는 `content` 컬럼. 이모지 스티커와 동일한 드래그(위치/크기/회전) UX 재사용
  - 모든 스티커 공통: 드래그로 위치/크기/회전 조정, `visible` 컬럼으로 노출 토글(끄기 가능)
  - 완독 시 진도 대신 "완독" 뱃지로 자동 전환 옵션

## Backend 규칙
- 라우터: `backend/app/modules/reading_plan/routers/` (예: `books.py`, `library.py`, `progress.py`, `reviews.py`)
- 알라딘 API 연동은 backend에서만 호출 (API 키를 프론트에 노출하지 않음), 캐싱 고려
- 진도 저장 시 단위는 `user_library.current_page`(페이지만, % 컬럼 없음). 그룹 진도(C 모듈)는 페이지+% 모두 저장 — 두 모듈 표시 방식이 다를 수 있음을 UI에서 감안 (CLAUDE.md §8)
- 모델: `Book`, `UserBook`(독서 상태/진도), `ReadingProgressLog`(개인 진도 타임라인, `reading_progress_logs` 매핑), `Review`(한줄평), `SnsPost`, `SnsSticker`(type/content/visible 포함)

## DB 테이블 (`docs/db/schema.sql` V2.1 기준, 확정)
```sql
books (id, isbn13, title, author, publisher, description, cover_url, page_count, published_date, created_at)

user_library (
  id, user_id, book_id,
  status ENUM('WISH','READING','COMPLETED') DEFAULT 'READING',  -- 3단계 확정 사용
  rating DECIMAL(2,1), current_page INT DEFAULT 0,
  started_at, completed_at, created_at, updated_at
)

reading_progress_logs (   -- ★ 신규 (V2.1) — 개인 진도 타임라인
  id, library_id,          -- user_library.id 참조, ON DELETE CASCADE
  page, percent,           -- 숫자 입력/슬라이더 입력 각각 대응, 둘 중 하나만 채워도 됨
  memo, recorded_at
)

bookmarks (id, library_id, title, page, note, created_at)   -- 노트/인용 저장용, 타임라인과는 별개

reviews (id, user_id, book_id, rating, review, created_at, updated_at)   -- UNIQUE(user_id, book_id)

sns_posts (id, user_id, book_id, image_url, content, created_at)

sns_stickers (   -- ★ V2.1에서 컬럼 추가
  id, post_id, emoji, x, y, scale, rotation,
  type ENUM('emoji','comment','progress_ring','progress_bar','progress_badge') DEFAULT 'emoji',
  content VARCHAR(300) NULL,   -- comment 텍스트 / 배지 문구 (emoji 타입은 emoji 컬럼 사용)
  visible BOOLEAN DEFAULT TRUE
)
```

### 확정 사항 (CLAUDE.md §8 반영)
1. `status`는 `WISH|READING|COMPLETED` 3단계 그대로 사용 — 책 상세/등록 화면에 "읽고 싶다" 선택지 추가.
2. `reading_progress_logs` 신규 테이블로 개인 진도 타임라인 구현 (스키마에 이미 추가됨, Alembic 모델/마이그레이션만 작성하면 됨).
3. `sns_stickers.type`/`content`/`visible`로 이모지·진도오버레이·**코멘트 스티커**를 한 테이블에서 구분해 저장.

### 참고
- 개인 진도(`user_library`/`reading_progress_logs`)는 페이지+% 모두 지원, 그룹 진도(`reading_progress`, C 모듈)도 동일 — 화면 기본 입력 UI(숫자 vs 슬라이더)는 자율 결정.
- 코멘트 스티커(`type='comment'`)는 SNS 공유 화면 하단의 고정 코멘트 입력창(`sns_posts.content`)과 다른 기능이다 — 사진 위에 자유배치되는 텍스트 스티커.

## API 계약
구현 전 `docs/api-contracts/reading-plan.md`에 엔드포인트(`GET /books/search`, `POST /library`, `PATCH /library/{id}/status`, `POST /library/{id}/progress`(=`reading_progress_logs` insert + `current_page` 갱신), `GET /library/{id}/progress-logs`, `POST /library/{id}/review`, `POST /sns-posts`, `POST /sns-posts/{id}/stickers`)를 먼저 정의.

## 하지 말 것
- `components/common`, `navigation/`, 다른 모듈 폴더 직접 수정
- 알라딘 API 키를 프론트엔드 코드/환경변수에 하드코딩
- 코멘트 스티커(`type='comment'`)를 `sns_posts.content`(하단 고정 코멘트)와 혼용해서 저장 — 서로 다른 기능이므로 분리 유지
