# =====================================================
# schemas/auth.py — 요청/응답 데이터 형태 정의
# =====================================================

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

# ──────────────────────────────────────────────────────
# 공용 검증 규칙
# ──────────────────────────────────────────────────────

# 아이디: 영문/숫자/-/_ 4~30자, 한글 및 기타 특수문자 사용 불가
LOGIN_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{4,30}$")

# 비밀번호: 8~16자, 영문 대문자 1개 이상 + 소문자 1개 이상 + 특수문자 1개 이상 필수
SPECIAL_CHARS = r"!@#$%^&*()_+\-=\[\]{};:'\",.<>/?\\|`~"
PASSWORD_PATTERN = re.compile(
    rf"^(?=.*[A-Z])(?=.*[a-z])(?=.*[{SPECIAL_CHARS}])[A-Za-z\d{SPECIAL_CHARS}]{{8,16}}$"
)


def validate_login_id_format(v: str) -> str:
    if not LOGIN_ID_PATTERN.match(v):
        raise ValueError("아이디는 영문, 숫자, -, _ 4~30자로 입력해야 하며 한글은 사용할 수 없습니다.")
    return v


def validate_password_format(v: str) -> str:
    if not PASSWORD_PATTERN.match(v):
        raise ValueError(
            "비밀번호는 8~16자이며 영문 대문자, 소문자, 특수문자를 각각 1개 이상 포함해야 합니다."
        )
    return v


def validate_nickname_format(v: str) -> str:
    if not (2 <= len(v) <= 8):
        raise ValueError("닉네임은 2~8자여야 합니다.")
    return v


# ┌─────────────────────────────────────────────────┐
# │  ID 중복 확인                                    │
# └─────────────────────────────────────────────────┘

class CheckIdRequest(BaseModel):
    """회원가입 화면 → '중복확인' 버튼 누를 때 보내는 데이터"""
    login_id: str

    @field_validator("login_id")
    @classmethod
    def validate(cls, v: str) -> str:
        return validate_login_id_format(v)


class CheckIdResponse(BaseModel):
    """중복 확인 결과"""
    available: bool  # True = 사용 가능 / False = 이미 사용 중


class CheckNicknameRequest(BaseModel):
    """회원가입/프로필 수정 화면 → 닉네임 '중복확인' 버튼 누를 때 보내는 데이터"""
    nickname: str

    @field_validator("nickname")
    @classmethod
    def validate(cls, v: str) -> str:
        return validate_nickname_format(v)


class CheckNicknameResponse(BaseModel):
    """닉네임 중복 확인 결과"""
    available: bool  # True = 사용 가능 / False = 이미 사용 중


# ┌─────────────────────────────────────────────────┐
# │  회원가입                                        │
# └─────────────────────────────────────────────────┘

class SignUpRequest(BaseModel):
    """회원가입 폼에서 받는 데이터"""
    login_id: str
    password: str
    password_confirm: str  # 비밀번호 확인 (서버에서 password와 일치 여부 검사)
    nickname: str

    @field_validator("login_id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return validate_login_id_format(v)

    @field_validator("password")
    @classmethod
    def validate_pw(cls, v: str) -> str:
        return validate_password_format(v)

    @field_validator("nickname")
    @classmethod
    def validate_nick(cls, v: str) -> str:
        return validate_nickname_format(v)


class SignUpResponse(BaseModel):
    """회원가입 완료 응답"""
    message: str  # "회원가입이 완료되었습니다."


# ┌─────────────────────────────────────────────────┐
# │  로그인 / 로그아웃                               │
# └─────────────────────────────────────────────────┘

class LoginRequest(BaseModel):
    """로그인 폼에서 받는 데이터"""
    login_id: str
    password: str
    remember_me: bool = False  # True면 자동 로그인(세션 유효기간 연장)


class LoginUserInfo(BaseModel):
    """
    로그인 성공 응답에 포함되는 사용자 기본 정보.
    
    model_config = {"from_attributes": True}:
        SQLAlchemy User 객체를 바로 이 스키마로 변환 가능하게 함.
        예) LoginUserInfo.model_validate(user_객체)
    """
    id: int
    nickname: str
    profile_image: Optional[str] = None  # 없을 수도 있어서 Optional
    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    """로그인 성공 응답"""
    message: str       # "로그인되었습니다."
    user: LoginUserInfo  # 로그인한 사용자 기본 정보


class LogoutResponse(BaseModel):
    """로그아웃 응답"""
    message: str  # "로그아웃되었습니다."


# ┌─────────────────────────────────────────────────┐
# │  내 정보 조회 (마이페이지)                        │
# └─────────────────────────────────────────────────┘

class MeResponse(BaseModel):
    """GET /auth/me — 마이페이지에 표시할 내 전체 정보"""
    id: int
    login_id: str
    nickname: str
    profile_image: Optional[str] = None
    introduction: Optional[str] = None
    role: str           # "USER" or "ADMIN"
    created_at: datetime  # 가입일
    model_config = {"from_attributes": True}


# ┌─────────────────────────────────────────────────┐
# │  프로필 수정                                     │
# └─────────────────────────────────────────────────┘

class UpdateProfileRequest(BaseModel):
    """
    변경할 항목만 보내면 됨 (전부 Optional).
    예) 닉네임만 바꾸고 싶으면 nickname만 보내면 됨.
    """
    nickname: Optional[str] = None
    profile_image: Optional[str] = None
    introduction: Optional[str] = None

    @field_validator("nickname")
    @classmethod
    def validate_nick(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_nickname_format(v)
        return v

    @field_validator("introduction")
    @classmethod
    def validate_intro(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 255:
            raise ValueError("자기소개는 255자 이하여야 합니다.")
        return v


class UpdatedUserInfo(BaseModel):
    """수정 완료 후 변경된 정보"""
    nickname: str
    profile_image: Optional[str] = None
    introduction: Optional[str] = None
    model_config = {"from_attributes": True}


class UpdateProfileResponse(BaseModel):
    """프로필 수정 완료 응답"""
    message: str          # "프로필이 수정되었습니다."
    user: UpdatedUserInfo  # 수정된 정보


# ┌─────────────────────────────────────────────────┐
# │  비밀번호 변경                                   │
# └─────────────────────────────────────────────────┘

class ChangePasswordRequest(BaseModel):
    """비밀번호 변경 폼 데이터"""
    current_password: str     # 현재 비밀번호 (본인 확인용)
    new_password: str          # 새 비밀번호
    new_password_confirm: str  # 새 비밀번호 확인

    @field_validator("new_password")
    @classmethod
    def validate_pw(cls, v: str) -> str:
        return validate_password_format(v)


class ChangePasswordResponse(BaseModel):
    """비밀번호 변경 완료 응답"""
    message: str  # "비밀번호가 변경되었습니다."


# ┌─────────────────────────────────────────────────┐
# │  회원탈퇴                                        │
# └─────────────────────────────────────────────────┘

class DeleteAccountRequest(BaseModel):
    """탈퇴 전 비밀번호로 본인 확인"""
    password: str


class DeleteAccountResponse(BaseModel):
    """회원탈퇴 완료 응답"""
    message: str  # "회원탈퇴가 완료되었습니다."


# ┌─────────────────────────────────────────────────┐
# │  아이디 찾기 / 비밀번호 찾기                     │
# └─────────────────────────────────────────────────┘

class FindIdRequest(BaseModel):
    """
    아이디 찾기: 닉네임만으로 본인 확인.

    ⚠️ 이메일/휴대폰 컬럼이 없어 정식 인증(이메일 발송 등)이 불가능해서
    닉네임 일치 여부만으로 확인하는 간이 방식이다. 닉네임은 앱 내에서
    공개적으로 노출되는 값이라 완전한 본인확인 수단은 아니다(팀 논의 후 채택).
    """
    nickname: str


class FindIdResponse(BaseModel):
    """찾은 아이디는 그대로 노출하지 않고 마스킹해서 반환한다."""
    login_id: str  # 예) "abc***23"


class VerifyAccountRequest(BaseModel):
    """
    비밀번호 찾기 1단계: 아이디 + 닉네임 일치 여부로 본인 확인.
    통과하면 비밀번호 재설정에 사용할 단기 토큰을 발급한다.
    """
    login_id: str
    nickname: str


class VerifyAccountResponse(BaseModel):
    """본인 확인 성공 시 발급되는 비밀번호 재설정용 토큰."""
    reset_token: str


class ResetPasswordRequest(BaseModel):
    """비밀번호 찾기 2단계: 재설정 토큰으로 새 비밀번호를 설정."""
    reset_token: str
    new_password: str
    new_password_confirm: str

    @field_validator("new_password")
    @classmethod
    def validate_pw(cls, v: str) -> str:
        return validate_password_format(v)


class ResetPasswordResponse(BaseModel):
    """비밀번호 재설정 완료 응답"""
    message: str  # "비밀번호가 재설정되었습니다."
