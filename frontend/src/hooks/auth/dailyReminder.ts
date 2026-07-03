// 매일 독서 리마인더 로컬 알림 관리.
// 서버 없이 기기에 직접 예약하는 로컬 알림이라 AsyncStorage에만 설정을 저장한다.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = '@readlog/dailyReminderSettings';
const ANDROID_CHANNEL_ID = 'daily-reminder';

export type DailyReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId: string | null;
};

const DEFAULT_SETTINGS: DailyReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
  notificationId: null,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '독서 리마인더',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function loadDailyReminderSettings(): Promise<DailyReminderSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveDailyReminderSettings(settings: DailyReminderSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * 매일 지정한 시각에 울리는 독서 리마인더를 켜거나 끈다.
 * 이전에 예약된 알림이 있으면 항상 먼저 취소하고 다시 예약한다(시각 변경 대응).
 */
export async function setDailyReminder(
  enabled: boolean,
  hour: number,
  minute: number,
): Promise<DailyReminderSettings> {
  const current = await loadDailyReminderSettings();
  if (current.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(current.notificationId).catch(() => {});
  }

  if (!enabled) {
    const next: DailyReminderSettings = { enabled: false, hour, minute, notificationId: null };
    await saveDailyReminderSettings(next);
    return next;
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error('알림 권한이 꺼져있어요. 기기 설정에서 알림을 허용해주세요.');
  }
  await ensureAndroidChannel();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '오늘의 독서 시간이에요 📖',
      body: '잠깐이라도 좋아요. 오늘 읽은 페이지를 기록해보세요.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  const next: DailyReminderSettings = { enabled: true, hour, minute, notificationId };
  await saveDailyReminderSettings(next);
  return next;
}
