# CLAUDE.md

> 이 파일은 Claude Code(및 이 리포지토리에서 작업하는 모든 Claude 인스턴스)가 **가장 먼저 읽어야 하는 프로젝트 규칙 문서**다.
> 모듈별 세부 규칙은 `.claude/skills/*/SKILL.md` 를 참고하되, 여기 적힌 전역 규칙이 항상 우선한다.

---

## 1. 프로젝트 개요

**ReadLog** — 개인 독서 기록 + 소셜 독서모임 모바일 앱.

- 개인: 책 검색/등록, 독서 상태(읽는 중/완독) 관리, 진도 입력, 한줄평, SNS 공유
- 소셜: 독서모임 개설/참가, 멤버별 진도 현황판, 스포일러 방지 댓글

디자인 산출물: Figma 기반 화면설계서(`docs/figma-export/App.tsx` — 뷰어용 목업, 실제 RN 코드 아님, 레이아웃/톤 참고용).

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React Native (TypeScript) |
| Backend | FastAPI (Python) |
| DB | MySQL |
| 세션/캐시 | Redis (로그인 세션) |
| IDE | VSCode |
| 형상관리 | Git (GitHub) |

## 3. 팀 구성 및 모듈 소유권 (Ownership Map)

브랜치 충돌을 막기 위해 **디렉토리 경계 = 담당자 경계**로 설계했다. 각자 자신의 모듈 디렉토리 밖의 파일은 원칙적으로 수정하지 않는다 (공용 파일 수정 규칙은 §5 참고).

| 담당 | 모듈 코드 | 담당 화면/기능 | Frontend 디렉토리 | Backend 디렉토리 |
|---|---|---|---|---|
| **A** | `auth` | 로그인, 회원가입, 마이페이지, 프로필 수정, 비밀번호 변경, 회원탈퇴 | `frontend/src/screens/auth`, `frontend/src/components/auth`, `frontend/src/store/auth`, `frontend/src/api/auth`, `frontend/src/types/auth`, `frontend/src/hooks/auth` | `backend/app/modules/auth/*` |
| **B** | `reading_plan` | 책 검색, 책 상세/등록, 내 서재, 독서 진도 입력, 한줄평, SNS 공유 | `frontend/src/screens/reading-plan`, `.../components/reading-plan`, `.../store/reading-plan`, `.../api/reading-plan`, `.../types/reading-plan`, `.../hooks/reading-plan` | `backend/app/modules/reading_plan/*` |
| **C** | `reading_group` | 독서모임 목록/개설/참가, 모임 홈, 멤버 초대, 진도 공유, 공유 책 댓글, 모임 설정 | `frontend/src/screens/reading-group`, `.../components/reading-group`, `.../store/reading-group`, `.../api/reading-group`, `.../types/reading-group`, `.../hooks/reading-group` | `backend/app/modules/reading_group/*` |
| 공용(합의 필요) | `home`, `_shared` | 메인 홈 대시보드, 공용 컴포넌트/네비게이션/디자인 토큰 | `frontend/src/screens/home`, `frontend/src/components/common`, `frontend/src/navigation`, `frontend/src/constants`, `frontend/src/api/client`, `frontend/src/types/common` | `backend/app/core`, `backend/app/db`, `backend/app/common` |

메인 홈 화면은 3개 모듈 데이터를 모두 가져다 쓰는 대시보드이므로 소유자를 고정하지 않고 **PR 리뷰 시 3인 합의**로 변경한다.

## 4. 디렉토리 구조

```
readlog/
├── CLAUDE.md                     # 이 파일
├── .claude/skills/                # Claude Code용 모듈별 스킬 (아래 §6)
├── docs/                          # 기획/설계 문서, DB 스키마, API 계약
├── frontend/                      # React Native 앱
│   └── src/{app,navigation,screens,components,store,api,types,hooks,constants,utils}/
│       └── (auth | reading-plan | reading-group | home | common) 하위 분리
├── backend/                       # FastAPI 서버
│   └── app/{core,db,common,modules}/
│       └── modules/(auth | reading_plan | reading_group)/{routers,schemas,services,models}
└── .github/workflows/             # CI
```

전체 디렉토리 트리는 `docs/DIRECTORY_STRUCTURE.md` 참고 (이번 스캐폴딩과 함께 생성됨).

## 5. Git 협업 규칙

### 브랜치 전략
- `main`: 배포 가능 상태만 유지, 직접 push 금지
- `develop`: 통합 브랜치
- 기능 브랜치: `feature/{module}/{screen-or-task}` 예) `feature/auth/login-screen`, `feature/reading-plan/progress-input-api`
- 수정 브랜치: `fix/{module}/{issue}`

### 커밋 컨벤션 (Conventional Commits)
```
<type>(<module>): <description>

type: feat | fix | refactor | style | docs | test | chore
module: auth | reading-plan | reading-group | home | shared
```
예) `feat(reading-plan): 진도 입력 화면 슬라이더 컴포넌트 추가`

### 충돌 방지 규칙
1. **자기 모듈 디렉토리 밖은 건드리지 않는다.** 공용 컴포넌트(`components/common`, `navigation`, `core`, `db`)가 필요하면 직접 고치지 말고 이슈로 등록 후 담당 합의.
2. **공용 파일을 고쳐야 하는 경우** (`App.tsx` 루트, `navigation/*`, `main.py`, DB 마이그레이션 공통 부분) → 반드시 별도 PR로 분리하고 3인 리뷰 필수.
3. 타입/스키마는 모듈별 `types/{module}` 또는 `schemas/`에만 선언하고, 다른 모듈이 참조해야 하면 `types/common`으로 승격 후 사용 (직접 다른 모듈 폴더에서 import 금지).
4. API 계약은 코드 작성 전 `docs/api-contracts/{module}.md`에 먼저 정의하고 PR로 리뷰받는다 (프론트/백엔드 담당이 다른 사람일 때 특히 중요).
5. DB 스키마 변경은 `backend/app/migrations`에 Alembic 마이그레이션 파일로만 추가 (기존 마이그레이션 직접 수정 금지).

### PR 규칙
- PR 제목에 모듈 태그 포함: `[auth] 로그인 화면 구현`
- 본인 모듈 범위를 벗어난 변경이 diff에 섞여 있으면 반려
- 머지 전 최소 1인 리뷰 (공용 파일 변경 시 전원 리뷰)

## 6. Claude Code 스킬 (.claude/skills)

모듈별 세부 작업 규칙(파일 위치, 화면 스펙, API 엔드포인트 네이밍, DB 테이블, 하지 말아야 할 것)은 스킬 파일에 있다. **해당 모듈 작업 시 반드시 먼저 로드한다.**

| 스킬 | 위치 | 담당 |
|---|---|---|
| auth-module | `.claude/skills/auth-module/SKILL.md` | A |
| reading-plan-module | `.claude/skills/reading-plan-module/SKILL.md` | B |
| reading-group-module | `.claude/skills/reading-group-module/SKILL.md` | C |
| _shared | `.claude/skills/_shared/SKILL.md` | 공용 컨벤션/디자인 토큰/공통 컴포넌트 규칙 |

## 7. 코딩 컨벤션 요약

- **Frontend**: 함수형 컴포넌트 + TypeScript, 화면 컴포넌트명은 `XxxScreen`, 절대 px 고정 금지 (Flexbox 반응형), 색상/폰트는 `frontend/src/constants/theme.ts`의 디자인 토큰만 사용.
- **Backend**: 모듈 = `routers`(엔드포인트) / `schemas`(Pydantic) / `services`(비즈니스 로직) / `models`(SQLAlchemy) 4단 구조 고정. 라우터에 비즈니스 로직 작성 금지.
- **네이밍**: 프론트 폴더는 kebab-case(`reading-plan`), 백엔드 파이썬 모듈은 snake_case(`reading_plan`) — 언어 컨벤션에 맞춰 의도적으로 다르게 유지.
- **디자인 토큰** (전 모듈 공통, 임의 색상 사용 금지):
  - 딥그린 `#2D4A3E` / 베이지(밝음) `#FDFBF4` / 베이지(톤다운) `#EDE7D8` / 완독 강조 `green-500`

## 8. 확정된 결정 사항 (스키마 V2.1) / 남은 미결 사항

`docs/db/schema.sql` V2 검토 중 발견된 3가지 충돌을 팀에서 아래와 같이 확정했다. 스키마는 **V2.1**로 갱신(`docs/db/schema.sql` 하단 "V2.1 additions" 참고)했고, 각 모듈 SKILL.md도 반영했다.

1. **`WISH` 상태를 사용한다.** `user_library.status`는 스키마 그대로 `WISH|READING|COMPLETED` 3단계 유지. (~~edit-prompt.md §6의 "2단계만 사용" 결정은 이 문서로 대체된다~~ — B 담당은 책 상세/등록 화면에 "읽고 싶다" 상태 선택 옵션을 추가해야 함)
2. **개인 독서 진도 타임라인 테이블을 신규 추가한다.** `reading_progress_logs(id, library_id, page, percent, memo, recorded_at)` — `user_library.id`를 참조하며 진도 입력 화면에서 "저장" 시마다 한 행씩 쌓인다. 독서 진도 입력 화면의 "이전 진도 기록 리스트(타임라인)"는 이 테이블을 조회해서 구현.
3. **`sns_stickers`에 컬럼을 추가한다.** `type ENUM('emoji','comment','progress_ring','progress_bar','progress_badge')`, `content VARCHAR(300)`(코멘트/배지 텍스트), `visible BOOLEAN`(노출 토글). 이모지는 기존 `emoji` 컬럼을 계속 쓰고, 코멘트·진도오버레이는 `content`를 사용.

### 신규 요구사항 — SNS 공유: 코멘트도 스티커로 추가
- SNS 공유 화면에서 사진 위에 자유롭게 배치 가능한 "코멘트 스티커"를 추가로 지원한다 (기존의 하단 고정 코멘트 입력창과는 별개 기능).
- 저장은 `sns_stickers`에 `type='comment'`, 텍스트는 `content` 컬럼에 저장. 위치/크기/회전은 기존 `x, y, scale, rotation` 컬럼을 그대로 재사용(이모지 스티커와 동일한 드래그 UX).
- 진도 시각화 오버레이(원형게이지/진행바/배지)와 마찬가지로 `visible` 토글로 켜고 끌 수 있어야 한다.
- 우선순위: 상 (B 담당, SNS 공유 화면에 상세 컴포넌트로 구현)

### 남은 미결 사항
- SNS 공유 화면 빈 상태 CTA 도착 화면 (모임 목록 vs 모임 개설) — 여전히 미결.
- `users.is_deleted`(soft delete) 존재 → 회원탈퇴는 실제 row 삭제가 아니라 이 플래그 처리로 구현 (영구 삭제 금지 원칙과도 부합). (A 담당, 계속 유효)
- `reading_groups.invite_code`(상시 코드)와 `group_invites`(만료/1회성 코드) 두 종류가 공존 — 초대 화면 설계 시 명확히 구분할 것. (C 담당, 계속 유효)
- `reading_progress`(그룹)는 `page`+`progress(%)`를 모두 저장, `user_library`/`reading_progress_logs`(개인)는 페이지+% 모두 지원 가능 — 두 모듈이 기본으로 어떤 입력 UI(숫자 vs 슬라이더)를 보여줄지는 각 담당이 자율 결정.

## 9. Claude에게 주는 전역 지시사항

- 항상 **§3 소유권 표에 명시된 디렉토리 범위 안에서만** 파일을 생성/수정한다. 범위를 벗어나야 하는 작업이면 먼저 사용자에게 알린다.
- 화면 구현 시 `docs/figma-export/App.tsx`의 해당 스크린 컴포넌트를 참고하되, 그대로 복붙하지 말고 React Native 컴포넌트(`View`/`Text`/`TouchableOpacity`/`FlatList` 등)로 변환한다. 웹 전용 요소(`className`의 Tailwind, `lucide-react`)는 RN 대응 라이브러리(`lucide-react-native`, `StyleSheet` 또는 NativeWind)로 교체한다.
- 새 화면/API를 만들 때는 먼저 `docs/api-contracts/{module}.md`에 계약이 있는지 확인하고, 없으면 만들어 사용자 확인을 받은 뒤 구현한다.
- 커밋 메시지는 §5 컨벤션을 따른다.
