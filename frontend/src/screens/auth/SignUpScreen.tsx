import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import * as authApi from '../../api/auth/authApi';
import { Field, Label, PrimaryBtn } from '../../components/auth/FormPrimitives';
import { colors } from '../../constants/theme';
import {
  isValidLoginId,
  isValidNickname,
  isValidPassword,
  LOGIN_ID_HINT,
  NICKNAME_HINT,
  PASSWORD_HINT,
} from '../../hooks/auth/validators';

type IdCheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
type NicknameCheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function SignUpScreen({
  onBack,
  onSignedUp,
}: {
  onBack: () => void;
  onSignedUp: () => void;
}) {
  const [loginId, setLoginId] = useState('');
  const [idCheck, setIdCheck] = useState<IdCheckState>('idle');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameCheck, setNicknameCheck] = useState<NicknameCheckState>('idle');
  const [agreeRequired1, setAgreeRequired1] = useState(false);
  const [agreeRequired2, setAgreeRequired2] = useState(false);
  const [agreeOptional, setAgreeOptional] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordInvalid = password.length > 0 && !isValidPassword(password);
  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const nicknameInvalid = nickname.length > 0 && !isValidNickname(nickname);
  const canSubmit =
    idCheck === 'available' &&
    isValidPassword(password) &&
    !passwordMismatch &&
    nicknameCheck === 'available' &&
    agreeRequired1 &&
    agreeRequired2;

  const handleCheckId = async () => {
    if (!loginId) return;
    if (!isValidLoginId(loginId)) {
      setIdCheck('invalid');
      return;
    }
    setIdCheck('checking');
    setError('');
    try {
      await authApi.checkId(loginId);
      setIdCheck('available');
    } catch (e) {
      if (e instanceof authApi.ApiError && e.status === 409) {
        setIdCheck('taken');
      } else {
        setIdCheck('idle');
        setError(e instanceof Error ? e.message : '아이디 확인에 실패했어요');
      }
    }
  };

  const handleCheckNickname = async () => {
    if (!nickname) return;
    if (!isValidNickname(nickname)) {
      setNicknameCheck('invalid');
      return;
    }
    setNicknameCheck('checking');
    setError('');
    try {
      await authApi.checkNickname(nickname);
      setNicknameCheck('available');
    } catch (e) {
      if (e instanceof authApi.ApiError && e.status === 409) {
        setNicknameCheck('taken');
      } else {
        setNicknameCheck('idle');
        setError(e instanceof Error ? e.message : '닉네임 확인에 실패했어요');
      }
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.signUp({
        login_id: loginId,
        password,
        password_confirm: passwordConfirm,
        nickname,
      });
      onSignedUp();
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원가입에 실패했습니다.');
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
        <Text style={styles.navBarTitle}>회원가입</Text>
        <View style={styles.navBarSide} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View>
          <Label>아이디</Label>
          <View style={styles.idRow}>
            <View style={styles.idInput}>
              <Field
                placeholder={LOGIN_ID_HINT}
                value={loginId}
                autoCapitalize="none"
                onChangeText={(v) => {
                  setLoginId(v);
                  setIdCheck('idle');
                }}
              />
            </View>
            <TouchableOpacity style={styles.checkBtn} onPress={handleCheckId}>
              <Text style={styles.checkBtnText}>중복확인</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>{LOGIN_ID_HINT}</Text>
          {idCheck === 'available' && (
            <View style={styles.inlineMsg}>
              <Check size={11} color={colors.success} />
              <Text style={styles.successText}>사용 가능한 아이디입니다.</Text>
            </View>
          )}
          {idCheck === 'taken' && (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>이미 사용 중인 아이디입니다.</Text>
            </View>
          )}
          {idCheck === 'invalid' && (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>아이디 형식이 올바르지 않습니다. ({LOGIN_ID_HINT})</Text>
            </View>
          )}
        </View>

        <View>
          <Label>비밀번호</Label>
          <Field
            placeholder={PASSWORD_HINT}
            value={password}
            onChangeText={setPassword}
            secureToggle
            autoCapitalize="none"
          />
          <Text style={styles.hintText}>{PASSWORD_HINT}</Text>
          {passwordInvalid && (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>비밀번호 형식이 올바르지 않습니다.</Text>
            </View>
          )}
        </View>

        <View>
          <Label>비밀번호 확인</Label>
          <Field
            placeholder="비밀번호를 다시 입력하세요"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureToggle
            autoCapitalize="none"
          />
          {passwordMismatch && (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
            </View>
          )}
        </View>

        <View>
          <Label>닉네임</Label>
          <View style={styles.idRow}>
            <View style={styles.idInput}>
              <Field
                placeholder={NICKNAME_HINT}
                value={nickname}
                onChangeText={(v) => {
                  setNickname(v);
                  setNicknameCheck('idle');
                }}
              />
            </View>
            <TouchableOpacity style={styles.checkBtn} onPress={handleCheckNickname}>
              <Text style={styles.checkBtnText}>중복확인</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>{NICKNAME_HINT}</Text>
          {nicknameInvalid && (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>닉네임은 2~8자로 입력해주세요.</Text>
            </View>
          )}
          {nicknameCheck === 'available' && (
            <View style={styles.inlineMsg}>
              <Check size={11} color={colors.success} />
              <Text style={styles.successText}>사용 가능한 닉네임입니다.</Text>
            </View>
          )}
          {nicknameCheck === 'taken' && (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>이미 사용 중인 닉네임입니다.</Text>
            </View>
          )}
          {nicknameCheck === 'invalid' && (
            <View style={styles.inlineMsg}>
              <X size={11} color={colors.danger} />
              <Text style={styles.errorText}>닉네임은 2~8자로 입력해주세요.</Text>
            </View>
          )}
        </View>

        <View style={styles.agreements}>
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => setAgreeRequired1((v) => !v)}
          >
            <View style={[styles.checkbox, agreeRequired1 && styles.checkboxChecked]}>
              {agreeRequired1 && <Check size={10} color="#fff" />}
            </View>
            <Text style={styles.agreementText}>
              <Text style={styles.required}>[필수] </Text>
              서비스 이용약관 동의
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => setAgreeRequired2((v) => !v)}
          >
            <View style={[styles.checkbox, agreeRequired2 && styles.checkboxChecked]}>
              {agreeRequired2 && <Check size={10} color="#fff" />}
            </View>
            <Text style={styles.agreementText}>
              <Text style={styles.required}>[필수] </Text>
              개인정보 수집·이용 동의
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => setAgreeOptional((v) => !v)}
          >
            <View style={[styles.checkbox, agreeOptional && styles.checkboxChecked]}>
              {agreeOptional && <Check size={10} color="#fff" />}
            </View>
            <Text style={styles.agreementText}>마케팅 정보 수신 동의 (선택)</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryBtn onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          가입 완료
        </PrimaryBtn>
      </ScrollView>
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
  idRow: {
    flexDirection: 'row',
    gap: 8,
  },
  idInput: {
    flex: 1,
  },
  checkBtn: {
    backgroundColor: colors.deepGreen,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  checkBtnText: {
    color: colors.beigeLight,
    fontSize: 12,
    fontWeight: '500',
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
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  agreements: {
    gap: 10,
    paddingTop: 4,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  agreementText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  required: {
    color: '#8B5E3C',
  },
});
