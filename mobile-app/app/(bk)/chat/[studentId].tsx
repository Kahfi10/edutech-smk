import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { subscribeCollection, addDocument, getCollection, setDocument, orderBy, where } from '../../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';

export default function BKChatScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [chatRoomId, setChatRoomId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCollection('users', where('role', '==', 'STUDENT'))
      .then(setStudents).finally(() => setLoading(false));
  }, []);

  const openChat = async (student: any) => {
    setSelectedStudent(student);
    const roomId = [profile!.uid, student.uid].sort().join('_bk_');
    setChatRoomId(roomId);
    await setDocument('chats', roomId, {
      participants: [profile!.uid, student.uid],
      type: 'bk_confidential', lastMessage: '',
      updatedAt: Timestamp.now(),
    });
  };

  useEffect(() => {
    if (!chatRoomId) return;
    const unsub = subscribeCollection(
      `chats/${chatRoomId}/messages`,
      (data) => setMessages(data.sort((a: any, b: any) => a.timestamp?.toDate?.() - b.timestamp?.toDate?.())),
      orderBy('timestamp', 'asc'),
    );
    return unsub;
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !chatRoomId) return;
    const text = inputText.trim();
    setInputText('');
    await addDocument(`chats/${chatRoomId}/messages`, {
      senderId: profile!.uid, text, timestamp: Timestamp.now(), readBy: [profile!.uid],
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!selectedStudent) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Chat Konfidensial</Text>
          <Text style={styles.headerSub}>Pilih siswa untuk memulai</Text>
        </View>
        <FlatList
          data={students}
          keyExtractor={i => i.uid}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.studentRow} onPress={() => openChat(item)} activeOpacity={0.7}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentNis}>NIS: {item.nis ?? '-'}</Text>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom + 90}
    >
      {/* Chat header */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => setSelectedStudent(null)} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{selectedStudent.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatName}>{selectedStudent.name}</Text>
          <Text style={styles.chatLabel}>Konfidensial</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: Spacing.base, paddingBottom: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="lock-closed-outline" size={32} color={Colors.gray8} />
            <Text style={styles.emptyChatText}>Percakapan bersifat rahasia</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.senderId === profile?.uid;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                {item.timestamp?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.msgInput}
          value={inputText} onChangeText={setInputText}
          placeholder="Tulis pesan..." placeholderTextColor={Colors.gray7}
          multiline maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && { opacity: 0.35 }]}
          onPress={sendMessage} disabled={!inputText.trim()}
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
    backgroundColor: Colors.gray1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerSub: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.headline, color: Colors.gray3 },
  studentName: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  studentNis: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 1 },
  chatHeader: {
    backgroundColor: Colors.gray1, flexDirection: 'row',
    alignItems: 'center', gap: 10, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md,
  },
  chatAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  chatAvatarText: { ...Typography.subheadline, color: Colors.white, fontWeight: '700' },
  chatName: { ...Typography.headline, color: Colors.white },
  chatLabel: { ...Typography.caption2, color: 'rgba(255,255,255,0.5)' },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: Spacing.md, marginBottom: 6 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.black, borderBottomRightRadius: 4 },
  bubbleThem: {
    alignSelf: 'flex-start', backgroundColor: Colors.cardBackground,
    borderBottomLeftRadius: 4, ...Shadow.sm,
  },
  bubbleText: { ...Typography.body },
  bubbleTextMe: { color: Colors.white },
  bubbleTextThem: { color: Colors.black },
  bubbleTime: { ...Typography.caption2, marginTop: 4, color: Colors.tertiaryLabel, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.5)' },
  emptyChat: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyChatText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
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
});
