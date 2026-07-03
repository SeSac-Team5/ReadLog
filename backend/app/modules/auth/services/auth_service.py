# =====================================================
# services/auth_service.py — 핵심 비즈니스 로직
# =====================================================

import json
import uuid

from fastapi import HTTPException, status
from passlib.context import CryptContext
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models.user import User
from app.modules.auth.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    SignUpRequest,
    UpdateProfileRequest,
)

# ──────────────────────────────────────────────────────
# 비밀번호 해싱 설정
# bcrypt: 비밀번호를 알아볼 수 없는 문자열로 변환하는 알고리즘
# 예) "mypassword" → "$2b$12$abc..." (되돌릴 수 없음)
# ──────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 세션 유효 시간: 24시간 (초 단위)
# 이 시간이 지나면 Redis에서 세션이 자동 삭제 → 로그아웃 처리
SESSION_TTL = 60 * 60 * 24

# 자동 로그인(remember_me) 시 세션 유효 시간: 30일
SESSION_TTL_REMEMBER = 60 * 60 * 24 * 30

# 비밀번호 재설정 토큰 유효 시간: 10분 (초 단위)
RESET_TOKEN_TTL = 60 * 10


def _hash(plain: str) -> str:
    """비밀번호 → 해시값 변환. DB 저장 전 반드시 이 함수 통과."""
    return pwd_context.hash(plain)


def _verify(plain: str, hashed: str) -> bool:
    """
    사용자가 입력한 비밀번호와 DB의 해시값이 일치하는지 확인.
    해시값은 원래 비밀번호로 복원 불가능하므로 이 방식으로 비교함.
    """
    return pwd_context.verify(plain, hashed)


def _session_key(session_id: str) -> str:
    """
    Redis에 저장할 키 이름 생성.
    예) "abc-123" → "session:abc-123"
    
    prefix를 붙이는 이유: Redis에 다른 데이터도 저장될 수 있어서
    세션 데이터임을 구분하기 위함.
    """
    return f"session:{session_id}"


# ┌─────────────────────────────────────────────────┐
# │  ID 중복 확인                                    │
# └─────────────────────────────────────────────────┘

async def check_login_id(db: AsyncSession, login_id: str) -> bool:
    """
    login_id가 이미 사용 중인지 DB에서 확인.
    
    반환값:
        True  → 사용 가능 (DB에 없음)
        False → 이미 사용 중 (DB에 있음)
    
    ※ is_deleted=True인 탈퇴 계정도 DB에 남아있어서
      탈퇴한 사람의 ID는 재사용 불가 (팀 논의 필요, auth.md 참고)
    """
    result = await db.execute(
        select(User).where(
            User.login_id == login_id,
            User.is_deleted == False  # 탈퇴한 계정 제외
        )
    )
    return result.scalar_one_or_none() is None  # None이면 없다는 뜻 → True(사용 가능)


# ┌─────────────────────────────────────────────────┐
# │  닉네임 중복 확인                                │
# └─────────────────────────────────────────────────┘

async def check_nickname(db: AsyncSession, nickname: str) -> bool:
    """
    nickname이 이미 사용 중인지 DB에서 확인.
    회원가입 폼과 프로필 수정 화면의 '중복확인' 버튼에서 공통으로 사용.

    반환값:
        True  → 사용 가능 (DB에 없음)
        False → 이미 사용 중 (DB에 있음)
    """
    result = await db.execute(
        select(User).where(
            User.nickname == nickname,
            User.is_deleted == False  # 탈퇴한 계정 제외
        )
    )
    return result.scalar_one_or_none() is None  # None이면 없다는 뜻 → True(사용 가능)


# ┌─────────────────────────────────────────────────┐
# │  회원가입                                        │
# └─────────────────────────────────────────────────┘

async def sign_up(db: AsyncSession, data: SignUpRequest) -> User:
    """
    새 회원을 DB에 저장.
    
    처리 순서:
        1. 비밀번호 ↔ 비밀번호 확인 일치 여부
        2. login_id 중복 확인
        3. nickname 중복 확인
        4. 비밀번호 해싱
        5. DB에 저장
    """
    # 1. 비밀번호 확인
    if data.password != data.password_confirm:
        # HTTP 400: 잘못된 요청 (클라이언트 실수)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "비밀번호가 일치하지 않습니다.")

    # 2. ID 중복 확인
    if not await check_login_id(db, data.login_id):
        # HTTP 409: 충돌 (이미 존재하는 리소스)
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 사용 중인 ID입니다.")

    # 3. 닉네임 중복 확인
    nick_taken = await db.execute(
        select(User).where(User.nickname == data.nickname, User.is_deleted == False)
    )
    if nick_taken.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 사용 중인 닉네임입니다.")

    # 4 & 5. 비밀번호 해싱 후 DB 저장
    # ⚠️ data.password 를 직접 저장하면 절대 안 됨! _hash()를 반드시 거쳐야 함
    user = User(
        login_id=data.login_id,
        password=_hash(data.password),  # 해시값만 저장
        nickname=data.nickname,
    )
    db.add(user)  # INSERT 예약
    try:
        await db.commit()  # 실제 DB에 반영
    except IntegrityError:
        # 위의 중복 확인과 실제 INSERT 사이에 다른 요청이 같은 값을 먼저 가져간 경우(레이스 컨디션) 대비.
        # 이게 없으면 DB UNIQUE 제약 위반이 그대로 500 에러로 나감.
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 사용 중인 ID 또는 닉네임입니다.")
    await db.refresh(user)  # DB에서 최신 상태(id, created_at 등) 다시 읽어옴
    return user


# ┌─────────────────────────────────────────────────┐
# │  로그인                                          │
# └─────────────────────────────────────────────────┘

async def login(db: AsyncSession, redis: Redis, data: LoginRequest) -> tuple[User, str, int]:
    """
    로그인 처리. 성공 시 (User 객체, session_id, session_ttl) 를 반환.

    session_id는 Redis에 저장되고, 클라이언트 쿠키에도 심어줌.
    이후 요청마다 쿠키의 session_id → Redis 조회 → 사용자 확인.

    ⚠️ 보안: ID 없음과 PW 불일치를 같은 에러 메시지로 처리.
       이유: 다르게 하면 해커가 "이 ID는 존재한다"는 정보를 얻을 수 있음.

    data.remember_me가 True면 세션 유효 시간을 SESSION_TTL_REMEMBER(30일)로 늘려서
    앱을 재실행해도 세션 쿠키가 살아있는 동안은 다시 로그인하지 않도록 한다(자동 로그인).
    """
    # DB에서 사용자 조회 (탈퇴한 계정 제외)
    result = await db.execute(
        select(User).where(
            User.login_id == data.login_id,
            User.is_deleted == False
        )
    )
    user = result.scalar_one_or_none()

    # ID가 없거나 비밀번호가 틀리면 → 같은 에러 메시지 (보안)
    if user is None or not _verify(data.password, user.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "ID 또는 비밀번호가 올바르지 않습니다.")

    # 세션 ID 생성: uuid4() = 절대 겹치지 않는 랜덤 문자열
    # 예) "550e8400-e29b-41d4-a716-446655440000"
    session_id = str(uuid.uuid4())

    session_ttl = SESSION_TTL_REMEMBER if data.remember_me else SESSION_TTL

    # Redis에 세션 저장
    # key: "session:550e8400-..."
    # value: '{"user_id": 1, "role": "USER"}'
    # ex=session_ttl: 이 시간 후 자동 삭제
    await redis.set(
        _session_key(session_id),
        json.dumps({"user_id": user.id, "role": user.role.value}),
        ex=session_ttl,
    )
    return user, session_id, session_ttl


# ┌─────────────────────────────────────────────────┐
# │  로그아웃                                        │
# └─────────────────────────────────────────────────┘

async def logout(redis: Redis, session_id: str) -> None:
    """
    Redis에서 세션을 삭제.
    삭제 후엔 같은 session_id로 다시 요청해도 인증 실패.
    """
    await redis.delete(_session_key(session_id))


# ┌─────────────────────────────────────────────────┐
# │  세션으로 현재 유저 조회                          │
# └─────────────────────────────────────────────────┘

async def get_user_by_session(db: AsyncSession, redis: Redis, session_id: str) -> User:
    """
    쿠키의 session_id로 현재 로그인한 사용자를 반환.
    
    처리 순서:
        1. Redis에서 session_id로 user_id 조회
        2. DB에서 user_id로 User 객체 반환
    
    로그인이 필요한 모든 API에서 Depends(get_current_user)로 호출됨.
    """
    # Redis에서 세션 데이터 조회
    raw = await redis.get(_session_key(session_id))
    if not raw:
        # 세션이 없음 = 로그인 안 됨 or 만료됨
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다.")

    user_id = json.loads(raw)["user_id"]

    # DB에서 유저 조회
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다.")
    return user


# ┌─────────────────────────────────────────────────┐
# │  프로필 수정                                     │
# └─────────────────────────────────────────────────┘

async def update_profile(db: AsyncSession, user: User, data: UpdateProfileRequest) -> User:
    """
    닉네임, 프로필 이미지, 자기소개 수정.
    보낸 필드만 업데이트하고 나머지는 그대로 유지.
    """
    if data.nickname and data.nickname != user.nickname:
        # 새 닉네임이 이미 있는지 확인
        dup = await db.execute(
            select(User).where(User.nickname == data.nickname, User.is_deleted == False)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status.HTTP_409_CONFLICT, "이미 사용 중인 닉네임입니다.")
        user.nickname = data.nickname

    # None이 아닐 때만 업데이트 (None = 변경 안 함)
    if data.profile_image is not None:
        user.profile_image = data.profile_image
    if data.introduction is not None:
        user.introduction = data.introduction

    await db.commit()
    await db.refresh(user)  # 최신 상태 다시 읽어옴
    return user


# ┌─────────────────────────────────────────────────┐
# │  비밀번호 변경                                   │
# └─────────────────────────────────────────────────┘

async def change_password(db: AsyncSession, user: User, data: ChangePasswordRequest) -> None:
    """
    현재 비밀번호 확인 후 새 비밀번호로 변경.
    본인 확인 없이 변경하면 타인이 계정을 탈취했을 때 위험.
    """
    # 현재 비밀번호가 맞는지 확인
    if not _verify(data.current_password, user.password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다.")

    # 새 비밀번호 두 개가 일치하는지 확인
    if data.new_password != data.new_password_confirm:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "새 비밀번호가 일치하지 않습니다.")

    # 새 비밀번호 해싱 후 저장
    user.password = _hash(data.new_password)
    await db.commit()


# ┌─────────────────────────────────────────────────┐
# │  회원탈퇴                                        │
# └─────────────────────────────────────────────────┘

async def delete_account(
    db: AsyncSession,
    redis: Redis,
    user: User,
    password: str,
    session_id: str,
) -> None:
    """
    회원탈퇴 처리.

    ⚠️ 중요: 절대 row를 DELETE 하지 않음!
       user.is_deleted = True 로만 바꿈 → "soft delete(소프트 딜리트)"

    이유:
        - 해당 유저가 작성한 독서 기록, 댓글 등이 연결돼 있어서
          갑자기 삭제하면 다른 데이터가 깨질 수 있음
        - 법적 의무로 일정 기간 데이터를 보관해야 할 수도 있음

    ⚠️ login_id / nickname은 NULL로 비움 (탈퇴 계정 재사용 허용, B안):
        - 이 두 컬럼엔 DB UNIQUE 제약이 걸려 있어서, 탈퇴한 row에 값이
          그대로 남아있으면 같은 아이디/닉네임으로 재가입할 때 DB 레벨에서
          충돌(IntegrityError)이 나서 500 에러가 났었음.
        - MySQL의 UNIQUE 인덱스는 NULL끼리는 중복으로 취급하지 않으므로,
          탈퇴 시 두 값을 NULL로 비우면 그 값을 다른 사람이 다시 쓸 수 있음.
    """
    # 비밀번호로 본인 확인
    if not _verify(password, user.password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "비밀번호가 올바르지 않습니다.")

    # soft delete: row 삭제 대신 플래그만 변경 + 재사용 가능하도록 login_id/nickname 비움
    user.is_deleted = True
    user.login_id = None
    user.nickname = None
    await db.commit()

    # 세션도 함께 삭제 → 탈퇴 즉시 로그아웃
    await redis.delete(_session_key(session_id))


def _reset_token_key(token: str) -> str:
    """비밀번호 재설정 토큰을 Redis에 저장할 때 쓰는 키 이름 생성."""
    return f"pwreset:{token}"


def _mask_login_id(login_id: str) -> str:
    """
    아이디 찾기 결과를 그대로 노출하지 않기 위한 마스킹.
    예) "readloguser" (11자) → "rea********"
        "ab" (2자 이하)      → "a*"

    앞 3자만 남기고 나머지는 '*' 처리. 원본 길이가 짧으면 앞 1자만 남긴다.
    """
    visible_len = 3 if len(login_id) > 3 else 1
    return login_id[:visible_len] + "*" * (len(login_id) - visible_len)


# ┌─────────────────────────────────────────────────┐
# │  아이디 찾기                                     │
# └─────────────────────────────────────────────────┘

async def find_id(db: AsyncSession, nickname: str) -> str:
    """
    닉네임으로 아이디를 찾아 마스킹해서 반환.

    ⚠️ 이메일/휴대폰 컬럼이 없어 정식 본인확인이 불가능한 상태에서
    팀 논의로 채택한 간이 방식이다. 닉네임은 앱에서 공개적으로 보이는
    값이라 완전한 보안 수단은 아니므로, 결과를 마스킹해서 최소한의
    노출만 하도록 한다.
    """
    result = await db.execute(
        select(User).where(User.nickname == nickname, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if user is None or not user.login_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "일치하는 회원 정보가 없습니다.")
    return _mask_login_id(user.login_id)


# ┌─────────────────────────────────────────────────┐
# │  비밀번호 찾기 — 1단계: 본인 확인                │
# └─────────────────────────────────────────────────┘

async def verify_account_for_reset(
    db: AsyncSession, redis: Redis, login_id: str, nickname: str
) -> str:
    """
    아이디 + 닉네임이 모두 일치하는 계정인지 확인하고, 통과하면
    비밀번호 재설정에 쓸 단기 토큰(10분)을 Redis에 발급한다.

    ⚠️ 이메일/SMS 인증이 없는 간이 확인 방식(팀 논의로 채택, find_id와 동일한 배경).
       ID 없음과 닉네임 불일치를 같은 에러 메시지로 처리해 계정 존재 여부를 숨긴다.
    """
    result = await db.execute(
        select(User).where(
            User.login_id == login_id,
            User.nickname == nickname,
            User.is_deleted == False,
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "일치하는 회원 정보가 없습니다.")

    reset_token = str(uuid.uuid4())
    await redis.set(_reset_token_key(reset_token), str(user.id), ex=RESET_TOKEN_TTL)
    return reset_token


# ┌─────────────────────────────────────────────────┐
# │  비밀번호 찾기 — 2단계: 재설정                   │
# └─────────────────────────────────────────────────┘

async def reset_password(
    db: AsyncSession,
    redis: Redis,
    reset_token: str,
    new_password: str,
    new_password_confirm: str,
) -> None:
    """
    재설정 토큰을 검증하고 새 비밀번호로 교체.
    토큰은 1회성이라 성공/실패와 상관없이 검증 직후 Redis에서 삭제한다.
    """
    if new_password != new_password_confirm:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "새 비밀번호가 일치하지 않습니다.")

    key = _reset_token_key(reset_token)
    raw_user_id = await redis.get(key)
    if not raw_user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "인증이 만료되었습니다. 처음부터 다시 시도해주세요.")
    await redis.delete(key)  # 1회성 토큰: 성공하든 실패하든 즉시 폐기

    result = await db.execute(
        select(User).where(User.id == int(raw_user_id), User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "일치하는 회원 정보가 없습니다.")

    user.password = _hash(new_password)
    await db.commit()
