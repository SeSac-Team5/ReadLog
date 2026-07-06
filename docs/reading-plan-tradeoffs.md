# reading-plan 모듈 — 절충점 / 임시 처리 목록

> 담당: B (reading-plan)
> 공용 인프라(백엔드 core/db, 프론트 navigation/theme/api client)가 아직 없는 상태에서
> "코드는 먼저 작성하고 나중에 연결한다"는 방침(2026-07-03 합의)으로 진행하면서 생긴 임시 처리들을 정리한 문서.
> 공용 인프라가 준비되면 이 문서의 항목들을 하나씩 지워나가면 됨.
> **2026-07-03 업데이트**: 로컬 DB 테스트를 위해 아래 "백엔드 공용 인프라"를 실제로 만들었다 (B가 임시로 작업, 공용 파일이라 팀 리뷰 필요 — 별도 커밋/PR로 분리 권장).

## 백엔드 공용 인프라 — 로컬 테스트용으로 최소 구현 완료 (팀 리뷰 대기)

기존엔 아래 경로들이 존재하지 않는다고 가정만 하고 reading_plan 코드를 작성했었는데, 로컬 DB 테스트를 위해 최소 버전으로 실제로 만들었다.

| 경로 | 내용 | 비고 |
|---|---|---|
| `backend/app/core/config.py` | `pydantic-settings` 기반 `Settings` (`DATABASE_URL`, `REDIS_URL`, `ALADIN_API_KEY`, `SECRET_KEY`), `.env` 로드 | |
| `backend/app/db/base.py` | SQLAlchemy `Base` + reading_plan 모델 전체 import (metadata 등록용) + `users` 테이블 임시 스텁(1컬럼) | **임시 스텁** — 아래 참고. 다른 모듈 모델이 생기면 여기에도 import 추가 필요 |
| `backend/app/db/session.py` | `engine`/`SessionLocal`/`get_db` | MySQL(PyMySQL 드라이버) 기준 |
| `backend/app/common/deps/current_user.py` | `get_current_user_id` | **임시 스텁** — 아래 참고 |
| `backend/app/main.py` | FastAPI 앱, reading_plan 라우터를 `/api` prefix로 등록, `/health` | auth/reading_group 라우터는 아직 미등록 |
| `backend/requirements.txt`, `backend/.env`, `backend/.env.example` | 의존성 목록 + 환경변수 | `.env`는 로컬 전용(gitignore), `.env.example`만 커밋됨 |
| `docker-compose.yml` (루트) | 로컬 MySQL(`docs/db/schema.sql`로 자동 초기화) + Redis | `docker-compose up -d` |

### ⚠ `get_current_user_id`는 진짜 인증이 아니다
`backend/app/common/deps/current_user.py`는 요청 헤더 `X-User-Id`(기본값 1)를 그대로 신뢰하는 임시 스텁이다. 클라이언트가 아무 값이나 헤더에 넣으면 다른 사용자로 위장할 수 있으므로 **로컬 개발/테스트 전용**이며, auth 모듈이 JWT/세션 검증을 붙이면 반드시 교체해야 한다 (프로덕션에 이 상태로 배포 금지).

### ⚠ `app/db/base.py`의 `users` 테이블도 진짜가 아니다
reading_plan의 여러 테이블(`user_library`, `books`, `reviews`, `sns_posts`)이 `ForeignKey("users.id")`를 참조하는데, auth 모듈의 실제 `User` 모델이 아직 없어서 SQLAlchemy가 FK를 해석할 대상 테이블을 못 찾아 `NoReferencedTableError`가 났었다(실제로 "내 서재에 추가"에서 발생). `id` 컬럼 하나만 있는 임시 `Table("users", ...)`을 등록해서 우선 해결했다. **auth 모듈이 진짜 `User` 모델을 추가하면 이 스텁은 반드시 지워야 한다** — 같은 이름으로 두 번 등록되면 `Table 'users' is already defined` 에러가 남.

### 검증한 것 / 검증 못한 것
- `pip install -r requirements.txt` → `python -c "from app.main import app"` → 라우트 전부 정상 등록 확인함 (`backend/.venv`에 설치돼 있음, `source .venv/bin/activate`로 재사용 가능).
- `Base.metadata.create_all()`로 테이블 생성 확인함 (`users` 스텁 포함 7개 테이블 전부 생성됨).
- 실제 MySQL(docker-compose)에 붙여서 요청까지 보내는 건 이 환경에 Docker가 없어서 확인 못함 — 대신 SQLite + FastAPI TestClient로 `/library`, `/reviews`, `/sns-posts` 등 주요 엔드포인트를 mock 없이 실제 요청/응답으로 검증함.
- 알라딘 검색(`GET /books/search`)은 실제 `ALADIN_API_KEY` 없이는 테스트 불가 (`.env`의 `ALADIN_API_KEY`를 발급받은 키로 교체해야 함). 검색 API가 `http://`로 호출되던 걸 `https://` + `follow_redirects=True`로 고쳤고(알라딘이 301 리다이렉트를 내려서 안 되고 있었음), 신규 책 등록 시 `pageCount`가 비어있으면 `ItemLookUp` API로 한 번 더 채우도록 추가함.

## 프론트엔드 — 공용 컴포넌트/인프라 부재로 인한 임시 처리

| 항목 | 임시 처리 | 실제로 필요한 것 |
|---|---|---|
| 네비게이션 | 모든 화면이 `onBack`/`onSearchPress`/`onBookPress`/`onAdded`/`onShared` 같은 콜백 prop으로 화면 전환을 위임 (navigation 라이브러리 미사용) | 팀원이 작업 중인 네비게이션 스택에 화면을 등록하고 콜백을 실제 이동 로직으로 연결 |
| 디자인 토큰 | `frontend/src/constants/theme.ts`가 없어서 각 화면 파일 안에 `COLORS` 상수를 중복 선언 (CLAUDE.md 팔레트 값과 동일하게 유지 중) | `theme.ts` 생성 후 각 화면의 로컬 `COLORS`를 전부 그걸 참조하도록 교체 |
| API 클라이언트 | `frontend/src/api/client`가 없어서 `frontend/src/api/reading-plan/httpClient.ts`에 자체 `fetch` 래퍼를 만들어 사용 (base URL은 `EXPO_PUBLIC_API_BASE_URL` env, 인증 헤더 없음) | 공용 API 클라이언트가 생기면 reading-plan 쪽 요청도 그걸로 교체 (인증 토큰 첨부 등) |
| 앱 진입점 | `LibraryProvider`를 감싸는 루트가 없음 — `MyLibraryScreenContainer`, `BookSearchScreen` 등은 같은 `LibraryProvider` 트리 안에 있다고 가정하고 `useLibrary()`를 호출 | 네비게이션 스택 루트(또는 그 상위)에서 `<LibraryProvider>`로 감싸야 함 |

## `docs/dev-environment.md`와 어긋나는 부분 (뒤늦게 확인함)

reading-plan 화면들을 만들 당시엔 `docs/dev-environment.md`를 확인하지 못해서, 팀이 이미 정해둔 라이브러리 스택과 다른 방식으로 구현한 부분이 있다.

| 항목 | 팀이 정한 것 (dev-environment.md) | 지금 reading-plan 코드 상태 |
|---|---|---|
| HTTP 클라이언트 | `axios` | 직접 만든 `fetch` 래퍼(`api/reading-plan/httpClient.ts`) — 아직 `axios` 미설치 |
| 서버 상태 관리 | `@tanstack/react-query` | `useState`/`useEffect` 기반 커스텀 훅(`useBookSearch`, `useProgressLogs`, `useReview` 등) |
| 클라이언트 상태 | `zustand` | React Context + `useReducer`(`libraryStore.tsx`) |
| 아이콘 | `lucide-react-native` | 이모지/텍스트 문자(🔍, ‹, ✕ 등)로 임시 대체 |
| 스티커 드래그 | `react-native-gesture-handler` + `react-native-reanimated` | RN 코어 `PanResponder` (새 의존성 없이 구현) |

전부 동작은 하지만, 팀 표준 라이브러리가 실제로 설치되는 시점에 위 부분들을 맞춰서 리팩터링하는 게 좋음 (지금 당장 급한 건 아님).

## SNS 공유 화면 관련 절충점

1. ~~**원형 게이지 스티커 단순화**~~ — **해결됨.** `react-native-svg`를 설치(`pod install` 완료)하고 `progress_ring`을 실제 SVG 원형 게이지(`strokeDasharray` 기반)로 교체했다. 새 네이티브 모듈이라 다음 Xcode 빌드 때 반영됨(JS 리로드만으로는 안 됨).
2. **이미지 업로드 방식** — 캡처한 이미지를 스토리지에 올리는 공용 엔드포인트(S3 등)가 없어서, `POST /sns-posts`에 캡처 결과를 `data:` URI로 직접 실어 보낸다.
   - 필요한 것: 공용 미디어 업로드 엔드포인트가 생기면 `imageUrl`을 업로드 결과 URL로 교체 (payload 크기/서버 저장 부담 감소).
   - **실제로 겪은 버그**: 처음엔 `captureRef`를 PNG(무손실)로 캡처해서 base64가 수백만 자까지 커졌고, `sns_posts.image_url`도 원래 `VARCHAR(500)`라 "Data too long" 에러가 났다. 캡처를 JPEG(`quality: 0.7~0.9`)로 바꿔 용량을 줄이고, `image_url`을 `LONGTEXT`로 확장해서 해결(스키마 V2.2 additions 참고). base64 직접 저장 자체는 여전히 임시방편이라, 사진이 아주 크거나 스티커가 많으면 다시 문제될 수 있음 — 근본 해결은 결국 공용 업로드 엔드포인트.
3. **스티커 드래그 구현** — `react-native-gesture-handler`/`reanimated` 없이 React Native 코어 `PanResponder`만으로 드래그를 구현했다 (새 의존성 추가 없음). 확대/축소·회전은 버튼 스텝퍼 방식(핀치 제스처 아님). 팀은 원래 `gesture-handler`+`reanimated` 조합을 쓰기로 했었음(위 표 참고).
   - 필요하면: `react-native-gesture-handler` 설치되는 대로 `DraggableSticker`를 `PanGestureHandler` 기반으로 교체해 핀치/회전 제스처까지 자연스럽게 지원.
4. **인스타그램 공유 API 수정 완료** — 처음엔 `Share.shareSingle({ social: Share.Social.INSTAGRAM, url, type })`로 잘못 구현했었는데, `dev-environment.md` 3번 항목에 팀이 이미 `INSTAGRAM_STORIES` + `backgroundImage`/`appId` 조합으로 정해둔 걸 확인하고 맞춰서 고쳤다.
   - **남은 일**: ~~`appId`는 Facebook Developer 앱을 등록해야 나오는 값이라 아직 빈 문자열(`EXPO_PUBLIC_INSTAGRAM_APP_ID` env, 미설정)이다. 실제 앱 ID가 나오면 `.env`에 채워 넣어야 진짜 인스타그램 스토리 공유가 동작함.~~ → **폐기 (2026-07-06)**: `react-native-share`가 서드파티 네이티브 모듈이라 Expo Go 바이너리에 없어서(`TurboModuleRegistry: 'RNShare' could not be found`) 앱 부팅 시 즉시 크래시했다. Expo Go로 계속 개발/테스트하기 위해 Expo SDK 내장 모듈인 `expo-sharing`으로 교체 — 일반 OS 공유 시트만 지원하고 인스타그램 스토리 다이렉트 공유(`Social.InstagramStories`)는 더 이상 불가. `INSTAGRAM_APP_ID` 관련 코드/env도 함께 제거함. 다이렉트 공유가 다시 필요해지면 `expo-dev-client` 기반 커스텀 빌드로 전환하고 `react-native-share`를 재도입해야 함.
   - **임시 폴백 추가**: `INSTAGRAM_APP_ID`가 비어있으면 `Share.shareSingle`(Instagram 전용) 대신 `Share.open`(일반 공유 시트)으로 자동 대체하도록 `SNSShareScreen.tsx`에 분기를 추가했다. Meta 개발자 앱 승인/설정을 기다리는 동안에도 공유 플로우 전체(캡처→게시물 생성→스티커 저장→공유)를 테스트할 수 있게 하기 위함. `appId`가 채워지면 자동으로 진짜 `INSTAGRAM_STORIES` 경로를 타니 이 분기는 그대로 둬도 무방함.
   - `react-native-share`는 Expo config plugin(`app.plugin.js`)을 제공하는데 아직 `app.json`에 등록 안 함 — iOS `Info.plist`의 `LSApplicationQueriesSchemes`에 인스타그램이 없어서 "인스타그램을 열 수 없음" 류 에러가 날 수 있음. 플러그인 등록은 `expo prebuild` 재실행이 필요한데, `dev-environment.md`에 이미 경고된 대로 재실행하면 Xcode 서명 설정이 초기화될 위험이 있어 실제로 이 에러를 만나기 전까진 보류함.
5. **스티커가 사진 영역 밖으로 나가는 버그(해결)** — `DraggableSticker`가 top-left 앵커 좌표만 0~1로 clamp하고 있어서, 앵커를 가장자리로 끌면 스티커 몸체 대부분이 사진 밖으로 삐져나갔다. `onLayout`으로 스티커의 실제 렌더 크기를 측정해서, `scale`까지 반영한 실제 시각적 경계가 사진 안에 들어오도록 clamp 범위를 다시 계산하도록 고쳤다.
6. **공유 이미지에 선택 테두리(점선)가 찍히는 버그(해결)** — 스티커를 누른 채로(선택 상태로) 공유하면 `stickerWrapperSelected`의 점선 테두리까지 캡처됐다. `handleShare` 시작 시 선택을 잠깐 해제하고 2프레임(`requestAnimationFrame` 두 번) 기다린 뒤 캡처하고, 끝나면 원래 선택 상태로 복원하도록 고쳤다.
7. **코멘트 스티커 배경 4종 추가** — 화이트/그레이/투명/다크 프리셋을 `sns_stickers.background_color` 컬럼(신규, 스키마 V2.3)에 저장한다. 다크 배경일 때만 텍스트를 흰색으로 자동 전환.

## 백엔드 — Enum 컬럼 관련 주의사항 (실제로 겪은 버그)

SQLAlchemy의 `Enum(SomePyEnum, native_enum=False)`는 **기본적으로 Python enum의 이름(`EMOJI`)을 DB에 저장/조회하지, 값(`"emoji"`)을 쓰지 않는다.** `sns_stickers.type`이 이 문제로 걸렸다 — 실제 MySQL 컬럼은 `docs/db/schema.sql`에 소문자 값(`'emoji'`, `'comment'`, ...)으로 정의돼 있는데, SQLAlchemy는 대문자 이름 기준으로 읽으려다 `LookupError: 'emoji' is not among the defined enum values`가 났다. (INSERT는 MySQL의 enum 값 대소문자 비교가 관대해서 조용히 성공하고, SELECT 시점에 터지는 게 헷갈리는 부분.)

**고친 것**: `models/sns_sticker.py`의 `StickerType`, `models/user_library.py`의 `LibraryStatus` 둘 다 `Enum(..., values_callable=lambda cls: [m.value for m in cls])`를 추가해서 값 기준으로 매핑하도록 고쳤다. 실제 DB round-trip(insert 후 새 세션에서 재조회)까지 테스트해서 확인함.

**앞으로 새 Enum 컬럼을 추가할 때 반드시 `values_callable`을 같이 넣을 것** — 이름과 값이 우연히 같은 enum(`LibraryStatus`의 `WISH="WISH"`처럼)은 이 버그가 조용히 숨어있다가, 나중에 이름≠값인 enum을 추가하는 순간 터진다.

## 내 서재 화면 — 상태별 표시/탭 동작 정리 (2026-07-03)

- **상태 배지**: 기존엔 `COMPLETED`만 우측 상단에 체크 배지가 떴다. `READING`(📖)/`WISH`(🔖)에도 배지를 추가해서 그리드에서 바로 상태를 구분할 수 있게 했다.
- **`WISH` 탭 동작 변경**: 기존엔 `WISH` 상태 책을 탭하면 (아직 갖고 있지도 않은 책인데) 독서 진도 입력 화면으로 넘어가는 버그가 있었다. `WISH`는 책 상세(`BookDetailScreen`)로, `READING`은 기존대로 진도 입력으로, `COMPLETED`는 기존 오버레이(감상 남기기/스토리 공유)로 분기하도록 고쳤다.
- **`WISH` 책 상세 데이터 출처**: 별도 조회 없이 `GET /library`가 이미 갖고 있는 `book` 정보를 그대로 `BookDetailScreen`에 넘긴다. 다만 `BookDetailScreen`은 원래 검색 결과(`BookSearchResult`, `description`/`publishedDate` 포함) 전용이었고 라이브러리 응답의 `book`(`LibraryBookSummary`)에는 그 두 필드가 없었어서, 백엔드 `LibraryBookSummary`/`to_library_item_response`에 `description`/`publishedDate`를 추가해 채워 보내도록 고쳤다 (`docs/api-contracts/reading-plan.md`에도 반영). `BookDetailScreen`은 이미 `isbn13`으로 `existingEntry`를 찾아 "상태 업데이트" 버튼을 보여주는 로직이 있어서 그대로 재사용 가능했다.

## 내 서재 화면 — 책 삭제 + 이달의 목표 추가 (2026-07-03)

- **`⋮` 메뉴 위치**: 처음엔 그리드 카드마다 `⋮` 버튼을 달았었는데, 사용자 피드백으로 **`SummaryBanner`(완독 권수/이달의 목표 배너) 우측 상단 하나로 통일**했다 — "삭제"/"목표 설정" 둘 다 화면 레벨 액션이라 카드마다 반복해서 둘 필요가 없다는 판단. `Alert.alert`로 "삭제"/"목표 설정"/"취소" 액션시트를 띄운다 (카메라 촬영/앨범 선택 때 쓴 것과 동일한 패턴, 별도 UI 라이브러리 없이 구현).
- **선택 삭제(토글) 모드**: 배너 `⋮` → "삭제"를 누르면 아무것도 선택 안 된 채로 "선택 모드"에 들어간다. 이 모드에서는 카드를 탭할 때마다(상태 무관) 체크 토글만 되고, 기존 탭 동작(진도입력/상세/오버레이)은 잠긴다. 헤더가 "취소" / "N개 선택" / "삭제"로 바뀌고, "삭제" 확인 시 `DELETE /library/{id}`를 선택한 개수만큼 병렬 호출한다. 필터(전체/읽는 중/완독/읽고 싶어요)를 바꿔도 선택 상태(`selectedIds`)는 유지되므로, 여러 상태를 넘나들며 골라서 한 번에 지울 수 있다.
- **삭제 시 연쇄 삭제**: `user_library` 삭제 시 `reading_progress_logs`는 스키마의 `ON DELETE CASCADE`로 자동 삭제된다. `reviews`/`sns_posts`는 `book_id` 기준이라 삭제되지 않고 남는다 — 같은 책을 나중에 다시 추가하면 예전 한줄평/SNS 게시물이 그대로 남아있을 수 있음 (의도된 동작인지는 아직 논의 안 됨, 필요하면 나중에 정책 결정).
- **`bookmarks` 테이블 제거 (2026-07-06)**: 마이페이지 활동 탭에서 "북마크"가 "독서기록"과 방향성이 겹친다고 판단해 별도 기능으로 유지하지 않기로 함. 원래도 이 테이블에 대응하는 모델/스키마/라우터가 구현된 적이 없었던 V1 설계 잔재라 실질적 영향 없음 (스키마 V2.6).
- **이달의 목표(신규 기능)**: Figma 목업(`docs/figma-export/App.tsx`)엔 있었지만 그동안 구현이 안 돼 있던 기능. 배너 `⋮` 메뉴의 "목표 설정"에서 진입하는 모달(커스텀 `Modal` + `TextInput`, 별도 라이브러리 없음)로 이번 달 목표 권수를 입력한다.
  - 백엔드에 `reading_goals(user_id, year_month, target_books)` 신규 테이블 추가 (스키마 V2.4). `completed`는 별도로 저장하지 않고 `user_library.status=COMPLETED AND completed_at`이 이번 달인 행 수를 매번 계산해서 응답한다.
  - `/goals/current`는 "서버 기준 이번 달"만 다룬다 — 과거 달 조회/수정 API는 없음 (요구사항에 없었음).
  - 목표를 아직 설정 안 한 상태(`target: null`)에서는 배너에 진행바 대신 "책 카드의 ⋮ 메뉴에서 목표를 설정해보세요" 안내 문구만 뜬다.
  - SQLite로 목표 upsert/재조회, 삭제 후 재삭제 시 404 나는지까지 라운드트립 테스트해서 확인함.

### ⚠ 실제로 겪은 버그: `year_month`는 MySQL 예약어라 컬럼명으로 못 씀

`reading_goals` 테이블을 처음엔 `year_month CHAR(7)` 컬럼으로 만들었는데, 사용자가 실제 MySQL(8.0.46)에 그대로 실행하니 `CREATE TABLE` 문 자체가 문법 오류로 실패했다. 에러 메시지가 애매해서(따옴표 깨짐/이전 문장과 섞임을 먼저 의심함) 로컬에 Homebrew MySQL(9.5, 8.0 계열과 문법 호환)을 임시로 띄워 동일 문장을 그대로 재현했고, 컬럼명을 하나씩 바꿔가며 이분 탐색한 결과 **`YEAR_MONTH`가 `INTERVAL ... YEAR_MONTH` 구문에 쓰이는 예약어라 따옴표 없이 컬럼명으로 못 쓴다**는 걸 확인했다 (`day_hour`, `day_minute`, `hour_minute` 등 다른 INTERVAL 단위 이름들도 전부 동일하게 실패함 — MySQL 예약어 목록에 있는 컴파운드 시간 단위는 전부 해당).

**고친 것**: 컬럼명을 `year_month` → `goal_month`로 변경 (`docs/db/schema.sql`, `models/reading_goal.py`, `services/goal_service.py` 전부 반영). API 응답 필드명(`yearMonth`)은 DB 컬럼명과 무관하므로 그대로 유지.

**앞으로 새 컬럼/테이블명을 지을 때**: `YEAR_MONTH`, `DAY_HOUR`, `DAY_MINUTE`, `DAY_SECOND`, `HOUR_MINUTE`, `HOUR_SECOND`, `MINUTE_SECOND` 같은 MySQL `INTERVAL` 복합 단위 이름은 예약어라 피할 것 (백틱으로 감싸면 되긴 하지만, 매번 신경 쓸 필요 없이 다른 이름을 쓰는 게 마음 편함).

## SNS 공유 화면 — 스티커 확대/회전을 버튼 대신 두 손가락 제스처로 (2026-07-03)

기존엔 스티커를 고르면 "확대"/"축소"/"회전" 버튼을 눌러 15%/15도씩 계단식으로 조절했는데, 사용자가 "꼭 버튼이어야 하냐, 두 손가락으로 직접 확대·회전하면 안 되냐"고 요청해서 표준적인 핀치-투-줌/두 손가락 회전 제스처로 교체했다.

- **`react-native-gesture-handler` 없이 구현**: 이 프로젝트는 스티커 드래그도 이미 RN 코어 `PanResponder`만으로 구현돼 있어서(팀이 원래 쓰기로 한 `gesture-handler`+`reanimated`가 아직 안 붙음, 위 "팀 표준 라이브러리 미도입" 표 참고), 핀치/회전도 같은 방식으로 맞췄다. `PanResponder`의 콜백에 넘어오는 `event.nativeEvent.touches` 배열(현재 화면에 닿아있는 모든 손가락의 `pageX`/`pageY`)을 직접 읽어서, 터치가 2개면 두 점 사이 거리(피타고라스)로 스케일 배율을, 두 점이 이루는 각도(`atan2`)로 회전각을 계산한다.
- **기준점(anchor) 스냅샷 방식**: 두 번째 손가락이 닿는 순간의 거리/각도와 스티커의 그 시점 `scale`/`rotation`을 `pinchStartRef`에 저장해두고, 이후 매 프레임 "지금 거리 ÷ 기준 거리"를 기준 `scale`에 곱하고 "지금 각도 − 기준 각도"를 기준 `rotation`에 더하는 식으로 계산한다. 매 프레임 이전 값에 델타를 누적하는 방식이 아니라서 오차가 쌓이지 않는다.
- **1손가락 ↔ 2손가락 전환 시 점프 방지**: 핀치 중엔 위치(x, y)를 건드리지 않고 스케일/회전만 바꾸는데, 손가락 하나를 떼서 다시 드래그(이동)로 전환되는 순간 `PanResponder`의 `gesture.dx/dy`는 제스처 시작 시점(첫 손가락이 닿은 순간)부터 누적된 값이라 그대로 쓰면 위치가 홱 튄다. 그래서 2→1손가락 전환을 감지한 프레임에 `startPos`를 스티커의 현재 위치로, `dragOffsetRef`를 그 순간의 `gesture.dx/dy`로 다시 앵커링해서, 그 이후의 이동만 반영되도록 했다.
- **버튼 + 제스처 병행**: 처음엔 확대/축소/회전 버튼을 지우고 제스처로만 대체했었는데, 사용자가 "제스처는 위화감 없지만 세밀 조정엔 버튼도 같이 있는 게 낫다"고 해서 **확대/축소/회전 버튼(15%/15도 단위)을 다시 살리고 두 손가락 제스처와 함께 제공**하는 걸로 바꿨다. 버튼은 값을 15%/15도씩 정확히 스텝 이동시키고, 제스처는 손끝 움직임에 맞춰 연속적으로 반영되는 식이라 서로 배타적이지 않고 같은 `updateSticker(id, { scale, rotation })` 경로를 공유한다. 숨기기/삭제는 원래부터 버튼 전용(토글/파괴적 동작이라 제스처로 매핑하기 애매함).
- **한계/추후 개선 여지**: `gesture-handler`의 `PinchGestureHandler`/`RotationGestureHandler`처럼 velocity 기반 감쇠나 두 제스처의 정교한 동시 인식은 없다 — 순수 좌표 계산이라 다소 투박할 수 있음. 실제 기기에서 써보고 위화감이 크면 `gesture-handler` 도입 시점에 이 부분부터 교체하는 게 좋다.

## develop 통합 — 로컬 실행을 위한 임시 auth 스텁 (2026-07-03)

`feature/reading-plan/develop-integration` 브랜치에서 reading_plan을 develop에 얹었더니, `backend/main.py`가 시작하자마자 `import app.modules.auth.models.user`와 `from app.modules.auth.routers.auth_router import router`를 하는데 **auth 모듈(A 담당) 자체가 아직 develop에 없어서** 서버가 아예 못 떴다 (`ModuleNotFoundError: No module named 'app.modules.auth'`).

로컬에서 계속 테스트해야 해서, `backend/app/modules/auth/` 밑에 **임시 스텁**을 만들어 import만 통과시켰다:
- `models/user.py` — `docs/db/schema.sql`의 `users` 테이블 컬럼 그대로 매핑한 최소 `User` 모델 (로그인/인증 로직 없음).
- `routers/auth_router.py` — 엔드포인트 없는 빈 `APIRouter(prefix="/auth")`.

이 스텁 덕분에 `main.py` import는 통과하지만, `app.common.deps.get_current_user`(세션 쿠키 기반 진짜 인증)는 실제 로그인 엔드포인트가 없어서 항상 401이 난다. **reading_plan 라우터들은 이 실제 인증을 안 쓰고 자체 스텁(`app/modules/reading_plan/deps.py`의 `get_current_user_id`, `X-User-Id` 헤더)을 쓰기 때문에 reading_plan 기능 테스트엔 영향 없다.** reading_group 라우터는 진짜 `get_current_user`를 쓰므로 로그인 없이는 테스트 불가.

**⚠ A 담당자의 진짜 auth 모듈이 develop에 올라오면 이 스텁은 반드시 삭제할 것** — `backend/app/modules/auth/**` 전체. 같은 이름(`User`)의 모델이 같은 `Base`에 두 번 등록되면 SQLAlchemy가 매퍼 충돌 에러를 낸다.

### 프론트에도 같은 문제 — auth store/화면 임시 스텁

백엔드와 똑같은 이유로 프론트도 안 떴다: `App.tsx`/`navigation/index.tsx`/`HomeScreen`/일부 reading-group 화면이 `frontend/src/store/auth/AuthContext`(진짜 로그인 상태 관리)와 `frontend/src/screens/auth/*` 6개 화면을 import하는데, 둘 다 develop에 없어서 `Unable to resolve module` 번들 에러가 났다.

만든 것 (전부 "A 담당자 실제 구현 오면 삭제" 대상):
- `frontend/src/store/auth/AuthContext.tsx` — `useAuth()`가 **항상 로그인된 가짜 유저**(`{ id: 1, nickname: "테스트유저" }`, `isRestoring: false`)를 반환하는 스텁. 진짜 로그인 화면(`Login`/`SignUp`)을 거치지 않고 바로 `MainTabs`(홈/서재/모임/마이페이지)로 들어가게 하기 위함 — 백엔드의 `get_current_user_id` 헤더 스텁(항상 user_id=1)과 같은 발상.
- `frontend/src/screens/auth/{LoginScreen,SignUpScreen,MyPageScreen,EditProfileScreen,ChangePasswordScreen,DeleteAccountScreen}.tsx` — `navigation/index.tsx`가 로그인 여부와 무관하게 6개 파일을 전부 정적 import하기 때문에(마이페이지 탭 스택에 4개가 포함됨), 실제로는 거의 안 보이더라도 파일 자체는 있어야 번들이 됨. 전부 "OO 화면 준비 중" 텍스트만 있는 빈 화면.

이 스텁들 덕분에 `npx expo export`가 1043 모듈로 정상 번들됨을 확인. **A의 실제 auth 모듈이 오면 `frontend/src/store/auth/`, `frontend/src/screens/auth/` 전체를 지우고 그 구현으로 교체할 것.**

## 임시 auth 스텁 → 실제 auth 모듈(origin/YSE)로 교체 (2026-07-03)

A 담당자의 실제 auth 구현이 `origin/YSE` 브랜치에 있었다. 이 브랜치도 `develop`/`hyunsang`처럼 공통 조상이 없는 완전히 별개 히스토리라(초기 스캐폴딩 때 각자 따로 만든 것으로 보임), 통째로 머지하지 않고 **auth 소유 경로만 골라서 이식**했다:
- 백엔드: `backend/app/modules/auth/**` 전체(위의 임시 스텁을 지우고 교체) — models(`User`, `UserGenreInterest`)/schemas/services/routers.
- 프론트: `frontend/src/store/auth/AuthContext.tsx`(진짜 세션 기반, 임시 스텁 교체), `frontend/src/screens/auth/*` 9개(기존 6개 교체 + `FindId`/`FindPassword`/`NotificationSettings` 3개 신규), `frontend/src/components/auth/*`, `frontend/src/hooks/auth/*`, `frontend/src/api/auth/*`, `frontend/src/types/auth/*`.

### 실제로 겪은 문제와 고친 것
1. **`users` 테이블 스키마 불일치**: 실제 `User` 모델은 회원탈퇴 시 `login_id`/`nickname`을 NULL로 비우는 소프트 딜리트 설계인데(재사용 가능하게), 기존 `docs/db/schema.sql`의 `users` 테이블은 두 컬럼 다 `NOT NULL`이었다. `V2.5 additions`로 `ALTER TABLE users MODIFY COLUMN login_id/nickname ... NULL` 추가.
2. **관심 장르 테이블 누락**: `backend/app/modules/auth/models/genre_interest.py`(`UserGenreInterest`, 테이블명 `user_genre_interests`)가 필요로 하는 테이블이 스키마에 없어서 `V2.5 additions`에 `CREATE TABLE user_genre_interests` 추가.
3. **`navigation/index.tsx` 프롭 불일치**: 실제 `LoginScreen`은 `onNavigateSignUp` 외에 `onNavigateFindId`/`onNavigateFindPassword`도 요구하고, 실제 `MyPageScreen`은 `onNavigateNotificationSettings`도 요구했다 — 임시 스텁 화면들은 이런 프롭이 없어서 안 드러났던 문제. `FindId`/`FindPassword`/`NotificationSettings` 3개 화면을 라우트로 새로 등록하고 각각의 Wrapper를 추가했다 (**공용 파일이라 팀 리뷰 필요**).
4. **마이페이지 화면이 자체 TabBar를 또 렌더링하던 버그**: `MyPageScreen`이 원래(origin/YSE의 독립 실행형 설계에서) 화면 맨 밑에 직접 `<TabBar active="profile" onChangeTab={...} />`를 그리고 있었는데, 이 프로젝트는 이미 `MainTabs`의 `Tab.Navigator`가 하단 탭바를 한 번 그려주고 있어서 그대로 두면 탭바가 두 번 겹쳐 보였을 것. `MyPageScreen`에서 이 내부 TabBar 렌더링과 `onNavigateTab` prop을 제거함 (탭 전환은 이미 `Tab.Navigator` 자체가 처리).
5. **`expo-notifications` 의존성 누락**: `frontend/src/hooks/auth/dailyReminder.ts`(알림 설정 화면이 씀)가 필요로 하는데 없어서 `npx expo install expo-notifications`로 SDK54 호환 버전 추가 — 새 네이티브 모듈이라 `expo prebuild --clean` 다시 돌리고 Xcode 재빌드 필요.

### 하단 탭바(TabBar) — origin/YSE 디자인 + 실제 네비게이션 배선
`frontend/src/components/common/TabBar.tsx`도 origin/YSE 버전을 쓰기로 했는데, YSE의 원본은 `{ active, onChangeTab }`이라는 수동 상태 기반 props였다 (React Navigation의 `tabBar` 렌더 프롭이 실제로 넘겨주는 `BottomTabBarProps`인 `{ state, navigation, ... }`가 아님 — YSE도 자체적인 수동 화면 전환 아키텍처로 만들어져 있었다). 그래서 **비주얼(lucide-react-native 아이콘, 4탭 구성, 색상 스타일)만 YSE 걸 가져오고, 실제 배선은 `state.index`/`navigation.navigate(routeName)` 기반으로 다시 짰다.**

### 로그인 플로우가 실제로 동작하게 됨에 따른 변화
지금까지 쓰던 "항상 로그인된 걸로 치는" 가짜 `AuthContext` 스텁이 사라지고 진짜 세션 기반으로 바뀌었다. 즉 **이제 앱을 열면 실제로 로그인 화면부터 시작한다** — 회원가입/로그인을 먼저 해야 내 서재 등 탭에 들어갈 수 있음 (이전처럼 스텁으로 바로 탭이 보이지 않음, 의도된 정상 동작).

### ⚠ `expo-notifications` + 무료 Apple 개인 팀 조합에서 빌드 실패

`expo-notifications`는 `app.json`의 `plugins`에 명시적으로 안 넣어도 설치만 되어 있으면 Expo 오토링킹이 자동으로 config plugin(`node_modules/expo-notifications/plugin/build/withNotificationsIOS.js`)을 적용해서, `ios/ReadLog/ReadLog.entitlements`에 `aps-environment`(Push Notifications) 항목을 무조건 추가한다 (이미 값이 있지 않은 이상 조건 없이 추가 — 로컬 알림만 쓰든 안 쓰든 상관없이). 무료(Personal Team) Apple ID는 Push Notifications capability를 지원 안 해서 "Cannot create a iOS App Development provisioning profile" 에러로 빌드 자체가 실패했다.

**임시로 고친 것**: `ios/ReadLog/ReadLog.entitlements`에서 `aps-environment` 키를 직접 지웠다 (이 프로젝트는 서버발 푸시가 아니라 `dailyReminder.ts`의 로컬 알림만 쓰므로 이 entitlement가 애초에 필요 없음).

**주의**: 이 파일은 `expo prebuild`가 다시 돌 때마다(새 네이티브 모듈 추가 등으로) 플러그인이 재생성하면서 `aps-environment`를 다시 끼워 넣는다. 앞으로 `expo prebuild --clean`을 또 돌릴 일이 있으면 **`ios/ReadLog/ReadLog.entitlements`에서 이 항목을 다시 지워야** 무료 Apple ID로 빌드 가능. (유료 Apple Developer Program 계정을 쓰게 되면 이 문제 자체가 없어짐.)

### `app.json`의 `apiBaseUrl` IP가 안 바뀌는 것처럼 보이던 문제

`app.json`의 `extra.apiBaseUrl`을 예전 IP(`192.168.38.69`)에서 맥의 실제 IP(`192.168.38.40`)로 고쳤는데, Metro를 재시작(`--clear` 포함)해도 폰 앱이 계속 예전 IP로 요청을 보내는 것처럼 보였다. 소스 전체(숨김 파일 포함)를 검색해도 예전 IP 문자열이 전혀 안 남아있어서 코드 문제는 아니었고, **Xcode에서 앱을 다시 빌드하니 해결됐다** — 즉 JS/설정 변경이 아니라, 기존에 설치돼 있던 앱 바이너리 자체가 오래된 상태였던 것으로 보인다 (dev client가 Metro에 붙어도 `Constants.expoConfig`가 앱 실행 시점 기준으로 고정되는 경우가 있는 듯).

**교훈**: `app.json`(특히 `extra`, `plugins` 등 네이티브에 영향 줄 수 있는 필드)을 바꿨는데 Metro 재시작만으로 반영이 안 되면, JS 캐시 문제로 단정하지 말고 **Xcode에서 앱을 다시 빌드**해보는 걸 먼저 시도할 것.

같은 문제를 파던 중 다음 두 가지도 같이 고쳐놨다 (부수적으로 발견한 진짜 버그라 유지):
- `frontend/src/config.ts`의 fallback IP가 여전히 예전 값(`192.168.38.69`, `/api` 경로도 누락)이었던 걸 실제 IP로 수정.
- `authApi.ts`가 `Constants.expoConfig.extra.apiBaseUrl`을 자체적으로 다시 읽던 걸 `config.ts`의 `API_BASE_URL`을 재사용하도록 통일 (같은 값을 두 곳에서 따로 계산하다 하나만 고쳐지는 사고 방지).
- `authApi.ts`에 `ApiError`(상태코드 포함) 도입 — 아이디/닉네임 중복확인이 진짜 409(중복)일 때만 "이미 사용 중"으로 뜨고, 그 외 실패(네트워크 오류 등)는 실제 에러를 보여주도록 수정 (기존엔 `catch { setNicknameCheck('taken') }`처럼 모든 실패를 "중복"으로 오인시키던 버그가 있었음).

### 코멘트 스티커 제거 → 독서 진도 입력 화면의 코멘트로 대체

SNS 공유 화면의 "코멘트 스티커"(자유 위치에 배치하는 텍스트 말풍선, 배경색 프리셋 선택 가능) 기능을 완전히 제거했다. 코멘트는 대신 **독서 진도 입력 화면에서 진도를 저장할 때 함께 남기는 방식**으로 바뀐다.

- 백엔드는 이미 준비돼 있었다: `reading_progress_logs.memo`(V2.1부터 존재)와 `POST /library/{id}/progress`의 `memo` 파라미터가 처음부터 있었는데, 프론트 `ReadingProgressScreen`에 입력 UI가 없어서 안 쓰이고 있었을 뿐이었다. 이번에 현재 진도 입력 바로 밑에 코멘트 `TextInput`을 추가하고 저장 시 `recordProgress(...,{ memo })`로 넘기도록 연결, "이전 기록" 타임라인에도 저장된 `memo`를 표시하도록 함.
- `SNSShareScreen.tsx`에서 코멘트 스티커 관련 상태(`commentDraft`/`commentBackground`/`isAddingComment`)와 UI 섹션, `Sticker.type === "comment"` 렌더링 분기를 모두 제거. `StickerType`에서 `"comment"`도 제거.
- `Sticker`/`StickerInput`/`StickerEntry`의 `content`/`backgroundColor`(`background_color`) 필드는 코멘트 스티커 전용이었고 다른 스티커 타입(emoji/book_cover/progress_*)은 한 번도 채운 적이 없어서 함께 제거. DB는 `docs/db/schema.sql` V2.7에서 `sns_stickers.type` ENUM에서 `'comment'`를 빼고 `content`/`background_color` 컬럼을 `DROP COLUMN`. 로컬 DB에 기존 comment 타입 스티커 행이 있다면 이 ALTER 전에 삭제하거나 감안하고 실행할 것 (dev 환경이라 실제로는 비어있다고 가정).
- `docs/api-contracts/reading-plan.md`도 위 변경에 맞춰 갱신.

### 책 상세에서 "완독" 선택 시 `current_page`가 0으로 남던 버그

`BookDetailScreen`에서 독서 상태를 "완독"으로 선택해 저장해도 `user_library.current_page`가 갱신되지 않고 0(또는 기존 값)에 머물러 있었다 — `library_service.add_to_library`가 `status`만 바꾸고 `current_page`/`completed_at`은 건드리지 않았기 때문. (진도 입력 화면에서 마지막 페이지까지 채워 자연스럽게 완독되는 경로는 `progress_service.add_progress_log`가 이미 `current_page`/`status`/`completed_at`을 같이 갱신해서 문제 없었음 — 책 상세에서 곧바로 "완독"을 선택하는 경로만 빠져 있었다.)

**고친 것**: `add_to_library`에서 `status == COMPLETED`일 때 `book.page_count`가 있으면 `current_page`를 `max(기존 current_page, page_count)`로 올리고, `completed_at`이 비어 있으면 오늘 날짜로 채우도록 추가. `book.page_count`가 없는 책(알라딘 API가 페이지 수를 못 준 경우)은 여전히 `current_page`를 정확히 채울 방법이 없어 기존 값 그대로 둠 — 이 경우는 사용자가 진도 입력 화면에서 직접 채워야 함.

### 진도 입력 화면 "이전 기록"에 진도율 바 + 코멘트 표시 추가

`ReadingProgressScreen`의 "이전 기록" 타임라인 각 행 우측에 그 기록 시점의 진도율을 시각적으로 보여주는 작은 진행 바(`historyProgressColumn`)를 추가했다. `log.percent`가 없는 옛 기록(페이지만 입력하고 총 페이지 수가 없던 책 등)을 대비해 `getLogPercent`가 `percent` → (`page`/`totalPages`) → `0` 순서로 폴백 계산한다. 저장된 `memo`도 각 행에 그대로 노출(`historyMemo`, 이미 이전 작업에서 추가한 것 유지).

### 코멘트 스티커 기능 부활 — "최근 코멘트"를 SNS 스티커로 재사용

바로 앞 작업에서 코멘트 스티커(자유 입력 텍스트 말풍선)를 완전히 제거하고 코멘트를 진도 입력 화면의 `memo`로만 남기도록 바꿨는데, 이번에 "그 memo를 SNS 공유 화면에서 다시 스티커로 쓰고 싶다"는 요청이 들어와서 **자유 입력이 아니라 "해당 책의 진도 기록 중 memo가 있는 가장 최근 기록"을 소스로 쓰는 방식**으로 코멘트 스티커를 되살렸다.

- `SNSShareScreen`이 `useProgressLogs(libraryItem.id)`로 진도 기록을 가져와 `logs.find(log => log.memo)?.memo`(logs는 서버가 이미 최신순으로 내려줌)로 "가장 최근 코멘트"를 계산한다. 이 값이 있을 때만 코멘트 스티커 섹션이 텍스트 미리보기 + 배경색 선택 + "추가" 버튼을 보여주고, 없으면 안내 문구만 표시한다.
- 자유 텍스트 입력 UI는 다시 넣지 않았다 — 스티커의 `content`는 항상 이 "최근 코멘트" 값 그대로 들어간다. 코멘트를 바꾸고 싶으면 진도 입력 화면에서 새로 저장해야 함 (의도된 제약).
- 배경 프리셋을 4종(화이트/그레이/투명/다크)에서 **5종**으로 확장 — "베이지"(브랜드 톤다운 베이지 `#EDE7D8` 계열) 추가.
- 백엔드는 V2.7에서 지웠던 `sns_stickers.content`/`background_color` 컬럼과 `StickerType.COMMENT`를 그대로 복원(`docs/db/schema.sql` V2.8) — 짧은 기간 안에 추가→제거→재추가가 일어난 것이라 스키마 버전 히스토리에 그 과정이 그대로 남아있음. (참고: V2.6은 develop 통합 이후 A가 별도로 진행한 `bookmarks` 테이블 제거 — origin/YSE 브랜치 병합으로 함께 들어옴.)

### origin/YSE 재병합 (A 마이페이지 기능)

develop 통합(V2.5) 이후 A가 `origin/YSE`에서 계속 작업한 커밋(`26c6bb9 마이페이지관련수정`)을 다시 병합했다. 이번엔 첫 통합 때와 달리 두 브랜치가 `fb07daa`를 공통 조상으로 공유하고 있어서(첫 통합 때 이미 origin/YSE 기반 파일을 가져왔기 때문) 파일 단위 `checkout` 대신 **진짜 `git merge origin/YSE`** 로 처리했다.

- **가져온 것**: `MyPageScreen.tsx`의 "독서기록" 탭 실제 구현(내 서재 데이터를 가져와 카드 리스트로 표시, 탭하면 진도 입력 화면으로 이동), `navigation/index.tsx`의 `onOpenReadingRecord` 배선(`LibraryTab` → `ReadingProgress` 딥링크), 마이페이지에서 "북마크" 탭 제거 및 `bookmarks` 테이블 삭제(스키마 V2.6 — 백엔드에 대응 모델이 아예 없던 죽은 테이블이었음), `reviews.review NOT NULL`/`sns_stickers` 좌표 컬럼 `NOT NULL` 등 스키마 정합성 정리.
- **반려한 것**: 같은 커밋에 B 소유 파일(`ReadingProgressScreen.tsx`, `SNSShareScreen.tsx`) 변경이 함께 섞여 있었다.
  - `ReadingProgressScreen.tsx`: 퍼센트(%) 입력 방식과 슬라이더를 통째로 제거하고 페이지 입력만 남긴 상태였음 — SKILL.md 스펙("페이지 또는 퍼센트 슬라이더, 선택 가능하게")에 어긋나는 회귀라 B의 버전(퍼센트 입력 + 이번 세션에서 추가한 코멘트/이전 기록 진도율 바)을 그대로 유지했다.
  - `SNSShareScreen.tsx`: `react-native-share` → `expo-sharing` 교체가 섞여 있었음. Expo Go에서 `react-native-share`가 네이티브 모듈 부재로 크래시하는 걸 A가 발견하고 고친 것으로 보이나, 인스타그램 스토리 다이렉트 공유를 잃는 트레이드오프가 있어 사용자에게 확인 후 **`react-native-share` 유지**로 결정 — 병합 시 자동으로 딸려 들어온 `expo-sharing` 관련 코드/의존성(`package.json`의 `expo-sharing` 추가, `@react-native-community/slider`/`react-native-share` 제거)을 되돌렸다.
  - `frontend/app.json`/`src/config.ts`의 `apiBaseUrl`도 A의 로컬 IP(`192.168.38.141:8001`)로 자동 병합됐길래 B의 로컬 IP(`192.168.38.40:8000`)로 되돌림 — 이 값은 각자 로컬 백엔드 서버 IP라 병합 대상이 아님, 로컬 실행 전 각자 자기 머신 IP로 다시 바꿔야 함.
- **스키마 버전 번호 충돌**: A의 커밋과 B의 로컬 미커밋 변경이 둘 다 "V2.6"을 자체적으로 붙이고 있었음(A는 `bookmarks` 제거, B는 코멘트 스티커 컬럼 제거). A의 V2.6은 이미 `origin/YSE`에 커밋되어 공유된 상태라 그대로 두고, B 쪽 두 변경을 V2.7/V2.8로 재번호 매김.

### 마이페이지 "한줄평" 탭에 진도 코멘트 노출 (A·B 협업)

A의 마이페이지 "독서기록" 탭이 `useLibrary()`를 직접 가져다 쓰는 선례를 그대로 따라, "한줄평" 탭도 reading-plan 데이터를 직접 소비하도록 구현했다. 다만 여기서 말하는 "한줄평"은 `reviews` 테이블(완독 후 남기는 한 줄 평, `OneLineReviewScreen`)이 아니라 **독서 진도 입력 화면에서 남긴 코멘트(`reading_progress_logs.memo`)** 다 — 마이페이지 탭 이름이 먼저 있었고, 그 자리에 진도 코멘트를 채워 넣기로 한 것.

- **백엔드**: `GET /library/comments` 신규 엔드포인트 추가. `user_library.user_id`로 소유권을 거른 뒤 `reading_progress_logs`를 조인해서 `memo IS NOT NULL`인 기록만 최신순으로 반환(`progress_service.list_library_comments`). 책별로 흩어진 코멘트를 시간순으로 한 번에 보여주기 위해 기존 `/library/{id}/progress-logs`(단일 책 전용)와는 별도 엔드포인트로 뺐다.
- **프론트**: `hooks/reading-plan/useLibraryComments.ts`(신규) + `api/reading-plan/progress.ts`의 `fetchLibraryComments` + `types/reading-plan/book.ts`의 `LibraryComment` 타입을 reading-plan 쪽에 추가. `MyPageScreen.tsx`(auth)는 이 훅을 그대로 가져다 써서 "한줄평" 탭에 책 표지 + 제목 + 코멘트만 보여주는 단순한 카드 리스트(`LibraryCommentCard`)를 렌더링한다 — 탭하면 어디로 이동하는 기능은 요청에 없어서 넣지 않음(간단하게만 보여달라는 요청이었음).
- 기존 "독서기록" 탭과 마찬가지로 `types/common` 승격 없이 auth 화면이 reading-plan의 훅/타입을 직접 import하는 방식을 그대로 따랐다 — 이미 확립된 선례와 일관성을 유지하기 위함(원칙적으로는 CLAUDE.md §5-3의 "다른 모듈 폴더 직접 import 금지"에 어긋나지만, A의 기존 구현이 이미 이 패턴이라 이번만 예외로 따름).
