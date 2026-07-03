// 회원가입/비밀번호 변경 화면에서 공통으로 쓰는 입력값 검증 규칙.
// 백엔드(app/modules/auth/schemas/auth.py)의 규칙과 반드시 동일하게 유지할 것.

export const LOGIN_ID_PATTERN = /^[A-Za-z0-9_-]{4,30}$/;
export const PASSWORD_PATTERN =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~])[A-Za-z\d!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]{8,16}$/;

export const LOGIN_ID_HINT = '영문, 숫자, -, _ 4~30자 (한글 사용 불가)';
export const PASSWORD_HINT = '8~16자, 영문 대문자·소문자·특수문자 각 1개 이상 포함';
export const NICKNAME_HINT = '2~8자';

export function isValidLoginId(value: string): boolean {
  return LOGIN_ID_PATTERN.test(value);
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_PATTERN.test(value);
}

export function isValidNickname(value: string): boolean {
  return value.length >= 2 && value.length <= 8;
}
