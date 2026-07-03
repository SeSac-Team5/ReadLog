# =====================================================
# schemas/genre.py — 관심장르 요청/응답 데이터 형태 정의
# =====================================================

from pydantic import BaseModel, field_validator

# 고정 장르 목록 (마이페이지 "관심장르" 탭에서 다중 선택으로 고를 수 있는 후보)
# DB에 별도 장르 마스터 테이블이 없어서 우선 코드 상수로 관리.
GENRE_CHOICES = [
    "소설", "시/에세이", "인문학", "자기계발", "경제/경영",
    "과학", "역사", "예술", "여행", "건강", "기타",
]


class GenreInterestResponse(BaseModel):
    """GET /auth/me/genres — 내가 등록한 관심장르 목록"""
    genres: list[str]


class GenreInterestUpdateRequest(BaseModel):
    """
    PUT /auth/me/genres — 관심장르 전체 교체.
    보낸 목록으로 완전히 덮어씀 (기존 것 삭제 후 새로 저장).
    """
    genres: list[str]

    @field_validator("genres")
    @classmethod
    def validate_genres(cls, v: list[str]) -> list[str]:
        invalid = [g for g in v if g not in GENRE_CHOICES]
        if invalid:
            raise ValueError(f"지원하지 않는 장르입니다: {', '.join(invalid)}")
        # 중복 제거 (순서 유지)
        return list(dict.fromkeys(v))
