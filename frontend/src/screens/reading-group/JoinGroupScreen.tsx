import React, { useState } from 'react';
import {
  Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as api from '../../api/reading-group';
import { COLORS } from '../../constants/theme';

type Props = NativeStackScreenProps<any, 'JoinGroup'>;

export default function JoinGroupScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!code.trim()) {
      Alert.alert('초대 코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const member = await api.joinGroup(0, code.trim()); // groupId는 서버에서 code로 resolves
      navigation.replace('GroupHome', { groupId: member.group_id });
    } catch (e: any) {
      Alert.alert(e?.response?.data?.detail ?? '유효하지 않은 코드입니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>🔗</Text>
      </View>
      <Text style={styles.title}>모임에 참가하기</Text>
      <Text style={styles.sub}>
        초대 코드 또는 링크를 입력하여{'\n'}독서 모임에 참가하세요.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>초대 코드 / 링크</Text>
        <TextInput
          style={styles.input}
          placeholder="예: RDLG-A7B3 또는 invite 링크"
          placeholderTextColor="#9E9E8A"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
        onPress={handleJoin}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>참가하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.beigeDark,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80, height: 80,
    backgroundColor: 'rgba(45,74,62,0.1)',
    borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 36 },
  title: {
    fontFamily: 'serif',
    fontSize: 20,
    color: '#1C1A16',
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: '#9E9E8A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  field: { width: '100%', gap: 6, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '500', color: '#7A7060' },
  input: {
    width: '100%',
    backgroundColor: COLORS.beigeDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1A16',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.deepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.beigeLight },
});
