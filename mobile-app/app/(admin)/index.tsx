import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { AppLogo } from '../../src/components/shared/AppLogo';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function AdminScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logoutUser },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <AppLogo size={60} />
        <Text style={styles.appName}>EduTech SMK</Text>
        <Text style={styles.role}>Admin Portal</Text>
      </View>

      {/* Info */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="desktop-outline" size={28} color={Colors.gray3} />
          </View>
          <Text style={styles.cardTitle}>Akses via Web Browser</Text>
          <Text style={styles.cardDesc}>
            Admin Portal hanya dapat diakses melalui browser di laptop/komputer.
            Buka URL di bawah ini untuk masuk ke dashboard admin.
          </Text>
          <TouchableOpacity
            style={styles.urlBox}
            onPress={() => Linking.openURL('https://edutech-smk.web.app').catch(() => {})}
          >
            <Ionicons name="globe-outline" size={16} color={Colors.gray5} />
            <Text style={styles.urlText}>edutech-smk.web.app</Text>
            <Ionicons name="open-outline" size={14} color={Colors.gray7} />
          </TouchableOpacity>
        </View>

        {/* User info */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{profile?.name?.[0]?.toUpperCase() ?? 'A'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{profile?.name}</Text>
            <Text style={styles.userEmail}>{profile?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>ADMINISTRATOR</Text>
            </View>
          </View>
        </View>

        {/* Features info */}
        <Text style={styles.sectionTitle}>Fitur Admin Portal</Text>
        {[
          { icon: 'people-outline',         label: 'Manajemen User & Role' },
          { icon: 'book-outline',            label: 'Monitor Materi & Tugas' },
          { icon: 'warning-outline',         label: 'Rekap Pelanggaran' },
          { icon: 'calendar-outline',        label: 'Rekap Absensi Sekolah' },
          { icon: 'megaphone-outline',       label: 'Pengumuman Global' },
          { icon: 'stats-chart-outline',     label: 'Dashboard Statistik' },
        ].map(f => (
          <View key={f.label} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={18} color={Colors.gray4} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.gray3} />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  logoBox: {
    width: 64, height: 64, borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.white },
  appName: { ...Typography.title2, color: Colors.white, marginBottom: 4 },
  role: { ...Typography.footnote, color: 'rgba(255,255,255,0.45)' },
  content: {
    flex: 1, padding: Spacing.base,
  },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg,
    padding: Spacing.xl, marginBottom: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    ...Shadow.sm, alignItems: 'center',
  },
  cardIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.headline, color: Colors.black, marginBottom: 8, textAlign: 'center' },
  cardDesc: {
    ...Typography.subheadline, color: Colors.secondaryLabel,
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing.md,
  },
  urlBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gray11, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  urlText: { ...Typography.subheadline, color: Colors.gray4, fontWeight: '600', flex: 1 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    marginBottom: Spacing.base, ...Shadow.xs,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.gray2, alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { ...Typography.title3, color: Colors.white },
  userName: { ...Typography.headline, color: Colors.black },
  userEmail: { ...Typography.footnote, color: Colors.tertiaryLabel, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.gray11,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  roleBadgeText: { ...Typography.caption2, color: Colors.gray4, fontWeight: '700', letterSpacing: 0.5 },
  sectionTitle: {
    ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  featureIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { ...Typography.subheadline, color: Colors.black },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: Spacing.xl, padding: Spacing.base,
    backgroundColor: Colors.gray11, borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  logoutText: { ...Typography.subheadline, color: Colors.gray3, fontWeight: '600' },
});
