import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger';
}

export default function PrimaryBtn({ label, onPress, disabled, loading, variant = 'primary' }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, variant === 'danger' && styles.danger, (disabled || loading) && styles.dim]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color={COLORS.beigeLight} />
        : <Text style={styles.text}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52, borderRadius: 12,
    backgroundColor: COLORS.deepGreen,
    justifyContent: 'center', alignItems: 'center',
  },
  danger: { backgroundColor: '#C62828' },
  dim: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: '700', color: COLORS.beigeLight },
});
