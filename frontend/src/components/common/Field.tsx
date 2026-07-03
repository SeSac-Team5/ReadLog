import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Field({ label, error, style, ...rest }: Props) {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={COLORS.textMuted}
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.beigeDark, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: COLORS.textPrimary,
  },
  inputError: { borderColor: '#C62828' },
  errorText: { fontSize: 12, color: '#C62828', marginTop: 4 },
});
