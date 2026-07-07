import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import * as authApi from '../../api/auth/authApi';
import { Field, Label, PrimaryBtn } from '../../components/auth/FormPrimitives';
import { colors } from '../../constants/theme';
import { isValidNickname, NICKNAME_HINT } from '../../hooks/auth/validators';

export function FindIdScreen({ onBack }: { onBack: () => void }) {
  const [nickname, setNickname] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = isValidNickname(nickname);

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const res = await authApi.findId(nickname);
      setResult(res.login_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '아이디를 찾을 수 없습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.navBarSide}>
          <ArrowLeft size={20} color={colors.deepGreen} />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>아이디 찾기</Text>
        <View style={styles.navBarSide} />
      </View>

      <View style={styles.form}>
        <Text style={styles.description}>
          가입 시 등록한 닉네임을 입력하면 아이디 일부를 확인할 수 있어요.
        </Text>

        <View>
          <Label>닉네임</Label>
          <Field
            placeholder={NICKNAME_HINT}
            value={nickname}
            onChangeText={(v) => {
              setNickname(v);
              setResult(null);
              setError('');
            }}
          />
        </View>

        {error ? (
          <View style={styles.inlineMsg}>
            <X size={11} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.resultBox}>
            <Check size={14} color={colors.success} />
            <Text style={styles.resultText}>회원님의 아이디는 {result} 입니다.</Text>
          </View>
        ) : null}

        <PrimaryBtn onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          아이디 찾기
        </PrimaryBtn>
      </View>
    </SafeAreaView>
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
    paddingTop: 12,
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
    gap: 16,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
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
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(45,74,62,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultText: {
    fontSize: 13,
    color: colors.textPrimary,
    flexShrink: 1,
  },
});
