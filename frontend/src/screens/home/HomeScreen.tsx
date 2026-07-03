import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../store/auth/AuthContext';
import { COLORS } from '../../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        안녕하세요, {user?.nickname ?? '독자'}님
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>메인 홈</Text>
        <Text style={styles.cardSub}>독서 현황 대시보드가 이곳에 표시됩니다</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.beigeLight },
  content: { padding: 24, gap: 20 },
  greeting: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  card: {
    backgroundColor: COLORS.beigeDark, borderRadius: 16,
    padding: 32, alignItems: 'center', gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
