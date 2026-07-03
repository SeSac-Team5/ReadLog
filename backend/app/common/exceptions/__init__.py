from fastapi import HTTPException, status


class NotFoundException(HTTPException):
    def __init__(self, detail: str = "리소스를 찾을 수 없습니다."):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "권한이 없습니다."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(HTTPException):
    def __init__(self, detail: str = "잘못된 요청입니다."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ConflictException(HTTPException):
    def __init__(self, detail: str = "중복된 요청입니다."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class UnauthorizedException(HTTPException):
    def __init__(self, detail: str = "인증이 필요합니다."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
