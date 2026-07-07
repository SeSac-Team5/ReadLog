import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, BookMarked, Check } from 'lucide-react-native';
import { Field, PrimaryBtn } from '../../components/auth/FormPrimitives';
import { colors } from '../../constants/theme';
import { useAuth } from '../../store/auth/AuthContext';

export function LoginScreen({
  onNavigateSignUp,
  onNavigateFindId,
  onNavigateFindPassword,
}: {
  onNavigateSignUp: () => void;
  onNavigateFindId: () => void;
  onNavigateFindPassword: () => void;
}) {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(loginId, password, rememberMe);
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <BookMarked size={28} color={colors.beigeLight} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>READLOG</Text>
        <Text style={styles.subtitle}>나만의 독서 기록, 함께하는 독서</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <AlertTriangle size={12} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.fields}>
        <Field
          placeholder="아이디"
          value={loginId}
          onChangeText={setLoginId}
          autoCapitalize="none"
        />
        <Field
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureToggle
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.rememberRow}
        onPress={() => setRememberMe((v) => !v)}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && <Check size={10} color="#fff" />}
        </View>
        <Text style={styles.rememberText}>자동 로그인</Text>
      </TouchableOpacity>

      <PrimaryBtn onPress={handleLogin} loading={loading} disabled={!loginId || !password}>
        로그인
      </PrimaryBtn>

      <View style={styles.signUpRow}>
        <Text style={styles.signUpText}>계정이 없으신가요? </Text>
        <TouchableOpacity onPress={onNavigateSignUp}>
          <Text style={styles.signUpLink}>회원가입</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity onPress={onNavigateFindId}>
          <Text style={styles.footerLink}>아이디 찾기</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>|</Text>
        <TouchableOpacity onPress={onNavigateFindPassword}>
          <Text style={styles.footerLink}>비밀번호 찾기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.beigeLight,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.deepGreen,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: 4,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    flexShrink: 1,
  },
  fields: {
    gap: 12,
    marginBottom: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DDD7CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.deepGreen,
    borderColor: colors.deepGreen,
  },
  rememberText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  signUpLink: {
    fontSize: 14,
    color: colors.deepGreen,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingBottom: 32,
  },
  footerLink: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerDivider: {
    fontSize: 12,
    color: colors.textMuted,
    opacity: 0.5,
  },
});
