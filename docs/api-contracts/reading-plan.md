# API 계약 — reading-plan

> 구현 기준 문서. 변경 시 B 담당자 PR 리뷰 필요.

## 엔드포인트 목록

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/books/search` | 필요 | 알라딘 API 프록시 책 검색 (`?q=쿼리&page=1`) |
| GET | `/books/{isbn13}` | 필요 | 책 상세 조회 (DB 우선, 없으면 알라딘 프록시) |
| GET | `/library` | 필요 | 내 서재 목록 (본인 것만) |
| POST | `/library` | 필요 | 책 내 서재 추가 |
| PATCH | `/library/{id}/status` | 필요 | 독서 상태 변경 (READING ↔ COMPLETED) |
| POST | `/library/{id}/progress` | 필요 | 진도 저장 (`page` 또는 `percent` 중 하나 필수) |
| GET | `/library/{id}/progress-logs` | 필요 | 진도 기록 타임라인 |
| GET | `/library/{id}/review` | 필요 | 한줄평 조회 |
| POST | `/library/{id}/review` | 필요 | 한줄평 등록/수정 (upsert) |
| DELETE | `/library/{id}/review` | 필요 | 한줄평 삭제 |
| POST | `/sns/posts` | 필요 | SNS 게시물 저장 (오버레이 합성 후 이미지 URL만 저장) |

## 요청/응답 상세

### GET /books/search
- Query: `q` (string, 필수), `page` (int, 기본값 1)
- Response: `BookSearchItem[]`

### POST /library
```json
{ "isbn13": "9791234567890", "status": "READING" }
```
- `status` 허용값: `READING`, `COMPLETED` (UI에서 `WISH` 진입 경로 없음)
- 이미 서재에 있으면 409

### PATCH /library/{id}/status
```json
{ "status": "COMPLETED" }
```

### POST /library/{id}/progress
```json
{ "page": 120, "percent": 34.2 }
```
- `page`, `percent` 중 하나 이상 필수
- 저장 시 `user_library.current_page` 자동 갱신

### POST /sns/posts
```json
{ "book_id": 1, "image_url": "https://...", "content": "오늘의 독서" }
```
- `image_url`: 프론트에서 오버레이 합성 후 업로드한 최종 이미지 URL
- 오버레이(원형게이지/진행바/텍스트배지)는 프론트 state에서만 관리하고 이미지 합성 후 전송

## 비고

- **알라딘 API 키**: `backend/app/core/config.py`에 `ALADIN_API_KEY` 추가 필요 (공용 파일 — 3인 합의 후 별도 PR). 그 전까지 `os.getenv("ALADIN_API_KEY", "")` 직접 참조.
- **`reading_progress_logs` 테이블**: 스키마 원본에 없음. `Base.metadata.create_all`로 자동 생성됨 (SQLAlchemy 모델 등록 기준).
- **진도 단위**: 개인 서재(`user_library.current_page`)는 페이지 기준. 그룹 진도(`reading_progress`)는 페이지+% 병행 — 두 모듈 간 단위 혼용 의도된 설계.
