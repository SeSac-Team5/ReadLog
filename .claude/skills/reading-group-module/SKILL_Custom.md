# reading-group-module / Custom 오버라이드

> 이 파일은 `SKILL.md`의 **커스텀 확장 레이어**다.
> SKILL.md의 모든 규칙을 기본으로 따르되, 여기에 명시한 내용이 **우선 적용**된다.
> 팀 합의 없이 SKILL.md를 직접 수정하는 대신, 개인/스프린트 단위 오버라이드는 여기에 작성한다.

---

## 추가 트리거

> SKILL.md의 트리거 외에 이 파일을 로드할 추가 조건을 작성한다.

<!-- 예시: 아래 주석을 해제하고 조건을 수정할 것
- `frontend/src/screens/reading-group/v2/` 경로 작업 시
- 그룹 알림(push notification) 관련 작업 요청 시
-->

---

## 소유 범위 추가/제외

> SKILL.md의 소유 범위를 그대로 상속한다. 추가하거나 제외할 경로만 기재한다.

### 추가 경로
```
# (없으면 이 섹션은 비워 둠)
```

### 제외 경로
```
# (없으면 이 섹션은 비워 둠)
```

---

## 화면별 스펙 오버라이드

> SKILL.md `## 화면별 필수 요소` 중 변경이 필요한 항목만 덮어쓴다.

| 화면 | 변경 내용 |
|---|---|
| _(없으면 이 행 삭제)_ | — |

---

## Backend 추가 규칙

> SKILL.md `## Backend 규칙`에 더해 적용할 내용을 작성한다.

<!-- 예시:
- `progress.py` 라우터에서 페이지 입력값 범위 검증(0 이상, book.total_pages 이하) 추가
- 초대 코드 만료 정책: 임시 링크는 72시간, 호출 시 서버에서 `expires_at` 자동 설정
-->

---

## DB 변경사항 / 주의사항

> SKILL.md `## DB 테이블` 기준에서 달라진 점, 또는 마이그레이션 진행 중인 항목을 기재한다.

<!-- 예시:
- `group_comments.edited_at` 컬럼 추가 예정 (Alembic PR #42 리뷰 중)
- `reading_progress.progress` 컬럼: FLOAT → DECIMAL(5,2) 변경 검토 중
-->

---

## API 계약 오버라이드

> SKILL.md에 명시된 엔드포인트 외 추가/변경 사항을 기재한다.

<!-- 예시:
- `GET /groups/{id}/progress` → 응답에 `rank` 필드(멤버 순위) 추가
- `POST /groups/{id}/comments` → `quote_range`(시작/끝 offset) 필드 추가
-->

---

## 하지 말 것 (추가)

> SKILL.md `## 하지 말 것`에 더해 이 스프린트에서 금지할 내용을 작성한다.

<!-- 예시:
- 모임 홈 화면에서 FlatList 대신 ScrollView + map 패턴 사용 금지 (성능 이슈 경험 있음)
- `group_members` 조회 시 전체 fetch 후 프론트 필터링 금지 → 반드시 서버 side 필터링
-->

---

## 참고 링크 / 스프린트 메모

<!-- 스프린트별 임시 메모, 참고 PR 번호, 관련 이슈 등을 자유롭게 기재 -->
