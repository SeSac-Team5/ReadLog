# auth-module

## 트리거 (언제 이 스킬을 로드하는가)
다음에 해당하면 이 스킬을 로드한다:
- `frontend/src/screens/auth/`, `components/auth/`, `store/auth/`, `api/auth/`, `types/auth/`, `hooks/auth/` 경로의 파일을 만들거나 수정할 때
- `backend/app/modules/auth/` 경로의 파일을 만들거나 수정할 때
- 로그인, 회원가입, 마이페이지, 프로필 수정, 비밀번호 변경, 회원탈퇴, 세션(Redis) 관련 작업 요청

## 담당자
**A**

## 소유 범위 (이 경로 밖은 수정하지 않음)
```
frontend/src/screens/auth/**
frontend/src/components/auth/**
frontend/src/store/auth/**
frontend/src/api/auth/**
frontend/src/types/auth/**
frontend/src/hooks/auth/**
frontend/__tests__/auth/**
backend/app/modules/auth/**
backend/tests/auth/**
```
공용 컴포넌트(`components/common`), 네비게이션, `core`/`db`는 이 스킬 범위 밖 → 수정 필요 시 CLAUDE.md §5 규칙대로 이슈 등록 후 합의.

## 담당 화면 (Figma 참고: `docs/figma-export/App.tsx` 내 해당 컴포넌트)
| 화면 | 원본 컴포넌트 | 우선순위 |
|---|---|---|
| 로그인 | `LoginScreen` | 상 |
| 회원가입 | `SignUpScreen` | 상 |
| 마이페이지 | `MyPageScreen` | 중 |
| 프로필/닉네임 수정 | `EditProfileScreen` | 중 |
| 비밀번호 변경 | `ChangePasswordScreen` | 중 |
| 회원탈퇴 | `DeleteAccountScreen` | 중 |

## 화면별 필수 요소
- **로그인**: ID/PW 입력, 로그인 버튼, 회원가입 이동 링크, 에러 메시지 영역(빈 값/불일치 처리)
- **회원가입**: ID(중복확인 버튼) / PW / PW확인 / 닉네임, 약관 동의 체크박스(필수 2개 + 선택 1개), 가입 완료 버튼
- **마이페이지**: 프로필(닉네임, 이미지), 독서기록·북마크·한줄평·댓글·독서그룹 활동 리스트/탭, 설정 진입
- **비밀번호 변경**: 기존 PW 확인 → 신규 PW 입력 2단계
- **회원탈퇴**: PW 확인 → 경고 안내 → 최종 확인 버튼 (되돌릴 수 없음을 명확히 표시)

## Backend 규칙
- 라우터: `backend/app/modules/auth/routers/` — 엔드포인트 정의만, 로직은 `services/`에 위임
- 스키마: `backend/app/modules/auth/schemas/` — Pydantic 요청/응답 모델 (예: `LoginRequest`, `SignUpRequest`, `TokenResponse`)
- 서비스: `backend/app/modules/auth/services/` — 비밀번호 해싱, 세션 발급/검증 로직
- 모델: `backend/app/modules/auth/models/` — SQLAlchemy `User` 등
- **세션**: Redis에 세션 저장. 세션 키/TTL 정책은 `backend/app/core/`의 공용 Redis 클라이언트를 사용하되, 세션 스키마(저장 데이터 구조)는 auth 모듈이 정의.
- 비밀번호는 반드시 해시 저장 (평문 저장/로그 출력 금지).

## DB 테이블 (`docs/db/schema.sql` 기준, 확정)
```sql
users (
  id BIGINT PK,
  login_id VARCHAR(30) UNIQUE,
  password VARCHAR(255),        -- 해시 저장
  nickname VARCHAR(30) UNIQUE,
  profile_image VARCHAR(500),
  introduction VARCHAR(255),
  role ENUM('USER','ADMIN') DEFAULT 'USER',
  is_deleted BOOLEAN DEFAULT FALSE,   -- 회원탈퇴 = soft delete
  created_at, updated_at
)
```
- 세션 자체는 MySQL이 아닌 **Redis**에 저장 (users 테이블에는 세션 정보 없음)
- **회원탈퇴는 row를 실제로 DELETE하지 않고 `is_deleted=TRUE`로 처리한다.** 탈퇴 후 `login_id`/`nickname` UNIQUE 제약 때문에 같은 아이디로 재가입이 막힐 수 있으니, 탈퇴 시 정책(재가입 허용 여부, 탈퇴 계정 로그인 차단 방법)을 팀과 정하고 서비스 레이어에 명시할 것.
- `role`(USER/ADMIN)이 있으므로 관리자 권한이 필요한 기능(신고 처리 등)이 추가되면 이 컬럼을 활용.
- `introduction`(자기소개) 컬럼이 있음 — 마이페이지/프로필 수정 화면에 추가할지 팀 확인 (기존 기획서에는 닉네임/프로필 이미지만 명시됨).

## API 계약
구현 전 `docs/api-contracts/auth.md`에 엔드포인트(`POST /auth/login`, `POST /auth/signup`, `GET /auth/me`, `PATCH /auth/me`, `POST /auth/change-password`, `DELETE /auth/me` 등)를 먼저 정의하고 팀 확인 후 작업한다.

## 하지 말 것
- `components/common`, `navigation/`, `backend/app/core`, `backend/app/db`의 파일을 직접 수정
- 다른 모듈의 `store/`, `types/`를 import해서 강하게 결합 (필요하면 `types/common`으로 승격 요청)
- 비밀번호/토큰을 평문으로 저장하거나 콘솔에 출력
- 회원탈퇴 시 `users` row를 실제 DELETE 하는 쿼리를 작성 (반드시 `is_deleted` soft delete)
