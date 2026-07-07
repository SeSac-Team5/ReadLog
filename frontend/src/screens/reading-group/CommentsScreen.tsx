import React, { useState } from 'react';
import {
  FlatList, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useGroupComments } from '../../hooks/reading-group/useGroups';
import SpoilerComment from '../../components/reading-group/SpoilerComment';
import NavBar from '../../components/common/NavBar';
import { useAuth } from '../../store/auth/AuthContext';
import { COLORS } from '../../constants/theme';
import type { GroupComment } from '../../types/reading-group';

type Props = NativeStackScreenProps<any, 'Comments'>;

export default function CommentsScreen({ navigation, route }: Props) {
  const { groupId } = route.params as { groupId: number };
  const { comments, post, react } = useGroupComments(groupId);
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [quote, setQuote] = useState('');
  const [sending, setSending] = useState(false);

  const insets = useSafeAreaInsets();

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    try {
      await post({ content: content.trim(), is_spoiler: isSpoiler, quote: quote || undefined });
      setContent('');
      setQuote('');
      setIsSpoiler(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.screen}>
      <NavBar title="공유 책 댓글" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        // 이 라이브러리는 KeyboardAvoidingView 자신의 위치를 onLayout(부모 기준
        // 상대좌표)으로 직접 측정한다. NavBar가 이제 같은 트리의 형제 요소라
        // 그 상대좌표에 NavBar 높이가 이미 포함돼 있으므로, 여기서 오프셋을
        // 추가로 더하면 두 번 겹쳐 적용돼 입력창이 키보드 위로 너무 많이
        // 밀려 올라간다(이전엔 네이티브 헤더가 트리 밖에 있어 0으로 측정됐던
        // 것과 다름). iOS는 0으로 두고 라이브러리의 자체 측정에 맡긴다.
        keyboardVerticalOffset={Platform.OS === 'android' ? insets.bottom : 0}
      >
        <FlatList
          style={styles.list_container}
          data={comments}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }: { item: GroupComment }) => (
            <SpoilerComment
              comment={item}
              onReact={emoji => react(item.id, emoji)}
              currentUserId={user?.id}
            />
          )}
        />
        <View style={[styles.inputArea, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.inputInner}>
            <TextInput
              style={styles.textInput}
              placeholder="댓글 입력..."
              placeholderTextColor="#9E9E8A"
              value={content}
              onChangeText={setContent}
              multiline
            />
            <View style={styles.inputActions}>
              <TouchableOpacity onPress={() => setIsSpoiler(!isSpoiler)}>
                <Text style={[styles.actionText, isSpoiler && { color: COLORS.deepGreen }]}>
                  ⚠ 스포일러{isSpoiler ? ' ON' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.actionText}>원문 인용</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!content.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!content.trim() || sending}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.beigeDark },
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  list_container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: COLORS.beigeLight,
  },
  inputInner: {
    flex: 1,
    backgroundColor: 'rgba(237,231,216,0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  textInput: {
    fontSize: 14, color: '#1C1A16',
    maxHeight: 80, paddingVertical: 0,
  },
  inputActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  actionText: { fontSize: 10, color: '#9E9E8A' },
  sendBtn: {
    width: 36, height: 36,
    backgroundColor: COLORS.deepGreen,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, color: COLORS.beigeLight, fontWeight: '700' },
});
