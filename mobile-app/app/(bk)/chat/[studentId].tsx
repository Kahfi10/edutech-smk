import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { subscribeCollection, addDocument, getCollection, setDocument, where, orderBy } from '../../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Timestamp } from 'firebase/firestore';

export default function BKChatScreen() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [chatRoomId, setChatRoomId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getCollection('users', where('role', '==', 'STUDENT'))
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  const openChat = async (student: any) => {
    setSelectedStudent(student);
    const roomId = [profile!.uid, student.uid].sort().join('_bk_');
    setChatRoomId(roomId);

    // Buat chat room jika belum ada
    await setDocument('chats', roomId, {
      participants: [profile!.uid, student.uid],
      type: 'bk_confidential',
      lastMessage: '',
      updatedAt: Timestamp.now(),
    });
  };

  useEffect(() => {
    if (!chatRoomId) return;
    const unsub = subscribeCollection(
      `chats/${chatRoomId}/messages`,
      (data) => {
        setMessages(data.sort((a: any, b: any) => a.timestamp?.toDate?.() - b.timestamp?.toDate?.()));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      },
      orderBy('timestamp', 'asc')
    );
    return unsub;
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !chatRoomId) return;
    const text = inputText.trim();
    setInputText('');
    await addDocument(`chats/${chatRoomId}/messages`, {
      senderId: profile!.uid,
      text,
      timestamp: Timestamp.now(),
      readBy: [profile!.uid],
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // Student list
  if (!selectedStudent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}> Chat Konfidensial BK</Text>
          <Text style={styles.headerSub}>Pilih siswa untuk memulai chat rahasia</Text>
        </View>
        <FlatList
          data={students}
          keyExtractor={i => i.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada siswa</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.studentCard} onPress={() => openChat(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentNis}>NIS: {item.nis ?? '-'}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
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
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{selectedStudent.name[0]}</Text>
        </View>
        <View>
          <Text style={styles.chatName}>{selectedStudent.name}</Text>
          <Text style={styles.confidentialLabel}> Chat Konfidensial</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const isMe = item.senderId === profile?.uid;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : {}]}>
                {item.timestamp?.toDate?.().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.messageInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Tulis pesan rahasia..."
          placeholderTextColor="#94A3B8"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendBtnText}>Kirim</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#DC2626', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#FCA5A5', marginTop: 2 },
  list: { padding: 16 },
  studentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  studentNis: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  arrow: { fontSize: 18, color: '#CBD5E1' },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#DC2626', padding: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '700' },
  chatName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  confidentialLabel: { fontSize: 11, color: '#FCA5A5', marginTop: 1 },
  messageList: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 10, marginBottom: 6 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#DC2626', borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#FFFFFF' },
  bubbleTextThem: { color: '#1E293B' },
  bubbleTime: { fontSize: 10, marginTop: 3, color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row', gap: 8, padding: 10,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  messageInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#1E293B',
    backgroundColor: '#F8FAFC', maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#DC2626', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
});
