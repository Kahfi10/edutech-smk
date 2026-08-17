import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getCollection } from '../../src/firebase/firestore.service';
import { hapticLight } from '../../src/services/haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function AdminAttendance() {
  const insets = useSafeAreaInsets();
  const [classes, setClasses]         = useState<any[]>([]);
  const [attendance, setAttendance]   = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [cls, att] = await Promise.all([
        getCollection('classes'),
        getCollection('attendance'),
      ]);
      const clsList = cls as any[];
      setClasses(clsList);
      setAttendance(att as any[]);
      if (clsList.length > 0 && !selectedClass) {
        setSelectedClass(clsList[0].id);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  // Filter attendance for selected class
  const classAttendance = attendance
    .filter(a => a.classId === selectedClass)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  // Summary for selected class
  const summary = classAttendance.reduce(
    (acc, a) => {
      (a.records ?? []).forEach((r: any) => {
        acc.hadir   += r.status === 'hadir'  ? 1 : 0;
        acc.sakit   += r.status === 'sakit'  ? 1 : 0;
        acc.izin    += r.status === 'izin'   ? 1 : 0;
        acc.alpha   += r.status === 'alpha'  ? 1 : 0;
      });
      return acc;
    },
    { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
  );

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name ?? '';

  const renderItem = ({ item }: { item: any }) => {
    const records = item.records ?? [];
    const hadir = records.filter((r: any) => r.status === 'hadir').length;
    const sakit = records.filter((r: any) => r.status === 'sakit').length;
    const izin  = records.filter((r: any) => r.status === 'izin').length;
    const alpha = records.filter((r: any) => r.status === 'alpha').length;

    return (
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowDate}>{item.date ?? '-'}</Text>
          <Text style={s.rowSub}>{records.length} siswa</Text>
        </View>
        <View style={s.statRow}>
          <View style={s.statChip}>
            <Text style={s.statNum}>{hadir}</Text>
            <Text style={s.statLbl}>H</Text>
          </View>
          <View style={s.statChip}>
            <Text style={s.statNum}>{sakit}</Text>
            <Text style={s.statLbl}>S</Text>
          </View>
          <View style={s.statChip}>
            <Text style={s.statNum}>{izin}</Text>
            <Text style={s.statLbl}>I</Text>
          </View>
          <View style={[s.statChip, alpha > 0 && s.statChipAlpha]}>
            <Text style={[s.statNum, alpha > 0 && s.statNumAlpha]}>{alpha}</Text>
            <Text style={[s.statLbl, alpha > 0 && s.statNumAlpha]}>A</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Absensi</Text>
        {selectedClassName ? (
          <Text style={s.subtitle}>{selectedClassName}</Text>
        ) : null}
      </View>

      {/* Class selector — wrap grid */}
      <View style={s.classPillSection}>
        <View style={s.classPillRow}>
          {classes.map(cls => (
            <TouchableOpacity
              key={cls.id}
              style={[s.classPill, selectedClass === cls.id && s.classPillActive]}
              onPress={() => { hapticLight(); setSelectedClass(cls.id); }}
            >
              <Text style={[s.classPillText, selectedClass === cls.id && s.classPillTextActive]}>
                {cls.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      {classAttendance.length > 0 && (
        <View style={s.summaryRow}>
          {[
            { label: 'Hadir', value: summary.hadir },
            { label: 'Sakit', value: summary.sakit },
            { label: 'Izin',  value: summary.izin  },
            { label: 'Alpha', value: summary.alpha  },
          ].map(st => (
            <View key={st.label} style={s.summaryCard}>
              <Text style={[s.summaryValue, st.label === 'Alpha' && summary.alpha > 0 && s.alphaText]}>
                {st.value}
              </Text>
              <Text style={s.summaryLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* List */}
      <FlatList
        data={classAttendance}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <View style={s.divider} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gray5} colors={[Colors.black]} />}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.gray8} />
              <Text style={s.emptyText}>Belum ada data absensi</Text>
            </View>
          ) : null
        }
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base,
  },
  title:    { ...Typography.title3, color: Colors.white },
  subtitle: { ...Typography.caption1, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  classPillSection: { backgroundColor: Colors.cardBackground, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator },
  classPillRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  classPill:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator },
  classPillActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  classPillText: { fontSize: 13, fontWeight: '500' as const, color: Colors.secondaryLabel },
  classPillTextActive: { color: Colors.white },
  summaryRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginHorizontal: Spacing.base, marginVertical: Spacing.base,
  },
  summaryCard: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  summaryValue: { ...Typography.title3, color: Colors.black, fontWeight: '700' },
  summaryLabel: { ...Typography.caption2, color: Colors.secondaryLabel, marginTop: 2 },
  alphaText:    { color: Colors.gray1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
  },
  rowDate: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  rowSub:  { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 1 },
  statRow: { flexDirection: 'row', gap: 6 },
  statChip: {
    width: 32, alignItems: 'center', backgroundColor: Colors.gray11,
    borderRadius: 6, paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  statChipAlpha: { backgroundColor: Colors.gray2 },
  statNum: { ...Typography.footnote, color: Colors.black, fontWeight: '700', lineHeight: 16 },
  statNumAlpha: { color: Colors.white },
  statLbl: { ...Typography.caption2, color: Colors.gray6, lineHeight: 13 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },
  empty:   { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
});
