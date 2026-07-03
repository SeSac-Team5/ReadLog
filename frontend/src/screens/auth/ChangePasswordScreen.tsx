import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import * as authApi from '../../api/auth/authApi';
import { Field, Label, PrimaryBtn } from '../../components/auth/FormPrimitives';
import { colors } from '../../constants/theme';
import { isValidPassword, PASSWORD_HINT } from '../../hooks/auth/validators';

export function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const newPasswordInvalid = newPassword.length > 0 && !isValidPassword(newPassword);
  const newPasswordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;
  const canSubmit =
    currentPassword.length > 0 &&
    isValidPassword(newPassword) &&
    newPassword === newPasswordConfirm;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '비밀번호 변경에 실패했습니다.');
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
        <Text style={styles.navBarTitle}>비밀번호 변경</Text>
        <View style={styles.navBarSide} />
      </View>

      <View style={styles.form}>
        <View>
          <Label>현재 비밀번호</Label>
          <Field
            placeholder="현재 비밀번호 입력"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureToggle
            autoCapitalize="none"
          />
        </View>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>비밀번호가 변경되었습니다.</Text> : null}

        <PrimaryBtn onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          변경하기
        </PrimaryBtn>
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
    gap: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
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
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: colors.success,
  },
});
