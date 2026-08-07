import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { subscribeCollection, getCollection, where, orderBy } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

const MENU_ITEMS = [
  { label: 'Materi',       icon: 'book-outline',         route: '/(student)/materials/all' },
  { label: 'Tugas',        icon: 'document-text-outline', route: '/(student)/assignments'   },
  { label: 'Nilai',        icon: 'star-outline',          route: '/(student)/grades'        },
  { label: 'Absensi',      icon: 'calendar-outline',      route: '/(student)/attendance'    },
  { label: 'Pelanggaran',  icon: 'warning-outline',       route: '/(student)/violations'    },
  { label: 'Konseling BK', icon: 'chatbubbles-outline',   route: '/(student)/bk-booking'    },
] as const;

export default function StudentDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [violationPoints, setViolationPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const unsubAssign = subscribeCollection(
      'assignments',
      (data) => {
        const now = new Date();
        const upcoming = data
          .filter((a: any) => a.classId === profile.classId && a.deadline?.toDate?.() > now)
          .sort((a: any, b: any) => a.deadline?.toDate?.() - b.deadline?.toDate?.())
          .slice(0, 5);
        setAssignments(upcoming);
        setLoading(false);
      },
      where('classId', '==', profile.classId ?? ''),
    );

    const unsubAnn = subscribeCollection(
      'announcements',
      (data) => setAnnouncements(data.slice(0, 3)),
      orderBy('createdAt', 'desc'),
    );

    getCollection('violations', where('studentId', '==', profile.uid)).then(v => {
      const total = (v as any[])
        .filter((x: any) => x.status === 'verified')
        .reduce((sum: number, x: any) => sum + (x.points ?? 0), 0);
      setViolationPoints(total);
    });

    return () => { unsubAssign(); unsubAnn(); };
  }, [profile]);

  const handleLogout = () =>
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logoutUser },
    ]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.greeting}>Selamat datang,</Text>
          <Text style={styles.name}>{profile?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Info strip */}
        <View style={styles.infoStrip}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{profile?.nis ?? '-'}</Text>
            <Text style={styles.infoLabel}>NIS</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{assignments.length}</Text>
            <Text style={styles.infoLabel}>Tugas Aktif</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoItem}>
            <Text style={[styles.infoValue, violationPoints >= 80 && styles.dangerText]}>
              {violationPoints}
            </Text>
            <Text style={styles.infoLabel}>Poin Pelanggar.</Text>
          </View>
        </View>

        {/* Menu grid */}
        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon as any} size={22} color={Colors.black} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming assignments */}
        {assignments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tugas Mendatang</Text>
            <View style={styles.listCard}>
              {assignments.map((a, i) => {
                const daysLeft = Math.ceil(
                  (a.deadline?.toDate?.().getTime() - Date.now()) / (1000 * 3600 * 24),
                );
                const isUrgent = daysLeft <= 2;
                return (
                  <View key={a.id}>
                    <View style={styles.assignRow}>
                      <View style={[styles.urgentDot, isUrgent && styles.urgentDotActive]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.assignTitle} numberOfLines={1}>{a.title}</Text>
                        <Text style={styles.assignSub}>
                          {a.deadline?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          {' · '}
                          <Text style={isUrgent ? styles.urgentText : styles.normalText}>
                            {daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
                          </Text>
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.gray8} />
                    </View>
                    {i < assignments.length - 1 && <View style={styles.rowDivider} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pengumuman</Text>
            <View style={styles.listCard}>
              {announcements.map((a, i) => (
                <View key={a.id}>
                  <View style={styles.annRow}>
                    {a.isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>PENTING</Text>
                      </View>
                    )}
                    <Text style={styles.annTitle} numberOfLines={1}>{a.title}</Text>
                    <Text style={styles.annBody} numberOfLines={2}>{a.body}</Text>
                  </View>
                  {i < announcements.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: { ...Typography.subheadline, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },
  name: { ...Typography.title2, color: Colors.white },
  logoutBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Info strip
  infoStrip: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginTop: -14,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.md,
  },
  infoItem: { flex: 1, alignItems: 'center' },
  infoValue: { ...Typography.title3, color: Colors.black },
  infoLabel: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  infoSep: {
    width: StyleSheet.hairlineWidth,
    height: '100%',
    backgroundColor: Colors.separator,
    marginHorizontal: 4,
  },
  dangerText: { color: Colors.gray1 },

  // Section title
  sectionTitle: {
    ...Typography.footnote,
    color: Colors.tertiaryLabel,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // Menu
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: 10,
  },
  menuItem: {
    width: '30%',
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 8,
    ...Shadow.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  menuIconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: Colors.gray11,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...Typography.caption1, color: Colors.secondaryLabel, fontWeight: '500', textAlign: 'center' },

  // List card
  listCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },

  // Assignment row
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
    gap: 10,
  },
  urgentDot: {
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gray8,
  },
  urgentDotActive: { backgroundColor: Colors.gray2 },
  assignTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  assignSub: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  urgentText: { color: Colors.gray2, fontWeight: '600' },
  normalText: { color: Colors.tertiaryLabel },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: Spacing.base + 17,
  },

  // Announcement
  annRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
    gap: 4,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray1,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  urgentBadgeText: { ...Typography.caption2, color: Colors.white, fontWeight: '700', letterSpacing: 0.4 },
  annTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  annBody: { ...Typography.footnote, color: Colors.secondaryLabel, marginTop: 2 },
});
