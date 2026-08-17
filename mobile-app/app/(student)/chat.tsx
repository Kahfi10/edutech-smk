import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, SectionList, FlatList, StyleSheet, TouchableOpacity,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Room ID harus konsisten antara BK dan siswa.
 *  BK  ↔ Siswa : separator '_bk_'  (type bk_confidential)
 *  Guru ↔ Siswa : separator '_dm_'  (type dm)
 */
function getRoomId(uidA: string, uidB: string, type: 'dm' | 'bk') {
  const sep = type === 'bk' ? '_bk_' : '_dm_';
  return [uidA, uidB].sort().join(sep);
}

export default function StudentChatScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  // contacts — sections
  const [sections, setSections]               = useState<{ title: string; data: any[] }[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [chatRoomId, setChatRoomId]           = useState('');
  const [messages, setMessages]               = useState<any[]>([]);
  const [inputText, setInputText]             = useState('');
  const [loading, setLoading]                 = useState(true);
  const [sending, setSending]                 = useState(false);
  const [openingChat, setOpeningChat]         = useState(false);
  const listRef  = useRef<SectionList>(null);   // contact list
  const flatRef  = useRef<FlatList>(null);       // messages

  // ── Load teachers + BK teachers ──────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getCollection('users', where('role', '==', 'TEACHER')),
      getCollection('users', where('role', '==', 'BK')),
    ])
      .then(([teachers, bkTeachers]) => {
        const built: { title: string; data: any[] }[] = [];
        if ((teachers as any[]).length > 0)
          built.push({ title: 'Guru Mata Pelajaran', data: teachers as any[] });
        if ((bkTeachers as any[]).length > 0)
          built.push({ title: 'Guru BK', data: bkTeachers as any[] });
        setSections(built);
      })
      .catch(err => console.warn('load contacts:', err))
      .finally(() => setLoading(false));
  }, [profile]);

  // ── Open chat ─────────────────────────────────────────────────────────────
  const openChat = async (person: any) => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const isBK = person.role === 'BK';
      const roomId = getRoomId(profile!.uid, person.uid, isBK ? 'bk' : 'dm');

      await upsertDocument('chats', roomId, {
        participants: [profile!.uid, person.uid],
        type: isBK ? 'bk_confidential' : 'dm',
        updatedAt: Timestamp.now(),
      });

      setSelectedContact({ ...person, isBK });
      setChatRoomId(roomId);
    } catch (err: any) {
      Alert.alert('Error', `Gagal membuka chat: ${err.message}`);
    } finally {
      setOpeningChat(false);
    }
  };

  // ── Subscribe messages ────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatRoomId) return;
    const unsub = subscribeCollection(
      `chats/${chatRoomId}/messages`,
      (data) => {
        const sorted = [...data].sort(
          (a: any, b: any) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0)
        );
        setMessages(sorted);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
      },
      orderBy('timestamp', 'asc'),
    );
    return unsub;
  }, [chatRoomId]);

  // ── Send message ──────────────────────────────────────────────────────────
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

  // ── Contact list ──────────────────────────────────────────────────────────
  if (!selectedContact) {
    const isEmpty = sections.every(s => s.data.length === 0) || sections.length === 0;

    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Pesan</Text>
          <Text style={styles.headerSub}>Pilih guru atau guru BK untuk memulai percakapan</Text>
        </View>

        {openingChat && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.black} size="small" />
            <Text style={styles.loadingText}>Membuka chat...</Text>
          </View>
        )}

        {isEmpty ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada kontak tersedia</Text>
          </View>
        ) : (
          <SectionList
            ref={listRef}
            sections={sections}
            keyExtractor={i => i.uid}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.title === 'Guru BK' && (
                  <View style={styles.confidentialBadge}>
                    <Ionicons name="lock-closed" size={10} color={Colors.gray5} />
                    <Text style={styles.confidentialText}>Konfidensial</Text>
                  </View>
                )}
              </View>
            )}
            renderItem={({ item }) => {
              const isBK = item.role === 'BK';
              return (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openChat(item)}
                  activeOpacity={0.75}
                  disabled={openingChat}
                >
                  <View style={[styles.avatar, isBK && styles.avatarBK]}>
                    <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactSub}>
                      {isBK ? 'Guru Bimbingan Konseling' : 'Guru Mata Pelajaran'}
                    </Text>
                  </View>
                  {isBK && (
                    <Ionicons name="lock-closed-outline" size={14} color={Colors.gray7} style={{ marginRight: 4 }} />
                  )}
                  <Ionicons name="chevron-forward" size={18} color={Colors.gray8} />
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={styles.separator} />
            )}
          />
        )}
      </View>
    );
  }

  // ── Chat room ─────────────────────────────────────────────────────────────
  const isBKChat = selectedContact.isBK;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => { setSelectedContact(null); setChatRoomId(''); setMessages([]); }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{selectedContact.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatName}>{selectedContact.name}</Text>
          <Text style={styles.chatSub}>
            {isBKChat ? 'Guru BK · Konfidensial' : 'Guru Mata Pelajaran'}
          </Text>
        </View>
        {isBKChat && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.white} />
          </View>
        )}
      </View>

      {/* Messages — FlatList (bukan SectionList, tidak ada sections di chat) */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={i => i.id ?? String(i.timestamp?.toMillis?.() ?? Math.random())}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && { flex: 1, justifyContent: 'center' as const },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            {isBKChat && <Ionicons name="lock-closed-outline" size={36} color={Colors.gray8} />}
            {!isBKChat && <Ionicons name="chatbubble-outline" size={36} color={Colors.gray8} />}
            <Text style={styles.emptyChatText}>
              {isBKChat
                ? 'Percakapan bersifat rahasia'
                : `Mulai percakapan dengan ${selectedContact.name}`}
            </Text>
            {isBKChat && (
              <Text style={styles.emptyChatSub}>Hanya kamu dan Guru BK yang bisa membaca</Text>
            )}
          </View>
        }
        onContentSizeChange={() => {
          if (messages.length > 0) flatRef.current?.scrollToEnd({ animated: false });
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

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          style={styles.msgInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isBKChat ? 'Tulis pesan rahasia...' : 'Tulis pesan...'}
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

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.base, paddingTop: 18, paddingBottom: 6,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    ...Typography.footnote, color: Colors.secondaryLabel,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  confidentialBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gray10, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  confidentialText: { ...Typography.caption2, color: Colors.gray5 },

  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    backgroundColor: Colors.cardBackground,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarBK: { backgroundColor: Colors.gray8 },
  avatarText:      { ...Typography.headline, color: Colors.gray3, fontWeight: '600' },
  contactName:     { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  contactSub:      { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: 68,
  },

  empty:           { alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 },
  emptyTitle:      { ...Typography.headline, color: Colors.secondaryLabel },

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
  lockBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

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

  emptyChat:       { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyChatText:   { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center' },
  emptyChatSub:    { ...Typography.footnote, color: Colors.quaternaryLabel, textAlign: 'center' },
});
