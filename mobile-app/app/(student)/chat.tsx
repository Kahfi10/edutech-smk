import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeCollection, addDocument, getCollection, setDocument, where, orderBy } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../src/constants/mockData';

export default function StudentChatScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [teachers, setTeachers]         = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [chatRoomId, setChatRoomId]     = useState('');
  const [messages, setMessages]         = useState<any[]>([]);
  const [inputText, setInputText]       = useState('');
  const [loading, setLoading]           = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getCollection('users', where('role', '==', 'TEACHER'))
      .then(d => setTeachers(d as any[]))
      .finally(() => setLoading(false));
  }, []);

  const openChat = async (teacher: any) => {
    setSelectedTeacher(teacher);
    const roomId = [profile!.uid, teacher.uid].sort().join('_dm_');
    setChatRoomId(roomId);
    if (!USE_MOCK) {
      await setDocument('chats', roomId, {
        participants: [profile!.uid, teacher.uid],
        type: 'dm', lastMessage: '', updatedAt: Timestamp.now(),
      });
    }
  };

  useEffect(() => {
    if (!chatRoomId || USE_MOCK) return;
    const unsub = subscribeCollection(
      `chats/${chatRoomId}/messages`,
      (data) => {
        const sorted = data.sort((a: any, b: any) => a.timestamp?.toDate?.() - b.timestamp?.toDate?.());
        setMessages(sorted);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      },
      orderBy('timestamp', 'asc')
    );
    return unsub;
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !chatRoomId || USE_MOCK) return;
    const text = inputText.trim();
    setInputText('');
    await addDocument(`chats/${chatRoomId}/messages`, {
      senderId: profile!.uid, text,
      timestamp: Timestamp.now(), readBy: [profile!.uid],
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // Teacher list
  if (!selectedTeacher) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Chat Guru</Text>
          <Text style={styles.headerSub}>Pilih guru untuk memulai percakapan</Text>
        </View>
        <FlatList
          data={teachers}
          keyExtractor={i => i.uid}
          contentContainerStyle={{ paddingVertical: 6 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray8} />
              <Text style={styles.emptyTitle}>Belum ada guru</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.teacherRow} onPress={() => openChat(item)} activeOpacity={0.75}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teacherName}>{item.name}</Text>
                <Text style={styles.teacherSub}>Guru Mata Pelajaran</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray8} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 64 }} />
          )}
        />
      </View>
    );
  }

  // Chat room
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom + 60}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }]}>
        <TouchableOpacity onPress={() => setSelectedTeacher(null)} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{selectedTeacher.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{selectedTeacher.name}</Text>
          <Text style={styles.headerSub}>Guru Mata Pelajaran</Text>
        </View>
      </View>

      {USE_MOCK ? (
        <View style={styles.mockNotice}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.gray5} />
          <Text style={styles.mockNoticeText}>Chat tersedia setelah login dengan akun Firebase</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Mulai percakapan dengan {selectedTeacher.name}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === profile?.uid;
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.5)' }]}>
                  {item.timestamp?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 6 }]}>
        <TextInput
          style={styles.msgInput}
          value={inputText} onChangeText={setInputText}
          placeholder="Tulis pesan..." placeholderTextColor={Colors.gray7}
          multiline maxLength={500} returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || USE_MOCK) && { opacity: 0.3 }]}
          onPress={sendMessage}
          disabled={!inputText.trim() || USE_MOCK}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base,
  },
  headerTitle: { ...Typography.headline, color: Colors.white },
  headerSub: { ...Typography.caption1, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  teacherRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { ...Typography.headline, color: Colors.gray3 },
  teacherName:  { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  teacherSub:   { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  chatAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  chatAvatarText: { ...Typography.subheadline, color: Colors.white, fontWeight: '700' },
  mockNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gray11, margin: Spacing.base, borderRadius: Radius.md, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  mockNoticeText: { ...Typography.footnote, color: Colors.secondaryLabel, flex: 1 },
  messageList: { padding: Spacing.base, paddingBottom: 8, flexGrow: 1 },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: Spacing.md, marginBottom: 6 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.black, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: Colors.cardBackground, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubbleText:       { ...Typography.body },
  bubbleTextMe:     { color: Colors.white },
  bubbleTextThem:   { color: Colors.black },
  bubbleTime: { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 3, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row', gap: 8, padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  msgInput: {
    flex: 1, backgroundColor: Colors.gray11, borderRadius: 22,
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    ...Typography.body, color: Colors.black, maxHeight: 100,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center',
  },
  empty:     { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  emptyChat:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyChatText: { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center' },
});
