import React, { useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGroupComments } from '../../hooks/reading-group/useGroups';
import SpoilerComment from '../../components/reading-group/SpoilerComment';
import { useAuth } from '../../store/auth/AuthContext';
import { COLORS } from '../../constants/theme';
import type { GroupComment } from '../../types/reading-group';

type Props = NativeStackScreenProps<any, 'Comments'>;

export default function CommentsScreen({ route }: Props) {
  const { groupId } = route.params as { groupId: number };
  const { comments, post, react } = useGroupComments(groupId);
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [quote, setQuote] = useState('');
  const [sending, setSending] = useState(false);

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
    <View style={styles.container}>
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputArea}>
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
