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

export default function StudentChatScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [teachers, setTeachers]             = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [chatRoomId, setChatRoomId]         = useState('');
  const [messages, setMessages]             = useState<any[]>([]);
  const [inputText, setInputText]           = useState('');
  const [loading, setLoading]               = useState(true);
  const [sending, setSending]               = useState(false);
  const [openingChat, setOpeningChat]       = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getCollection('users', where('role', '==', 'TEACHER'))
      .then(d => setTeachers(d as any[]))
      .catch(err => console.warn('load teachers:', err))
      .finally(() => setLoading(false));
  }, [profile]);

  const openChat = async (teacher: any) => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const roomId = [profile!.uid, teacher.uid].sort().join('_dm_');

      // FIX: Buat/update room DULU sebelum subscribe messages
      // Pakai upsertDocument (merge:true) agar tidak overwrite data existing
      await upsertDocument('chats', roomId, {
        participants: [profile!.uid, teacher.uid],
        type: 'dm',
        updatedAt: Timestamp.now(),
      });

      // Baru set state setelah room sudah ada di Firestore
      setSelectedTeacher(teacher);
      setChatRoomId(roomId);
    } catch (err: any) {
      Alert.alert('Error', `Gagal membuka chat: ${err.message}`);
    } finally {
      setOpeningChat(false);
    }
  };

  // Subscribe messages setelah chatRoomId tersedia (room sudah pasti ada)
  useEffect(() => {
    if (!chatRoomId) return;
    const unsub = subscribeCollection(
      `chats/${chatRoomId}/messages`,
      (data) => {
        const sorted = [...data].sort(
          (a: any, b: any) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0)
        );
        setMessages(sorted);
        // Scroll ke bawah saat ada pesan baru
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
      // Kirim pesan ke subcollection
      await addDocument(`chats/${chatRoomId}/messages`, {
        senderId: profile!.uid,
        text,
        timestamp: Timestamp.now(),
        readBy: [profile!.uid],
      });
      // Update lastMessage di chat room
      await updateDocument('chats', chatRoomId, {
        lastMessage: text,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      Alert.alert('Gagal kirim', err.message);
      setInputText(text); // kembalikan teks
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // ─── Teacher list ──────────────────────────────────────────
  if (!selectedTeacher) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Chat Guru</Text>
          <Text style={styles.headerSub}>Pilih guru untuk mulai percakapan</Text>
        </View>

        {openingChat && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.black} />
            <Text style={styles.loadingText}>Membuka chat...</Text>
          </View>
        )}

        <FlatList
          data={teachers}
          keyExtractor={i => i.uid}
          style={{ flex: 1 }}
          contentContainerStyle={teachers.length === 0 ? styles.emptyContainer : { paddingVertical: 6 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray8} />
              <Text style={styles.emptyTitle}>Belum ada guru tersedia</Text>
              <Text style={styles.emptySub}>Guru Mapel belum terdaftar di sistem</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.teacherRow}
              onPress={() => openChat(item)}
              activeOpacity={0.75}
              disabled={openingChat}
            >
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

  // ─── Chat room ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Chat header */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => { setSelectedTeacher(null); setChatRoomId(''); setMessages([]); }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{selectedTeacher.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatName}>{selectedTeacher.name}</Text>
          <Text style={styles.chatSub}>Guru Mata Pelajaran</Text>
        </View>
      </View>

      {/* Messages */}
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
              Mulai percakapan dengan {selectedTeacher.name}
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

      {/* Input bar */}
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
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerTitle:     { ...Typography.title3, color: Colors.white },
  headerSub:       { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  loadingOverlay: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gray11, margin: Spacing.base,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  loadingText:     { ...Typography.footnote, color: Colors.secondaryLabel },
  emptyContainer:  { flex: 1 },
  teacherRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    backgroundColor: Colors.cardBackground,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:      { ...Typography.headline, color: Colors.gray3, fontWeight: '600' },
  teacherName:     { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  teacherSub:      { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.black,
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
