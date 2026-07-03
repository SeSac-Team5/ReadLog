# =====================================================
# routers/auth_router.py — API 엔드포인트 정의
# =====================================================

from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.db.session import get_db
from app.modules.auth.schemas.auth import (
    ChangePasswordRequest, ChangePasswordResponse,
    CheckIdRequest, CheckIdResponse,
    CheckNicknameRequest, CheckNicknameResponse,
    DeleteAccountRequest, DeleteAccountResponse,
    FindIdRequest, FindIdResponse,
    LoginRequest, LoginResponse, LoginUserInfo,
    LogoutResponse,
    MeResponse,
    ResetPasswordRequest, ResetPasswordResponse,
    SignUpRequest, SignUpResponse,
    UpdateProfileRequest, UpdateProfileResponse, UpdatedUserInfo,
    VerifyAccountRequest, VerifyAccountResponse,
)
from app.modules.auth.schemas.genre import GenreInterestResponse, GenreInterestUpdateRequest
from app.modules.auth.services import auth_service as svc
from app.modules.auth.services import genre_service

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE = "session_id"       # 쿠키 이름


# ──────────────────────────────────────────────────────
# 공용 의존성: 로그인 필요한 API에서 공통으로 사용
# ──────────────────────────────────────────────────────

async def get_current_user(
    # Cookie(alias=COOKIE): HTTP 요청의 쿠키에서 "session_id" 값을 꺼냄
    session_id: Optional[str] = Cookie(default=None, alias=COOKIE),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """
    쿠키의 session_id → Redis 조회 → DB에서 User 반환.
    
    로그인이 필요한 엔드포인트에서 이렇게 씀:
        @router.get("/me")
        async def get_me(user = Depends(get_current_user)):
            # user = 현재 로그인한 User 객체
    
    쿠키가 없거나 세션이 만료됐으면 401 에러 자동 반환.
    """
    if not session_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다.")
    return await svc.get_user_by_session(db, redis, session_id)


#   POST /auth/check-id — ID 중복 확인              
# ─────────────────────────────────────────────────

@router.post("/check-id", response_model=CheckIdResponse)
async def check_id(
    body: CheckIdRequest,           # 요청 본문: {"login_id": "..."}
    db: AsyncSession = Depends(get_db),
):
    available = await svc.check_login_id(db, body.login_id)
    if not available:
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 사용 중인 ID입니다.")
    return CheckIdResponse(available=True)


#   POST /auth/check-nickname — 닉네임 중복 확인
# ─────────────────────────────────────────────────

@router.post("/check-nickname", response_model=CheckNicknameResponse)
async def check_nickname(
    body: CheckNicknameRequest,
    db: AsyncSession = Depends(get_db),
):
    available = await svc.check_nickname(db, body.nickname)
    if not available:
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 사용 중인 닉네임입니다.")
    return CheckNicknameResponse(available=True)


#   POST /auth/signup — 회원가입
# ─────────────────────────────────────────────────

@router.post("/signup", response_model=SignUpResponse, status_code=201)
async def sign_up(
    body: SignUpRequest,
    db: AsyncSession = Depends(get_db),
):
    # status_code=201: 성공했는데 새 리소스를 생성했다는 뜻 (200과 구분)
    await svc.sign_up(db, body)
    return SignUpResponse(message="회원가입이 완료되었습니다.")


#   POST /auth/login — 로그인                       
# ─────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    response: Response,             
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    user, session_id, session_ttl = await svc.login(db, redis, body)

    response.set_cookie(
        key=COOKIE,
        value=session_id,
        max_age=session_ttl,  # remember_me=True면 Redis 세션과 동일하게 30일로 연장
        httponly=True,
        samesite="lax",
    )
    return LoginResponse(
        message="로그인되었습니다.",
        user=LoginUserInfo.model_validate(user),  
    )


#   POST /auth/logout — 로그아웃                    
# ─────────────────────────────────────────────────

@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    session_id: Optional[str] = Cookie(default=None, alias=COOKIE),
    redis: Redis = Depends(get_redis),
):
    if session_id:
        await svc.logout(redis, session_id)  # Redis에서 세션 삭제

    # 클라이언트 쿠키도 삭제 (max_age=0 으로 즉시 만료)
    response.delete_cookie(key=COOKIE)
    return LogoutResponse(message="로그아웃되었습니다.")


#   GET /auth/me — 내 정보 조회                     
# ─────────────────────────────────────────────────

@router.get("/me", response_model=MeResponse)
async def get_me(
    user=Depends(get_current_user),  # 쿠키 → 세션 확인 → User 자동 주입
):

    return MeResponse.model_validate(user)


# ┌─────────────────────────────────────────────────┐
# │  PATCH /auth/me — 프로필 수정                    │
# └─────────────────────────────────────────────────┘

@router.patch("/me", response_model=UpdateProfileResponse)
async def update_profile(
    body: UpdateProfileRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await svc.update_profile(db, user, body)
    return UpdateProfileResponse(
        message="프로필이 수정되었습니다.",
        user=UpdatedUserInfo.model_validate(updated),
    )


# ┌─────────────────────────────────────────────────┐
# │  POST /auth/change-password — 비밀번호 변경      │
# └─────────────────────────────────────────────────┘

@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    body: ChangePasswordRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.change_password(db, user, body)
    return ChangePasswordResponse(message="비밀번호가 변경되었습니다.")


# ┌─────────────────────────────────────────────────┐
# │  DELETE /auth/me — 회원탈퇴                      │
# └─────────────────────────────────────────────────┘

@router.delete("/me", response_model=DeleteAccountResponse)
async def delete_account(
    body: DeleteAccountRequest,
    response: Response,
    session_id: Optional[str] = Cookie(default=None, alias=COOKIE),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    await svc.delete_account(db, redis, user, body.password, session_id)
    response.delete_cookie(key=COOKIE)  # 탈퇴 즉시 쿠키도 삭제
    return DeleteAccountResponse(message="회원탈퇴가 완료되었습니다.")


# ┌─────────────────────────────────────────────────┐
# │  GET /auth/me/genres — 관심장르 조회             │
# └─────────────────────────────────────────────────┘

@router.get("/me/genres", response_model=GenreInterestResponse)
async def get_my_genres(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    genres = await genre_service.get_genres(db, user)
    return GenreInterestResponse(genres=genres)


# ┌─────────────────────────────────────────────────┐
# │  PUT /auth/me/genres — 관심장르 전체 교체        │
# └─────────────────────────────────────────────────┘

@router.put("/me/genres", response_model=GenreInterestResponse)
async def update_my_genres(
    body: GenreInterestUpdateRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    genres = await genre_service.set_genres(db, user, body.genres)
    return GenreInterestResponse(genres=genres)


# ┌─────────────────────────────────────────────────┐
# │  POST /auth/find-id — 아이디 찾기                │
# └─────────────────────────────────────────────────┘

@router.post("/find-id", response_model=FindIdResponse)
async def find_id(
    body: FindIdRequest,
    db: AsyncSession = Depends(get_db),
):
    masked_login_id = await svc.find_id(db, body.nickname)
    return FindIdResponse(login_id=masked_login_id)


# ┌─────────────────────────────────────────────────┐
# │  POST /auth/verify-account — 비밀번호 찾기 1단계 │
# └─────────────────────────────────────────────────┘

@router.post("/verify-account", response_model=VerifyAccountResponse)
async def verify_account(
    body: VerifyAccountRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    reset_token = await svc.verify_account_for_reset(db, redis, body.login_id, body.nickname)
    return VerifyAccountResponse(reset_token=reset_token)


# ┌─────────────────────────────────────────────────┐
# │  POST /auth/reset-password — 비밀번호 찾기 2단계 │
# └─────────────────────────────────────────────────┘

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    await svc.reset_password(db, redis, body.reset_token, body.new_password, body.new_password_confirm)
    return ResetPasswordResponse(message="비밀번호가 재설정되었습니다.")
