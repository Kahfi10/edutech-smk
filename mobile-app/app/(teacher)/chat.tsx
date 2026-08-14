import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import {
  subscribeCollection, addDocument, getCollection,
  upsertDocument, updateDocument, orderBy, where,
} from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';

export default function TeacherChatScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [students, setStudents]               = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [chatRoomId, setChatRoomId]           = useState('');
  const [messages, setMessages]               = useState<any[]>([]);
  const [inputText, setInputText]             = useState('');
  const [loading, setLoading]                 = useState(true);
  const [sending, setSending]                 = useState(false);
  const [openingChat, setOpeningChat]         = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!profile) return;
    const loadStudents = async () => {
      try {
        // Teacher tidak punya classId — cari via subjects → classIds
        // Fallback: tampilkan semua siswa jika tidak ada subjects
        let classIds: string[] = [];

        if (profile.subjects?.length) {
          const subjects = await getCollection('subjects', where('teacherId', '==', profile.uid));
          classIds = (subjects as any[]).flatMap((s: any) => s.classIds ?? []);
        }

        let students: any[];
        if (classIds.length > 0) {
          // Ambil siswa dari semua kelas yang diajar
          const results = await Promise.all(
            [...new Set(classIds)].map(cid =>
              getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', cid))
            )
          );
          // Flatten + deduplicate by uid
          const seen = new Set<string>();
          students = results.flat().filter((s: any) => {
            if (seen.has(s.uid)) return false;
            seen.add(s.uid);
            return true;
          });
        } else {
          // Fallback: semua siswa
          students = (await getCollection('users', where('role', '==', 'STUDENT'))) as any[];
        }

        setStudents(students);
      } catch (err) {
        console.warn('load students for teacher chat:', err);
        // Fallback terakhir
        const all = await getCollection('users', where('role', '==', 'STUDENT'));
        setStudents(all as any[]);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [profile]);

  const openChat = async (student: any) => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const roomId = [profile!.uid, student.uid].sort().join('_dm_');
      await upsertDocument('chats', roomId, {
        participants: [profile!.uid, student.uid],
        type: 'dm',
        updatedAt: Timestamp.now(),
      });
      setSelectedStudent(student);
      setChatRoomId(roomId);
    } catch (err: any) {
      Alert.alert('Error', `Gagal membuka chat: ${err.message}`);
    } finally {
      setOpeningChat(false);
    }
  };

  useEffect(() => {
    if (!chatRoomId) return;
    const unsub = subscribeCollection(
      `chats/${chatRoomId}/messages`,
      (data) => {
        const sorted = [...data].sort(
          (a: any, b: any) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0)
        );
        setMessages(sorted);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
      },
      orderBy('timestamp', 'asc'),
    );
    return unsub;
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !chatRoomId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await addDocument(`chats/${chatRoomId}/messages`, {
        senderId: profile!.uid,
        text,
        timestamp: Timestamp.now(),
        readBy: [profile!.uid],
      });
      await updateDocument('chats', chatRoomId, {
        lastMessage: text,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      Alert.alert('Gagal kirim', err.message);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // ─── Student list ──────────────────────────────────────────
  if (!selectedStudent) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Chat Siswa</Text>
          <Text style={styles.headerSub}>{students.length} siswa di kelas</Text>
        </View>

        {openingChat && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.black} size="small" />
            <Text style={styles.loadingText}>Membuka chat...</Text>
          </View>
        )}

        <FlatList
          data={students}
          keyExtractor={i => i.uid}
          style={{ flex: 1 }}
          contentContainerStyle={students.length === 0 ? styles.emptyContainer : { paddingVertical: 6 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray8} />
              <Text style={styles.emptyTitle}>Belum ada siswa</Text>
              <Text style={styles.emptySub}>Tidak ada siswa di kelas kamu</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.studentRow}
              onPress={() => openChat(item)}
              activeOpacity={0.75}
              disabled={openingChat}
            >
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

  // ─── Chat room ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => { setSelectedStudent(null); setChatRoomId(''); setMessages([]); }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{selectedStudent.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatName}>{selectedStudent.name}</Text>
          <Text style={styles.chatSub}>Siswa · NIS {selectedStudent.nis ?? '-'}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={i => i.id ?? i.timestamp?.toString()}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && { flex: 1, justifyContent: 'center' as const },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-outline" size={40} color={Colors.gray8} />
            <Text style={styles.emptyChatText}>
              Mulai percakapan dengan {selectedStudent.name}
            </Text>
          </View>
        }
        onContentSizeChange={() => {
          if (messages.length > 0) listRef.current?.scrollToEnd({ animated: false });
        }}
        renderItem={({ item }) => {
          const isMe = item.senderId === profile?.uid;
          return (
            <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {item.text}
                </Text>
              </View>
              <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                {item.timestamp?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          style={styles.msgInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Tulis pesan..."
          placeholderTextColor={Colors.gray7}
          multiline
          maxLength={500}
          returnKeyType="send"
          enablesReturnKeyAutomatically
          onSubmitEditing={Platform.OS !== 'ios' ? sendMessage : undefined}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Ionicons name="send" size={18} color={Colors.white} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.gray1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  headerTitle:     { ...Typography.title3, color: Colors.white },
  headerSub:       { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  loadingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gray11, margin: Spacing.base,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  loadingText:     { ...Typography.footnote, color: Colors.secondaryLabel },
  emptyContainer:  { flex: 1 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    backgroundColor: Colors.cardBackground,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:      { ...Typography.headline, color: Colors.gray3, fontWeight: '600' },
  studentName:     { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  studentNis:      { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 1 },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.gray1,
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.md,
  },
  chatAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatAvatarText:  { ...Typography.subheadline, color: Colors.white, fontWeight: '700' },
  chatName:        { ...Typography.headline, color: Colors.white },
  chatSub:         { ...Typography.caption2, color: 'rgba(255,255,255,0.5)' },
  messageList:     { padding: Spacing.base, paddingBottom: Spacing.sm },
  bubbleWrap:      { marginBottom: 4 },
  bubbleWrapMe:    { alignItems: 'flex-end' },
  bubbleWrapThem:  { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe:        { backgroundColor: Colors.black, borderBottomRightRadius: 4 },
  bubbleThem:      { backgroundColor: Colors.cardBackground, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubbleText:      { ...Typography.body, lineHeight: 22 },
  bubbleTextMe:    { color: Colors.white },
  bubbleTextThem:  { color: Colors.black },
  bubbleTime:      { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 2, marginHorizontal: 4 },
  bubbleTimeMe:    { textAlign: 'right' },
  inputBar: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  msgInput: {
    flex: 1, backgroundColor: Colors.gray11, borderRadius: 22,
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    ...Typography.body, color: Colors.black, maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendBtnDisabled: { opacity: 0.35 },
  empty:           { alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 },
  emptyTitle:      { ...Typography.headline, color: Colors.secondaryLabel },
  emptySub:        { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center' },
  emptyChat:       { alignItems: 'center', gap: 12, paddingVertical: 32 },
  emptyChatText:   { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center' },
});
