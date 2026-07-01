# ReadLog 디렉토리 구조

모듈(A: auth / B: reading-plan / C: reading-group) 소유권 경계를 디렉토리 경계와 일치시켜, Git 브랜치 작업 시 서로 다른 팀원이 같은 파일을 동시에 건드릴 일이 없도록 구성했다. 상세 규칙은 루트 `CLAUDE.md` §3, §5 참고.

```
readlog/
├── CLAUDE.md                              # 전역 규칙 (필독)
│
├── .claude/
│   └── skills/                            # Claude Code 모듈별 스킬
│       ├── auth-module/SKILL.md           # A 담당
│       ├── reading-plan-module/SKILL.md   # B 담당
│       ├── reading-group-module/SKILL.md  # C 담당
│       └── _shared/SKILL.md               # 공용 컨벤션 (3인 합의 필요)
│
├── docs/
│   ├── requirements_and_flowchart.md      # 전체 화면 요구사항 원본
│   ├── mainpage_and_reading_progress_spec.md  # 메인홈/진도입력 추가 스펙
│   ├── DIRECTORY_STRUCTURE.md             # 이 문서
│   ├── figma-export/
│   │   └── App.tsx                        # Figma 화면설계서 뷰어 (참고용, RN 코드 아님)
│   ├── db/
│   │   └── schema.sql                     # ReadLog Schema V2 (확정 반영됨)
│   └── api-contracts/
│       ├── auth.md
│       ├── reading-plan.md
│       └── reading-group.md
│
├── frontend/                              # React Native (TypeScript)
│   ├── src/
│   │   ├── app/                           # 앱 엔트리 포인트
│   │   ├── navigation/                    # [공용] 스택/탭 네비게이터
│   │   ├── screens/
│   │   │   ├── auth/                      # [A] 로그인/회원가입/마이페이지 등
│   │   │   ├── reading-plan/              # [B] 책검색/서재/진도입력/SNS공유
│   │   │   ├── reading-group/             # [C] 모임 목록/개설/홈/댓글 등
│   │   │   └── home/                      # [공용] 메인 홈 대시보드
│   │   ├── components/
│   │   │   ├── auth/  reading-plan/  reading-group/   # 모듈별 전용 컴포넌트
│   │   │   └── common/                    # [공용] NavBar, TabBar, Button, Field
│   │   ├── store/
│   │   │   ├── auth/  reading-plan/  reading-group/   # 모듈별 상태관리
│   │   ├── api/
│   │   │   ├── auth/  reading-plan/  reading-group/   # 모듈별 API 함수
│   │   │   └── client/                    # [공용] axios 인스턴스, 인터셉터
│   │   ├── types/
│   │   │   ├── auth/  reading-plan/  reading-group/
│   │   │   └── common/                    # [공용] 모듈 간 공유 타입
│   │   ├── hooks/
│   │   │   └── auth/  reading-plan/  reading-group/
│   │   ├── constants/                     # [공용] 디자인 토큰, 상수
│   │   └── utils/                         # [공용] 범용 유틸
│   ├── assets/{images,fonts}/
│   └── __tests__/{auth,reading-plan,reading-group}/
│
├── backend/                                # FastAPI (Python)
│   ├── app/
│   │   ├── core/                          # [공용] config, Redis client, 인증 의존성
│   │   ├── db/                            # [공용] SQLAlchemy 엔진/세션/Base
│   │   ├── common/{deps,exceptions,middlewares}/  # [공용]
│   │   ├── modules/
│   │   │   ├── auth/{routers,schemas,services,models}/          # [A]
│   │   │   ├── reading_plan/{routers,schemas,services,models}/  # [B]
│   │   │   └── reading_group/{routers,schemas,services,models}/ # [C]
│   │   └── migrations/versions/           # Alembic 마이그레이션
│   └── tests/{auth,reading_plan,reading_group}/
│
└── .github/workflows/                      # CI (lint/test)
```

## 범례
- `[A]` / `[B]` / `[C]` — 해당 팀원 단독 소유 (다른 사람은 원칙적으로 수정하지 않음)
- `[공용]` — 3인 합의 필요, 단독 PR 머지 금지 (CLAUDE.md §5)
