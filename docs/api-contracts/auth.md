# API 계약 — auth

> 구현 기준 문서. 변경 시 A 담당자 PR 리뷰 필요.

## 엔드포인트 목록

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/auth/signup` | 불필요 | 회원가입 |
| POST | `/auth/check-id` | 불필요 | 아이디 중복 확인 |
| POST | `/auth/login` | 불필요 | 로그인 → JWT 발급 |
| GET | `/auth/me` | 필요 | 내 정보 조회 |
| PATCH | `/auth/me` | 필요 | 프로필 수정 (닉네임, 프로필 이미지, 자기소개) |
| POST | `/auth/change-password` | 필요 | 비밀번호 변경 |
| DELETE | `/auth/me` | 필요 | 회원탈퇴 (soft delete) |

## 요청/응답 상세

### POST /auth/signup
```json
{ "login_id": "user123", "password": "pass1234!", "nickname": "닉네임" }
```
- 응답: `TokenResponse` (가입 후 즉시 로그인)

### POST /auth/check-id
```json
{ "login_id": "user123" }
```
- 응답: `{ "available": true }`

### POST /auth/login
```json
{ "login_id": "user123", "password": "pass1234!" }
```
- 응답: `TokenResponse`

### PATCH /auth/me
```json
{ "nickname": "새닉네임", "profile_image": "https://...", "introduction": "한 줄 소개" }
```
- 모든 필드 선택 (null 이면 변경 없음)

### POST /auth/change-password
```json
{ "current_password": "old", "new_password": "new123!" }
```

### DELETE /auth/me
```json
{ "password": "현재 비밀번호" }
```
- `is_deleted = TRUE` soft delete, row 실제 삭제 아님
- 탈퇴 후 동일 `login_id` 재가입 불가 (팀 미결 — 재가입 허용 정책은 별도 결정 필요)

## 비고
- 비밀번호: bcrypt 해시 (`passlib[bcrypt]`)
- 토큰: JWT, TTL = `settings.JWT_EXPIRE_MINUTES`
- 서버사이드 로그아웃 무효화(Redis 블랙리스트)는 `backend/app/core/`에 Redis 클라이언트 추가 후 구현 예정 (공용 파일 — 3인 합의 필요)
