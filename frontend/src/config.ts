import Constants from 'expo-constants';

export const API_BASE_URL: string =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://192.168.38.69:8000';
