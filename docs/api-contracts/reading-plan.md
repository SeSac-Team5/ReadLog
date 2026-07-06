# API 계약 — reading-plan

> 엔드포인트를 구현하기 전에 이 문서에 먼저 정의하고 팀 리뷰를 받으세요.

## 엔드포인트 목록

| Method | Path | 설명 | 요청 | 응답 |
|---|---|---|---|---|
| GET | `/books/search` | 알라딘 API 기반 책 검색 (backend 프록시) | query: `query`(필수), `page`(기본 1), `pageSize`(기본 20) | `{ items: BookSearchResult[], totalCount: number }` |
| POST | `/library` | 검색 결과를 내 서재에 추가 (로컬 `books`에 없으면 upsert) | body: `{ book: BookInput, status: "WISH"\|"READING"\|"COMPLETED" }` | `UserLibraryItem` (201). `status`가 `COMPLETED`면 `currentPage`를 `book.pageCount`로, `completedAt`을 오늘 날짜로 채운다 (이미 더 높은 `currentPage`가 있으면 유지) |
| GET | `/library` | 내 서재 목록 조회 | - | `{ items: UserLibraryItem[] }` |
| DELETE | `/library/{id}` | 내 서재에서 책 삭제 (연쇄적으로 `reading_progress_logs`도 함께 삭제됨, `ON DELETE CASCADE`) | - | 204. 본인 소유가 아니거나 없으면 404 |
| GET | `/goals/current` | 이번 달 독서 목표 + 이번 달 완독 권수 조회 | - | `MonthlyGoalResponse` (목표를 아직 설정 안 했으면 `target: null`) |
| PUT | `/goals/current` | 이번 달 독서 목표 설정/수정 (upsert) | body: `{ target: number }` (1 이상) | `MonthlyGoalResponse` |
| POST | `/library/{id}/progress` | 진도 기록 추가 (`reading_progress_logs` insert + `user_library.current_page` 갱신) | body: `{ page?: number, percent?: number, memo?: string }` (`page`/`percent` 중 최소 1개 필수, 나머지는 서버가 `book.pageCount` 기준으로 환산. `memo`는 진도 입력 화면에서 남기는 코멘트) | `{ log: ProgressLogEntry, library: UserLibraryItem }` (201). 새 `page`가 기존 `current_page`보다 낮으면 400. `page`가 `book.pageCount` 이상이 되면 `status`가 자동으로 `COMPLETED`로 바뀌고 `completedAt`이 채워짐 |
| GET | `/library/{id}/progress-logs` | 진도 기록 타임라인 조회 (최신순, `memo` 포함) | - | `{ items: ProgressLogEntry[] }` |
| GET | `/library/comments` | 내 서재 전체에서 `memo`가 채워진 진도 기록만 최신순으로 조회 (마이페이지 "한줄평" 탭용) | - | `{ items: LibraryCommentEntry[] }` |
| POST | `/sns-posts` | SNS 공유 게시물 생성 (사진) | body: `{ bookId?: string, imageUrl: string, content?: string }` (`content`는 더 이상 프론트에서 채우지 않음 — 하위 호환용으로만 남김) | `SnsPostResponse` (201, `stickers: []`) |
| POST | `/sns-posts/{id}/stickers` | 게시물에 스티커 일괄 추가 (이모지/코멘트 스티커/책 표지 스티커/진도 오버레이) | body: `{ stickers: StickerInput[] }` | `SnsPostResponse` (201, 누적된 전체 stickers 포함) |
| GET | `/reviews/{bookId}` | 특정 책에 대한 내 한줄평 조회 | - | `{ review: ReviewEntry \| null }` |
| PUT | `/reviews/{bookId}` | 한줄평 작성/수정 (upsert) | body: `{ review: string, rating?: number }` | `ReviewEntry` |
| DELETE | `/reviews/{bookId}` | 한줄평 삭제 | - | 204 |

### 타입

```ts
interface BookSearchResult {
  isbn13: string;
  title: string;
  author: string;
  publisher: string;
  coverUrl: string | null;
  pageCount: number | null;
  publishedDate: string | null; // YYYY-MM-DD
  description: string | null;
}

// POST /library 요청의 book 필드 (BookSearchResult와 동일 shape)
type BookInput = BookSearchResult;

interface ProgressLogEntry {
  id: string;
  libraryId: string;
  page: number | null;
  percent: number | null;
  memo: string | null;
  recordedAt: string; // ISO datetime
}

interface LibraryCommentEntry {
  id: string;
  libraryId: string;
  book: { id: string; title: string; coverUrl: string | null };
  memo: string; // null인 기록은 애초에 응답에서 제외됨
  recordedAt: string; // ISO datetime
}

interface MonthlyGoalResponse {
  yearMonth: string; // "YYYY-MM", 항상 서버 기준 이번 달
  target: number | null; // 아직 설정 안 했으면 null
  completed: number; // 이번 달 안에 completedAt이 찍힌 COMPLETED 권수
}

interface UserLibraryItem {
  id: string;
  book: {
    id: string;
    isbn13: string;
    title: string;
    author: string;
    publisher: string;
    coverUrl: string | null;
    pageCount: number | null;
    description: string | null;
    publishedDate: string | null; // YYYY-MM-DD
  };
  status: "WISH" | "READING" | "COMPLETED";
  currentPage: number;
  rating: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

type StickerType =
  | "emoji"
  | "comment"
  | "book_cover"
  | "progress_ring"
  | "progress_bar"
  | "progress_badge";

interface StickerInput {
  type: StickerType;
  emoji?: string | null;   // type === "emoji"일 때만 사용
  content?: string | null; // type === "comment"일 때 텍스트 — 독서 진도 입력 화면에서 남긴 가장 최근 코멘트를 그대로 채워서 보낸다 (book_cover/progress_* 타입은 서버가 계산/클라이언트가 book.coverUrl로 렌더하므로 비움)
  backgroundColor?: "white" | "beige" | "gray" | "dark" | "transparent" | null; // type === "comment"일 때 배경 프리셋 (기본 "white")
  x: number;      // 미리보기 카드 기준 0~1 비율 좌표
  y: number;
  scale?: number;    // 기본 1.0
  rotation?: number; // 기본 0 (deg)
  visible?: boolean; // 기본 true, false면 저장은 되지만 카드에는 노출 안 함
}

interface StickerEntry extends StickerInput {
  id: string;
}

interface SnsPostResponse {
  id: string;
  bookId: string | null;
  imageUrl: string | null;
  content: string | null;
  createdAt: string;
  stickers: StickerEntry[];
}

interface ReviewEntry {
  id: string;
  bookId: string;
  rating: number | null;
  review: string;
  createdAt: string;
  updatedAt: string;
}
```

## 비고

- 알라딘 API 키(`ALADIN_API_KEY`)는 backend 환경변수로만 관리, 프론트엔드에 절대 노출하지 않는다.
- `POST /library`는 `(user_id, book_id)` UNIQUE 제약과 충돌하면 409 대신 기존 행의 `status`를 갱신하는 upsert로 처리한다 (클라이언트가 "이미 추가된 책"을 별도 분기할 필요 없음).
- 인증(로그인 사용자 식별)은 `backend/app/common/deps`의 공용 의존성(`get_current_user_id`)을 사용한다고 가정하고 구현한다 — auth 모듈/공용 인프라가 준비되면 그대로 연결.
- `GET /library`는 상태 필터를 서버에서 걸지 않고 전체를 반환한다 (프론트 `MyLibraryScreen`이 클라이언트 사이드 필터링을 이미 담당).
- `/goals/current`는 항상 "서버 기준 이번 달"만 다룬다 (과거 달 목표 조회/수정 API는 없음). `completed`는 별도 컬럼에 저장하지 않고, 매 요청마다 `user_library`에서 `status=COMPLETED AND completed_at`이 이번 달인 행 수를 세서 계산한다.
- `GET /library`가 반환하는 `book`에 `description`/`publishedDate`를 추가했다 (기존엔 `BookSearchResult`에만 있던 필드) — 내 서재에서 `WISH` 상태 책을 탭했을 때 별도 조회 없이 기존 `BookDetailScreen`을 그대로 재사용해 상세를 보여주기 위함.
- `POST /sns-posts`의 `imageUrl`은 클라이언트가 캡처한 이미지를 즉시 넘긴다고 가정한다(현재는 `data:` URI 직접 전달). 별도의 이미지 업로드/스토리지(S3 등) 엔드포인트는 공용 인프라 영역이라 아직 없음 — 준비되면 `imageUrl`을 업로드 결과 URL로 교체.
- `sns_posts.content`(하단 고정 코멘트 입력)는 화면에서 제거했다 — 코멘트는 이제 독서 진도 입력 화면에서 `POST /library/{id}/progress`의 `memo`로 남긴다. `sns_posts.content` 컬럼 자체는 과거 게시물 호환을 위해 남아있지만 신규 게시물에는 채워지지 않는다.
- 코멘트 스티커(`type: "comment"`)는 자유 입력이 아니라 **해당 책의 진도 기록 중 `memo`가 채워진 가장 최근 기록**을 프론트에서 찾아 `content`로 그대로 채워 보낸다 — SNS 공유 화면에는 새 텍스트를 입력하는 UI가 없다. 배경은 5가지 프리셋(`white`/`beige`/`gray`/`dark`/`transparent`) 중 하나를 스티커 생성 시점에 고른다(`docs/db/schema.sql` V2.8).
- 책 표지 스티커(`type: "book_cover"`)는 서버에 이미지 데이터를 따로 저장하지 않는다 — 클라이언트가 렌더링 시점에 해당 `user_library`의 `book.coverUrl`을 그대로 그려서 보여준다 (position/scale/rotation만 저장).
- `GET /books/search`는 실시간 자동완성이 아니라 **사용자가 명시적으로 검색을 트리거할 때만** 호출한다 (검색 버튼 탭 또는 키보드 엔터). 매 키 입력마다 호출하지 않는다.
- `GET /books/search` 결과 중 이미 로컬 `books` 테이블에 있는 항목은 알라딘 원본 값 대신 DB에 저장된 값(특히 `pageCount`)으로 덮어써서 응답한다 — 알라딘 검색 API는 `pageCount`를 거의 항상 비워서 주기 때문.
- `POST /library`로 신규 책이 등록될 때 `pageCount`가 비어 있으면, 서버가 알라딘 `ItemLookUp` API를 한 번 더 호출해 페이지 수를 채운 뒤 `books` 테이블에 저장한다 (검색 API의 `ItemSearch`와 다른 엔드포인트).
