import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/theme';
import * as authApi from '../../api/auth/authApi';
import { GENRE_CHOICES } from '../../types/auth';

export function GenreInterestTabContent() {
  const [selected, setSelected] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi
      .fetchGenres()
      .then((res) => setSelected(res.genres))
      .catch((e) => setError(e instanceof Error ? e.message : '관심장르를 불러오지 못했습니다.'));
  }, []);

  const toggle = (genre: string) => {
    setSelected((prev) => {
      const current = prev ?? [];
      return current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre];
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setError('');
    setSaving(true);
    try {
      const res = await authApi.updateGenres(selected);
      setSelected(res.genres);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (selected === null) {
    return <ActivityIndicator color={colors.deepGreen} style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>관심있는 장르를 선택해주세요.</Text>
      <View
        style={styles.chips}>
        {GENRE_CHOICES.map((genre) => {
          const active = selected.includes(genre);
          return (
            <TouchableOpacity
              key={genre}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(genre)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{genre}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator size="small" color={colors.beigeLight} /> : <Text style={styles.saveBtnText}>저장</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  loading: {
    paddingVertical: 32,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(45,74,62,0.3)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.deepGreen,
    borderColor: colors.deepGreen,
  },
  chipText: {
    fontSize: 12,
    color: colors.deepGreen,
  },
  chipTextActive: {
    color: colors.beigeLight,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  saveBtn: {
    backgroundColor: colors.deepGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: colors.beigeLight,
    fontSize: 13,
    fontWeight: '500',
  },
});
