import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import {
  loadDailyReminderSettings,
  setDailyReminder,
} from '../../hooks/auth/dailyReminder';

function formatTime(hour: number, minute: number) {
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}:${String(minute).padStart(2, '0')}`;
}

export function NotificationSettingsScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDailyReminderSettings().then((settings) => {
      setEnabled(settings.enabled);
      setHour(settings.hour);
      setMinute(settings.minute);
      setLoading(false);
    });
  }, []);

  const applyChange = async (nextEnabled: boolean, nextHour: number, nextMinute: number) => {
    setError('');
    setSaving(true);
    try {
      const result = await setDailyReminder(nextEnabled, nextHour, nextMinute);
      setEnabled(result.enabled);
      setHour(result.hour);
      setMinute(result.minute);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알림 설정에 실패했습니다.');
      setEnabled(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (value: boolean) => {
    applyChange(value, hour, minute);
  };

  const adjustHour = (delta: number) => {
    const next = (hour + delta + 24) % 24;
    setHour(next);
    if (enabled) applyChange(true, next, minute);
  };

  const adjustMinute = (delta: number) => {
    const next = (minute + delta + 60) % 60;
    setMinute(next);
    if (enabled) applyChange(true, hour, next);
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.navBarSide}>
          <ArrowLeft size={20} color={colors.deepGreen} />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>알림 설정</Text>
        <View style={styles.navBarSide} />
      </View>

      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>매일 독서 리마인더</Text>
            <Text style={styles.rowDesc}>설정한 시각에 독서를 기록하라는 알림을 보내드려요.</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={saving}
            trackColor={{ true: colors.deepGreen }}
          />
        </View>

        <View style={[styles.timePicker, !enabled && styles.timePickerDisabled]}>
          <Text style={styles.timeLabel}>알림 시각</Text>
          <Text style={styles.timeValue}>{formatTime(hour, minute)}</Text>
          <View style={styles.stepperRow}>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustHour(-1)}
                disabled={!enabled || saving}
              >
                <Minus size={14} color={colors.deepGreen} />
              </TouchableOpacity>
              <Text style={styles.stepperLabel}>시</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustHour(1)}
                disabled={!enabled || saving}
              >
                <Plus size={14} color={colors.deepGreen} />
              </TouchableOpacity>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustMinute(-10)}
                disabled={!enabled || saving}
              >
                <Minus size={14} color={colors.deepGreen} />
              </TouchableOpacity>
              <Text style={styles.stepperLabel}>분</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => adjustMinute(10)}
                disabled={!enabled || saving}
              >
                <Plus size={14} color={colors.deepGreen} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.inlineMsg}>
            <X size={11} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.beigeLight,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBarSide: {
    width: 32,
  },
  navBarTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  rowDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  timePicker: {
    backgroundColor: colors.beigeDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  timePickerDisabled: {
    opacity: 0.5,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(45,74,62,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    minWidth: 14,
    textAlign: 'center',
  },
  inlineMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
});
