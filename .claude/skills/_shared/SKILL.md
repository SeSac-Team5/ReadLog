# _shared (공용 컨벤션)

## 트리거
다음에 해당하면 이 스킬을 로드한다:
- `frontend/src/components/common/`, `frontend/src/navigation/`, `frontend/src/constants/`, `frontend/src/api/client/`, `frontend/src/types/common/` 수정
- `backend/app/core/`, `backend/app/db/`, `backend/app/common/` 수정
- 메인 홈(`screens/home`) 작업
- 세 모듈에 공통으로 영향을 주는 변경 (디자인 토큰, 공용 버튼/입력/네비바/탭바, DB 커넥션, 인증 미들웨어)

## 소유권
특정 개인 소유 아님 — **변경 시 A/B/C 3인 리뷰 필수** (CLAUDE.md §5).

## 디자인 토큰 (임의 색상 사용 금지)
| 용도 | 값 |
|---|---|
| 카드/브랜드 배경 (딥그린) | `#2D4A3E` |
| 텍스트/배경 (베이지, 밝음) | `#FDFBF4` |
| 배경 (베이지, 톤다운) | `#EDE7D8` |
| 완독 진도 강조 | Green 계열 (`green-500`) |

`frontend/src/constants/theme.ts`에 위 값을 상수로 export하고 각 모듈은 이 파일만 import한다.

## 공용 컴포넌트 (수정 시 3인 합의)
- `NavBar` — 상단 네비게이션 바 (뒤로가기, 타이틀, 우측 액션 슬롯)
- `TabBar` — 하단 탭바 (홈/내 서재/독서모임/마이, 4탭 고정 — 좌측 슬라이드 메뉴 방식은 폐기됨, `edit-prompt.md` §6)
- `PrimaryBtn`, `Field`, `Label` 등 기본 입력/버튼 프리미티브
- Safe Area 처리: 상단 헤더·하단 탭바는 노치/홈 인디케이터 안쪽에 배치된다고 가정

## 메인 홈 (`MainHomeScreen`) — 대시보드
- 독서 현황 카드(B 모듈 데이터: 완독 권수, 읽는 중 책 진행률) — "더보기" → 내 서재
- 모임 진도 미리보기(C 모듈 데이터: 참여 모임 0개 시 빈 상태 CTA, 1개 이상 시 멤버 진도 바 카드) — "더보기" → 독서모임 목록
- 데이터는 각 모듈의 API를 호출해서 조합 (프론트: 홈 화면에서 `api/reading-plan`, `api/reading-group`를 읽기 전용으로 호출 가능 — 단, 그 반대로 reading-plan/reading-group 화면이 home 코드를 참조하지는 않음)

## Backend 공용 (`backend/app/core`, `backend/app/db`, `backend/app/common`)
- `core/`: 설정(`config.py`), Redis 클라이언트, JWT/세션 검증 의존성
- `db/`: SQLAlchemy 엔진/세션 팩토리, Base 모델
- `common/deps`: 인증 필요 라우터에서 쓰는 `get_current_user` 등 공용 의존성
- `common/exceptions`: 표준 에러 응답 포맷
- 각 모듈은 이 계층을 **가져다 쓰기만** 하고, 직접 수정이 필요하면 이슈 등록 후 합의

## API 클라이언트 공용 (`frontend/src/api/client`)
- axios(or fetch) 인스턴스, 공용 인터셉터(인증 헤더, 401 처리) 여기서만 정의
- 각 모듈의 `api/{module}`은 이 client를 import해서 엔드포인트별 함수만 추가

## 하지 말 것
- 모듈 폴더에서 자체적으로 새 axios 인스턴스나 별도 NavBar/TabBar를 만들어 사용 (반드시 공용 컴포넌트 재사용)
- 디자인 토큰 값을 하드코딩 (`#2D4A3E` 등을 직접 문자열로 여러 곳에 반복 입력)
- 공용 파일을 단독 PR로 머지 (3인 리뷰 전 머지 금지)
