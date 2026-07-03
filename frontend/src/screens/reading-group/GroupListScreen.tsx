import React from 'react';
import {
  FlatList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMyGroups } from '../../hooks/reading-group/useGroups';
import { COLORS } from '../../constants/theme';
import NavBar from '../../components/common/NavBar';
import type { ReadingGroup } from '../../types/reading-group';

type Props = NativeStackScreenProps<any, 'GroupList'>;

export default function GroupListScreen({ navigation }: Props) {
  const { groups, loading, refresh } = useMyGroups();

  function renderItem({ item }: { item: ReadingGroup }) {
    const daysLeft = item.end_date
      ? Math.ceil((new Date(item.end_date).getTime() - Date.now()) / 86_400_000)
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('GroupHome', { groupId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[styles.badge, item.is_public ? styles.badgePublic : styles.badgePrivate]}>
              <Text style={[styles.badgeText, item.is_public ? styles.badgeTextPublic : styles.badgeTextPrivate]}>
                {item.is_public ? '공개' : '비공개'}
              </Text>
            </View>
            {daysLeft !== null && (
              <Text style={styles.daysLeft}>D{daysLeft >= 0 ? `-${daysLeft}` : `+${Math.abs(daysLeft)}`}</Text>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.memberCount}>{item.member_count}/{item.max_member}명</Text>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <NavBar
        title="독서모임"
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')}>
            <Text style={styles.navPlus}>+</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={groups}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refresh}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => navigation.navigate('JoinGroup')}
          >
            <Text style={styles.joinBtnText}>초대 코드로 참가하기</Text>
          </TouchableOpacity>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  groupName: { fontSize: 14, fontWeight: '600', color: '#1C1A16' },
  groupDesc: { fontSize: 12, color: '#9E9E8A', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgePublic: { backgroundColor: '#DCFCE7' },
  badgePrivate: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 10 },
  badgeTextPublic: { color: '#15803D' },
  badgeTextPrivate: { color: '#4B5563' },
  daysLeft: { fontSize: 10, color: '#9E9E8A' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  memberCount: { fontSize: 12, color: '#9E9E8A' },
  progressBg: { height: 6, backgroundColor: COLORS.beigeDark, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: COLORS.deepGreen, borderRadius: 3 },
  joinBtn: {
    marginTop: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#DDD7CB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinBtnText: { fontSize: 14, color: '#9E9E8A' },
  navPlus: { fontSize: 24, color: COLORS.deepGreen, lineHeight: 28 },
});
