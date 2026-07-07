import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Check, User, X } from 'lucide-react-native';
import * as authApi from '../../api/auth/authApi';
import { Field, Label, PrimaryBtn } from '../../components/auth/FormPrimitives';
import { colors } from '../../constants/theme';
import { useAuth } from '../../store/auth/AuthContext';
import { isValidNickname, NICKNAME_HINT } from '../../hooks/auth/validators';

type NicknameCheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function EditProfileScreen({ onBack }: { onBack: () => void }) {
  const { user, refreshMe } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [nicknameCheck, setNicknameCheck] = useState<NicknameCheckState>('idle');
  const [profileImage, setProfileImage] = useState(user?.profile_image ?? null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nicknameInvalid = nickname.length > 0 && !isValidNickname(nickname);
  const nicknameUnchanged = nickname === user?.nickname;
  const nicknameVerified = nicknameUnchanged || nicknameCheck === 'available';
  const imageUnchanged = profileImage === (user?.profile_image ?? null);
  const canSubmit =
    isValidNickname(nickname) && nicknameVerified && (!nicknameUnchanged || !imageUnchanged);

  const handleCheckNickname = async () => {
    if (!nickname || nicknameUnchanged) return;
    if (!isValidNickname(nickname)) {
      setNicknameCheck('invalid');
      return;
    }
    setNicknameCheck('checking');
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

  const handlePickImage = async () => {
    setError('');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('사진 보관함 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await authApi.updateProfile({
        nickname,
        ...(imageUnchanged ? {} : { profile_image: profileImage ?? undefined }),
      });
      await refreshMe();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '프로필 수정에 실패했습니다.');
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
        <Text style={styles.navBarTitle}>프로필 수정</Text>
        <View style={styles.navBarSide} />
      </View>

      <View style={styles.form}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarStack}>
            <View style={styles.avatar}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <User size={36} color={colors.deepGreen} strokeWidth={1.5} />
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickImage}
              accessibilityLabel="사진 변경"
            >
              <Camera size={14} color={colors.beigeLight} />
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>사진 변경</Text>
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
            <TouchableOpacity
              style={[styles.checkBtn, nicknameUnchanged && styles.checkBtnDisabled]}
              onPress={handleCheckNickname}
              disabled={nicknameUnchanged}
            >
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
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryBtn onPress={handleSubmit} disabled={!canSubmit} loading={submitting}>
          저장하기
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
    gap: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  avatarStack: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(45,74,62,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  changePhotoText: {
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
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  successText: {
    fontSize: 12,
    color: colors.success,
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
  checkBtnDisabled: {
    opacity: 0.5,
  },
  checkBtnText: {
    color: colors.beigeLight,
    fontSize: 12,
    fontWeight: '500',
  },
});
