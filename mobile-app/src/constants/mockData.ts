/**
 * MOCK DATA — untuk preview UI tanpa Firebase
 *
 * Auto-detect platform:
 * - Web (localhost:8081): Firebase mode — Auth + Firestore nyata
 * - Mobile (Expo Go iOS/Android): Mock mode — UI demo tanpa Firebase
 *
 * Firebase JS SDK tidak kompatibel dengan Expo Go karena bundle RN/web conflict.
 * Untuk mobile production, gunakan EAS Development Build.
 */

import { Platform } from 'react-native';
import { Timestamp } from 'firebase/firestore';

// Web = Firebase aktif | Mobile Expo Go = Mock (tidak ada error auth)
export const USE_MOCK = Platform.OS !== 'web';

const now = Timestamp.now();

export const MOCK_USERS: Record<string, any> = {
  STUDENT: {
    uid: 'mock-student-001',
    name: 'Ahmad Fauzi',
    email: 'siswa1@edutechsmk.sch.id',
    role: 'STUDENT',
    nis: '2024001',
    classId: 'class_xi_rpl_1',
    createdAt: now,
  },
  TEACHER: {
    uid: 'mock-teacher-001',
    name: 'Budi Santoso, S.Kom',
    email: 'guru.mapel@edutechsmk.sch.id',
    role: 'TEACHER',
    nip: '198501012010011001',
    subjects: ['subj_pemweb'],
    createdAt: now,
  },
  WALI: {
    uid: 'mock-wali-001',
    name: 'Siti Rahayu, S.Pd',
    email: 'wali.kelas@edutechsmk.sch.id',
    role: 'WALI',
    nip: '198703152010012002',
    classId: 'class_xi_rpl_1',
    createdAt: now,
  },
  BK: {
    uid: 'mock-bk-001',
    name: 'Dewi Puspita, S.Psi',
    email: 'guru.bk@edutechsmk.sch.id',
    role: 'BK',
    nip: '199002202015012003',
    createdAt: now,
  },
  PIKET: {
    uid: 'mock-piket-001',
    name: 'Rudi Hermawan, S.Pd',
    email: 'guru.piket@edutechsmk.sch.id',
    role: 'PIKET',
    nip: '198806102010011004',
    createdAt: now,
  },
  ADMIN: {
    uid: 'mock-admin-001',
    name: 'Kepala Sekolah',
    email: 'admin@edutechsmk.sch.id',
    role: 'ADMIN',
    nip: '197501012000011005',
    createdAt: now,
  },
};

const deadline7 = new Date();
deadline7.setDate(deadline7.getDate() + 7);
const deadline2 = new Date();
deadline2.setDate(deadline2.getDate() + 2);

export const MOCK_ASSIGNMENTS = [
  {
    id: 'mock-assign-001',
    title: 'Tugas 1 — Buat Halaman Web Profil',
    description: 'Buat halaman web profil pribadi menggunakan HTML dan CSS.',
    subjectId: 'subj_pemweb',
    classId: 'class_xi_rpl_1',
    deadline: Timestamp.fromDate(deadline7),
    maxScore: 100,
    createdBy: 'mock-teacher-001',
    createdAt: now,
  },
  {
    id: 'mock-assign-002',
    title: 'Tugas 2 — ERD Basis Data Sekolah',
    description: 'Rancang Entity Relationship Diagram untuk sistem informasi sekolah.',
    subjectId: 'subj_basis_data',
    classId: 'class_xi_rpl_1',
    deadline: Timestamp.fromDate(deadline2),
    maxScore: 100,
    createdBy: 'mock-teacher-001',
    createdAt: now,
  },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 'mock-ann-001',
    title: 'Libur Semester Genap',
    body: 'Diberitahukan kepada seluruh siswa bahwa libur semester genap akan dimulai tanggal 20 Juni.',
    isUrgent: false,
    createdBy: 'mock-admin-001',
    createdAt: now,
  },
  {
    id: 'mock-ann-002',
    title: 'Jadwal Ujian Tengah Semester',
    body: 'UTS akan dilaksanakan pada tanggal 15-19 Agustus. Harap semua siswa mempersiapkan diri.',
    isUrgent: true,
    createdBy: 'mock-admin-001',
    createdAt: now,
  },
];

export const MOCK_VIOLATIONS = [
  {
    id: 'mock-viol-001',
    studentId: 'mock-student-001',
    points: 10,
    category: 'Terlambat',
    description: 'Terlambat masuk kelas lebih dari 15 menit.',
    reportedBy: 'mock-piket-001',
    reportedByRole: 'PIKET',
    status: 'verified',
    date: now,
  },
];

export const MOCK_ATTENDANCE_SUMMARY = { hadir: 18, izin: 2, sakit: 1, alpha: 0 };
