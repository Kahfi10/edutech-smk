import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { getCollection, subscribeCollection } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { StatCard } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function PiketDashboard() {
  const { profile } = useAuth();
  const [todayLog, setTodayLog] = useState<any>(null);
  const [stats, setStats] = useState({ terlambat: 0, izin_pulang: 0, kejadian: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const unsub = subscribeCollection(
      'piket_logs',
      (data) => {
        const todayData = data.find((l: any) => l.date === today && l.piketTeacherId === profile?.uid);
        setTodayLog(todayData);
        if (todayData?.events) {
          const s = { terlambat: 0, izin_pulang: 0, kejadian: 0 };
          todayData.events.forEach((e: any) => { if (e.type in s) s[e.type as keyof typeof s]++; });
          setStats(s);
        } else {
          setStats({ terlambat: 0, izin_pulang: 0, kejadian: 0 });
        }
        setLoading(false);
      }
    );
    return unsub;
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Guru Piket</Text>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Keluar', 'Yakin?', [{ text: 'Batal' }, { text: 'Keluar', onPress: logoutUser }])}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Rekap Hari Ini</Text>
      <View style={styles.statsRow}>
        <StatCard label="Terlambat" value={stats.terlambat} color="#D97706" />
        <StatCard label="Izin Pulang" value={stats.izin_pulang} color="#4F46E5" />
        <StatCard label="Kejadian" value={stats.kejadian} color="#DC2626" />
      </View>

      <Text style={styles.sectionTitle}>Log Kejadian Hari Ini</Text>
      {!todayLog || todayLog.events?.length === 0 ? (
        <Card><Text style={styles.empty}>Belum ada kejadian hari ini</Text></Card>
      ) : (
        todayLog.events.slice(0, 10).map((e: any, i: number) => (
          <View key={i} style={styles.eventRow}>
            <View style={styles.eventTime}>
              <Text style={styles.timeText}>{e.time}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventType}>{e.type.replace('_', ' ').toUpperCase()}</Text>
              <Text style={styles.eventDesc}>{e.description}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, marginBottom: 16 },
  greeting: { fontSize: 12, color: '#DDD6FE' },
  name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  dateText: { fontSize: 11, color: '#DDD6FE', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginVertical: 10 },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 4 },
  eventRow: { flexDirection: 'row', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  eventTime: { width: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE9FE', borderRadius: 6 },
  timeText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  eventType: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  eventDesc: { fontSize: 12, color: '#64748B', marginTop: 1 },
  empty: { color: '#94A3B8', textAlign: 'center', padding: 8 },
});
