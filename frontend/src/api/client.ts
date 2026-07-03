import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// authApi.ts와 동일한 키로 세션 읽기
const SESSION_KEY = '@session_id';

const client = axios.create({
  baseURL: API_BASE_URL,  // app.json apiBaseUrl이 이미 /api 포함 — 중복 제거
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const id = await AsyncStorage.getItem(SESSION_KEY);
  if (id) {
    config.headers.Cookie = `session_id=${id}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      AsyncStorage.removeItem(SESSION_KEY);
    }
    return Promise.reject(err);
  }
);

export default client;
