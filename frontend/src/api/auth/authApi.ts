import { API_BASE_URL } from '../../config';
import type { LoginUser, MeResponse } from '../../types/auth';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    // fetch itself threw — server unreachable, wrong host, no network, etc.
    throw new ApiError(0, '서버에 연결할 수 없습니다');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.detail;
    throw new ApiError(res.status, typeof detail === 'string' ? detail : `요청이 실패했습니다 (${res.status})`);
  }

  return data as T;
}

export function checkId(loginId: string) {
  return request<{ available: boolean }>('/auth/check-id', {
    method: 'POST',
    body: JSON.stringify({ login_id: loginId }),
  });
}

export function checkNickname(nickname: string) {
  return request<{ available: boolean }>('/auth/check-nickname', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

export function signUp(params: {
  login_id: string;
  password: string;
  password_confirm: string;
  nickname: string;
}) {
  return request<{ message: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function login(login_id: string, password: string, remember_me: boolean = false) {
  return request<{ message: string; user: LoginUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login_id, password, remember_me }),
  });
}

export function logout() {
  return request<{ message: string }>('/auth/logout', { method: 'POST' });
}

export function fetchMe() {
  return request<MeResponse>('/auth/me');
}

export function updateProfile(params: {
  nickname?: string;
  profile_image?: string;
  introduction?: string;
}) {
  return request<{ message: string; user: { nickname: string; profile_image: string | null; introduction: string | null } }>(
    '/auth/me',
    {
      method: 'PATCH',
      body: JSON.stringify(params),
    },
  );
}

export function changePassword(params: {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}) {
  return request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function deleteAccount(password: string) {
  return request<{ message: string }>('/auth/me', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

export function fetchGenres() {
  return request<{ genres: string[] }>('/auth/me/genres');
}

export function updateGenres(genres: string[]) {
  return request<{ genres: string[] }>('/auth/me/genres', {
    method: 'PUT',
    body: JSON.stringify({ genres }),
  });
}

export function findId(nickname: string) {
  return request<{ login_id: string }>('/auth/find-id', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

export function verifyAccount(loginId: string, nickname: string) {
  return request<{ reset_token: string }>('/auth/verify-account', {
    method: 'POST',
    body: JSON.stringify({ login_id: loginId, nickname }),
  });
}

export function resetPassword(params: {
  reset_token: string;
  new_password: string;
  new_password_confirm: string;
}) {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
