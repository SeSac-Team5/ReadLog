# =====================================================
# user.py — User 테이블 모델
# =====================================================

import enum
from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, String, func
from app.db.base import Base


class UserRole(str, enum.Enum):
    """
    사용자 권한 구분
    - USER: 일반 회원 (기본값)
    - ADMIN: 관리자 (신고 처리 등 특수 권한)
    """
    USER = "USER"
    ADMIN = "ADMIN"


class User(Base):
    """
    users 테이블과 1:1로 대응하는 파이썬 클래스.
    
    DB에서 행(row)을 하나 꺼내면 이 클래스의 인스턴스가 됨.
    예) user = db에서 꺼낸 행  →  user.nickname 으로 닉네임 접근 가능
    """
    __tablename__ = "users"  # 실제 DB 테이블 이름

    # ── 기본 식별자 ──────────────────────────
    # PK(Primary Key): 각 회원을 구별하는 고유 번호 (1, 2, 3 ...)
    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # ── 로그인 정보 ───────────────────────────
    # unique=True: 같은 login_id는 2개 존재할 수 없음
    # nullable=True: 탈퇴 시 NULL로 비워서 같은 login_id 재사용을 허용함
    # (MySQL UNIQUE 인덱스는 NULL끼리는 중복으로 안 침 → 탈퇴 계정이 여러 개 쌓여도 안전)
    login_id = Column(String(30), nullable=True, unique=True)
    # ⚠️ 실제 비밀번호 절대 저장 금지! bcrypt 해시값만 저장
    # 예) "1234" → "$2b$12$eKN3H..." (60자짜리 알 수 없는 문자열)
    password = Column(String(255), nullable=False)

    # ── 프로필 정보 ───────────────────────────
    # nickname도 login_id와 동일한 이유로 nullable
    nickname      = Column(String(30),  nullable=True, unique=True)
    profile_image = Column(String(500), nullable=True)   # URL 저장 (이미지 자체가 아님)
    introduction  = Column(String(255), nullable=True)   # 자기소개

    # ── 권한 / 상태 ───────────────────────────
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)

    # 탈퇴 여부: True면 탈퇴한 계정 (row를 실제로 지우지 않고 이 값만 바꿈)
    # → "soft delete(소프트 딜리트)" 방식
    is_deleted = Column(Boolean, default=False, nullable=False)

    # ── 시간 기록 ─────────────────────────────
    # server_default=func.now(): DB 서버 시간 기준으로 자동 입력
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    # onupdate=func.now(): 행이 수정될 때마다 자동으로 현재 시간으로 업데이트
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
