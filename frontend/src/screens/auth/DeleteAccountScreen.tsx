import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, ArrowLeft, Check } from 'lucide-react-native';
import * as authApi from '../../api/auth/authApi';
import { Field, Label, PrimaryBtn } from '../../components/auth/FormPrimitives';
import { colors } from '../../constants/theme';
import { useAuth } from '../../store/auth/AuthContext';

export function DeleteAccountScreen({ onBack }: { onBack: () => void }) {
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.deleteAccount(password);
      await logout();
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원탈퇴에 실패했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.navBarSide}>
          <ArrowLeft size={20} color={colors.deepGreen} />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>회원탈퇴</Text>
        <View style={styles.navBarSide} />
      </View>

      <View style={styles.form}>
        <View style={styles.warningBox}>
          <AlertTriangle size={18} color={colors.danger} style={styles.warningIcon} />
          <View style={styles.warningTextWrap}>
            <Text style={styles.warningTitle}>탈퇴 전 꼭 확인해주세요</Text>
            <Text style={styles.warningItem}>• 모든 독서 기록이 영구 삭제됩니다.</Text>
            <Text style={styles.warningItem}>• 참여 중인 독서 모임에서 탈퇴됩니다.</Text>
            <Text style={styles.warningItem}>• 삭제된 데이터는 복구할 수 없습니다.</Text>
          </View>
        </View>

        <View>
          <Label>비밀번호 확인</Label>
          <Field
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            secureToggle
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Check size={10} color="#fff" />}
          </View>
          <Text style={styles.agreeText}>위 내용을 모두 확인했으며, 탈퇴에 동의합니다.</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryBtn
          onPress={handleSubmit}
          disabled={!password || !agreed}
          loading={submitting}
          danger
        >
          탈퇴하기
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
    gap: 20,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningTextWrap: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 4,
  },
  warningItem: {
    fontSize: 12,
    color: colors.danger,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  agreeText: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
});
