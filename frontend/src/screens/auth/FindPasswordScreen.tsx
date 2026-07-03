import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import * as authApi from '../../api/auth/authApi';
import { Field, Label, PrimaryBtn } from '../../components/auth/FormPrimitives';
import { colors } from '../../constants/theme';
import { isValidLoginId, isValidNickname, isValidPassword, LOGIN_ID_HINT, PASSWORD_HINT } from '../../hooks/auth/validators';

type Step = 'verify' | 'reset' | 'done';

export function FindPasswordScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState<Step>('verify');
  const [loginId, setLoginId] = useState('');
  const [nickname, setNickname] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canVerify = isValidLoginId(loginId) && isValidNickname(nickname);
  const newPasswordInvalid = newPassword.length > 0 && !isValidPassword(newPassword);
  const newPasswordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;
  const canReset = isValidPassword(newPassword) && newPassword === newPasswordConfirm;

  const handleVerify = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await authApi.verifyAccount(loginId, nickname);
      setResetToken(res.reset_token);
      setStep('reset');
    } catch (e) {
      setError(e instanceof Error ? e.message : '본인 확인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        reset_token: resetToken,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.navBarSide}>
          <ArrowLeft size={20} color={colors.deepGreen} />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>비밀번호 찾기</Text>
        <View style={styles.navBarSide} />
      </View>

      {step === 'verify' && (
        <View style={styles.form}>
          <Text style={styles.description}>
            아이디와 닉네임을 입력해 본인 확인 후 새 비밀번호를 설정할 수 있어요.
          </Text>

          <View>
            <Label>아이디</Label>
            <Field
              placeholder={LOGIN_ID_HINT}
              value={loginId}
              autoCapitalize="none"
              onChangeText={setLoginId}
            />
          </View>

          <View>
            <Label>닉네임</Label>
            <Field placeholder="가입 시 등록한 닉네임" value={nickname} onChangeText={setNickname} />
          </View>

          {error ? (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryBtn onPress={handleVerify} disabled={!canVerify} loading={submitting}>
            본인 확인
          </PrimaryBtn>
        </View>
      )}

      {step === 'reset' && (
        <View style={styles.form}>
          <Text style={styles.description}>본인 확인이 완료되었어요. 새 비밀번호를 설정해주세요.</Text>

          <View>
            <Label>새 비밀번호</Label>
            <Field
              placeholder={PASSWORD_HINT}
              value={newPassword}
              onChangeText={setNewPassword}
              secureToggle
              autoCapitalize="none"
            />
            <Text style={styles.hintText}>{PASSWORD_HINT}</Text>
            {newPasswordInvalid && (
              <View style={styles.inlineMsg}>
                <X size={11} color={colors.danger} />
                <Text style={styles.errorText}>비밀번호 형식이 올바르지 않습니다.</Text>
              </View>
            )}
          </View>

          <View>
            <Label>새 비밀번호 확인</Label>
            <Field
              placeholder="새 비밀번호를 다시 입력하세요"
              value={newPasswordConfirm}
              onChangeText={setNewPasswordConfirm}
              secureToggle
              autoCapitalize="none"
            />
            {newPasswordMismatch && (
              <View style={styles.inlineMsg}>
                <X size={11} color={colors.danger} />
                <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
              </View>
            )}
          </View>

          {error ? (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryBtn onPress={handleReset} disabled={!canReset} loading={submitting}>
            비밀번호 재설정
          </PrimaryBtn>
        </View>
      )}

      {step === 'done' && (
        <View style={styles.form}>
          <Text style={styles.successText}>비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.</Text>
          <PrimaryBtn onPress={onDone}>로그인하러 가기</PrimaryBtn>
        </View>
      )}
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
    gap: 16,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
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
  successText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
