import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { addDocument } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../src/constants/mockData';

const ROLE_LABELS: Record<string, string> = {
  '': 'Semua Warga Sekolah', STUDENT: 'Siswa', TEACHER: 'Guru Mapel',
  WALI: 'Wali Kelas', BK: 'Guru BK',
};
const ROLES = Object.keys(ROLE_LABELS);

export default function BroadcastScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [targetRole, setTarget] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending]   = useState(false);
  const [history, setHistory]   = useState<any[]>([]);

  const handleBroadcast = () => {
    if (!title.trim()) return Alert.alert('Judul wajib diisi');
    if (!body.trim())  return Alert.alert('Isi pengumuman wajib diisi');

    Alert.alert(
      isUrgent ? 'Kirim Darurat?' : 'Konfirmasi',
      `Kepada: ${ROLE_LABELS[targetRole]}\n\n"${title}"`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim', style: isUrgent ? 'destructive' : 'default',
          onPress: async () => {
            setSending(true);
            try {
              if (!USE_MOCK) {
                const data: any = {
                  title: title.trim(), body: body.trim(),
                  createdBy: profile!.uid, isUrgent, createdAt: Timestamp.now(),
                };
                if (targetRole) data.targetRole = targetRole;
                await addDocument('announcements', data);
              }
              setHistory(h => [{ title, body, isUrgent, targetRole, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }, ...h]);
              // Trigger FCM local notification
              const { notifyBroadcast } = await import('../../src/services/fcm.service');
              await notifyBroadcast(title.trim(), body.trim(), isUrgent);
              Alert.alert('Berhasil', 'Pengumuman berhasil dikirim!');
              setTitle(''); setBody(''); setIsUrgent(false); setTarget('');
            } catch (e: any) { Alert.alert('Error', e.message); }
            finally { setSending(false); }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Siaran Pengumuman</Text>

      {/* Urgent toggle */}
      <TouchableOpacity
        style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}
        onPress={() => setIsUrgent(v => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.urgentIcon, isUrgent && styles.urgentIconActive]}>
          <Ionicons name={isUrgent ? 'alert-circle' : 'notifications-outline'} size={22} color={isUrgent ? Colors.white : Colors.gray5} />
        </View>
        <View>
          <Text style={[styles.urgentLabel, isUrgent && styles.urgentLabelActive]}>
            {isUrgent ? 'Mode Darurat Aktif' : 'Pengumuman Biasa'}
          </Text>
          <Text style={styles.urgentSub}>
            {isUrgent ? 'Prioritas tinggi ke semua pengguna' : 'Tap untuk aktifkan mode darurat'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Target */}
      <Text style={styles.label}>Kirim Kepada</Text>
      <View style={styles.chipRow}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, targetRole === r && styles.chipActive]}
            onPress={() => setTarget(r)}
          >
            <Text style={[styles.chipText, targetRole === r && styles.chipTextActive]}>
              {ROLE_LABELS[r]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Judul</Text>
      <TextInput
        style={styles.input} value={title} onChangeText={setTitle}
        placeholder="Contoh: Libur Nasional" placeholderTextColor={Colors.gray7}
      />

      {/* Body */}
      <Text style={styles.label}>Isi Pengumuman</Text>
      <TextInput
        style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
        value={body} onChangeText={setBody} multiline
        placeholder="Tulis isi pengumuman..." placeholderTextColor={Colors.gray7}
      />

      <Button
        title={isUrgent ? 'Kirim Darurat' : 'Kirim Pengumuman'}
        onPress={handleBroadcast}
        loading={sending}
        fullWidth
        style={{ marginTop: Spacing.xl }}
      />

      {/* History */}
      {history.length > 0 && (
        <>
          <Text style={[styles.label, { marginTop: Spacing.xxl }]}>Terkirim Hari Ini</Text>
          {history.map((h, i) => (
            <View key={i} style={[styles.histCard, h.isUrgent && styles.histCardUrgent]}>
              <View style={styles.histTop}>
                {h.isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>DARURAT</Text>
                  </View>
                )}
                <Text style={styles.histTime}>{h.time}</Text>
              </View>
              <Text style={styles.histTitle}>{h.title}</Text>
              <Text style={styles.histBody} numberOfLines={1}>{h.body}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.base },
  pageTitle: { ...Typography.title2, color: Colors.black, marginBottom: Spacing.xl },
  urgentToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.base,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, marginBottom: Spacing.base,
    borderWidth: 1.5, borderColor: Colors.separator, ...Shadow.xs,
  },
  urgentToggleActive: { borderColor: Colors.gray2, backgroundColor: Colors.gray11 },
  urgentIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
  },
  urgentIconActive: { backgroundColor: Colors.black },
  urgentLabel: { ...Typography.subheadline, color: Colors.secondaryLabel, fontWeight: '600' },
  urgentLabelActive: { color: Colors.black },
  urgentSub: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  label: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: Spacing.base },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { ...Typography.footnote, color: Colors.secondaryLabel },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  input: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  histCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md, padding: Spacing.base,
    borderLeftWidth: 3, borderLeftColor: Colors.separator, marginBottom: 8,
  },
  histCardUrgent: { borderLeftColor: Colors.gray2 },
  histTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  urgentBadge: { backgroundColor: Colors.gray2, borderRadius: Radius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  urgentBadgeText: { ...Typography.caption2, color: Colors.white, fontWeight: '800', letterSpacing: 0.5 },
  histTime: { ...Typography.caption2, color: Colors.tertiaryLabel },
  histTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  histBody: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
});
