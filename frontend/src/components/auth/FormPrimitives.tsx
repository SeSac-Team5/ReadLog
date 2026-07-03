import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../constants/theme';

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({
  secureToggle,
  style,
  ...inputProps
}: TextInputProps & { secureToggle?: boolean }) {
  const [hidden, setHidden] = useState(!!secureToggle);
  return (
    <View style={styles.fieldWrap}>
      <TextInput
        {...inputProps}
        secureTextEntry={secureToggle ? hidden : inputProps.secureTextEntry}
        placeholderTextColor={colors.textMuted}
        style={[styles.field, secureToggle && styles.fieldWithIcon, style]}
      />
      {secureToggle && (
        <TouchableOpacity
          style={styles.fieldIcon}
          onPress={() => setHidden((v) => !v)}
          accessibilityLabel={hidden ? '비밀번호 표시' : '비밀번호 숨기기'}
        >
          {hidden ? (
            <Eye size={16} color={colors.textMuted} />
          ) : (
            <EyeOff size={16} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export function PrimaryBtn({
  children,
  onPress,
  disabled,
  loading,
  danger,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.primaryBtn,
        danger && styles.primaryBtnDanger,
        (disabled || loading) && styles.primaryBtnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.beigeLight} />
      ) : (
        <Text style={styles.primaryBtnText}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A7060',
    marginBottom: 6,
  },
  fieldWrap: {
    position: 'relative',
  },
  field: {
    width: '100%',
    backgroundColor: colors.beigeDim,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldWithIcon: {
    paddingRight: 40,
  },
  fieldIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.deepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDanger: {
    backgroundColor: colors.danger,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: colors.beigeLight,
    fontSize: 14,
    fontWeight: '500',
  },
});
