import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Share, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../src/context/AuthContext';
import { hapticLight, hapticSuccess } from '../../src/services/haptics';
import { useToast } from '../../src/context/ToastContext';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function QRCardScreen() {
  const { profile } = useAuth();
  const insets      = useSafeAreaInsets();
  const router      = useRouter();
  const { showToast } = useToast();

  const nis = profile?.nis ?? '';

  const handleShare = async () => {
    hapticLight();
    try {
      await Share.share({
        message: `NIS Saya: ${nis}\nNama: ${profile?.name}\nKelas: ${profile?.classId ?? '-'}`,
        title: 'Kartu Siswa EduTech SMK',
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kartu Siswa</Text>
        <TouchableOpacity onPress={handleShare} hitSlop={8}>
          <Ionicons name="share-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Card */}
        <Animated.View entering={FadeInDown.delay(100).springify().damping(18)} style={styles.card}>
          {/* School header */}
          <View style={styles.cardHeader}>
            <View style={styles.schoolLogo}>
              <Ionicons name="book" size={22} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.schoolName}>EduTech SMK</Text>
              <Text style={styles.schoolSub}>Sistem Informasi Manajemen Sekolah</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* QR Code area */}
          <View style={styles.qrWrap}>
            {nis ? (
              <QRCode
                value={nis}
                size={200}
                color={Colors.black}
                backgroundColor={Colors.white}
                logo={undefined}
                logoBorderRadius={0}
                quietZone={10}
              />
            ) : (
              <View style={styles.qrEmpty}>
                <Ionicons name="alert-circle-outline" size={40} color={Colors.gray7} />
                <Text style={styles.qrEmptyText}>NIS belum terdaftar</Text>
                <Text style={styles.qrEmptySub}>Hubungi admin sekolah</Text>
              </View>
            )}
          </View>

          {/* Student info */}
          <View style={styles.infoSection}>
            <Text style={styles.studentName}>{profile?.name ?? '-'}</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoChip}>
                <Ionicons name="card-outline" size={13} color={Colors.gray5} />
                <Text style={styles.infoChipText}>NIS: {nis || '-'}</Text>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="people-outline" size={13} color={Colors.gray5} />
                <Text style={styles.infoChipText}>{profile?.classId ?? '-'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Instructions */}
        <Animated.View
          entering={FadeInDown.delay(200).springify().damping(18)}
          style={styles.instructionCard}
        >
          <View style={styles.instructionRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>Tunjukkan QR code ini kepada Guru Piket saat absensi</Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>Guru Piket akan men-scan kode untuk mencatat kehadiran kamu</Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>Pastikan layar HP cukup terang agar kode mudah terbaca</Text>
          </View>
        </Animated.View>

        {/* Brightness hint */}
        <Animated.View entering={FadeInDown.delay(300).springify().damping(18)} style={styles.hint}>
          <Ionicons name="sunny-outline" size={16} color={Colors.gray5} />
          <Text style={styles.hintText}>
            Tingkatkan kecerahan layar untuk hasil scan yang optimal
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.white },

  body: {
    flex: 1, paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl, gap: Spacing.md,
  },

  // Card
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.md,
  },
  cardHeader: {
    backgroundColor: Colors.black,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  schoolLogo: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  schoolName:  { fontSize: 15, fontWeight: '700', color: Colors.white },
  schoolSub:   { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },

  qrWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
  },
  qrEmpty: {
    width: 200, height: 200,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gray11, borderRadius: Radius.lg,
    gap: 8,
  },
  qrEmptyText: { fontSize: 14, fontWeight: '500', color: Colors.secondaryLabel },
  qrEmptySub:  { fontSize: 12, color: Colors.tertiaryLabel },

  infoSection: {
    padding: Spacing.base, alignItems: 'center', gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  studentName: { fontSize: 18, fontWeight: '700', color: Colors.black, textAlign: 'center' },
  infoRow:     { flexDirection: 'row', gap: 8 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.gray11, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  infoChipText: { fontSize: 12, fontWeight: '500', color: Colors.gray3 },

  // Instructions
  instructionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg, padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    ...Shadow.xs,
  },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  stepText:    { flex: 1, fontSize: 13, color: Colors.secondaryLabel, lineHeight: 19 },

  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.sm,
  },
  hintText: { flex: 1, fontSize: 12, color: Colors.tertiaryLabel, lineHeight: 17 },
});
