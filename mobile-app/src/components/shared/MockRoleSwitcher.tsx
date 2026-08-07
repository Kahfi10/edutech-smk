/**
 * MockRoleSwitcher — hanya muncul saat USE_MOCK = true
 * Panel debug di pojok bawah untuk ganti role tanpa login
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { USE_MOCK } from '../../constants/mockData';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { ROLES } from '../../constants/roles';

const ROLE_ROUTES: Record<string, string> = {
  STUDENT: '/(student)/dashboard',
  TEACHER: '/(teacher)/dashboard',
  WALI:    '/(wali)/dashboard',
  BK:      '/(bk)/dashboard',
  PIKET:   '/(piket)/dashboard',
};

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Siswa',
  TEACHER: 'Guru Mapel',
  WALI:    'Wali Kelas',
  BK:      'Guru BK',
  PIKET:   'Guru Piket',
};

export const MockRoleSwitcher: React.FC = () => {
  const { profile, setMockRole } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!USE_MOCK) return null;

  const switchTo = (role: string) => {
    setMockRole?.(role);
    router.replace(ROLE_ROUTES[role] as any);
    setOpen(false);
  };

  return (
    <>
      {/* Floating badge */}
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Ionicons name="swap-horizontal" size={16} color={Colors.white} />
        <Text style={styles.fabText}>{ROLE_LABELS[profile?.role ?? ''] ?? 'Role'}</Text>
      </TouchableOpacity>

      {/* Modal picker */}
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Preview sebagai</Text>
            <Text style={styles.sheetSub}>Mock Mode — Firebase tidak aktif</Text>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleRow, profile?.role === role && styles.roleRowActive]}
                onPress={() => switchTo(role)}
                activeOpacity={0.7}
              >
                <Text style={[styles.roleLabel, profile?.role === role && styles.roleLabelActive]}>
                  {label}
                </Text>
                {profile?.role === role && (
                  <Ionicons name="checkmark" size={18} color={Colors.black} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.gray2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    ...Shadow.md,
    zIndex: 999,
  },
  fabText: { ...Typography.caption1, color: Colors.white, fontWeight: '700' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  sheetTitle: { ...Typography.title3, color: Colors.black, marginBottom: 4 },
  sheetSub: { ...Typography.footnote, color: Colors.tertiaryLabel, marginBottom: 16 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  roleRowActive: {},
  roleLabel: { ...Typography.body, color: Colors.secondaryLabel },
  roleLabelActive: { color: Colors.black, fontWeight: '600' },
});
