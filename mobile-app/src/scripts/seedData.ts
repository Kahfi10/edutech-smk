/**
 * SEED DATA LENGKAP — EduTech SMK
 * Covers ALL modules: users, classes, subjects, materials, assignments,
 * submissions, attendance, violations, counseling, piket logs, announcements
 *
 * Jalankan: npx ts-node --esm src/scripts/seedData.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, doc, setDoc, collection, addDoc, Timestamp,
  query, where, getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA94eenf8Mu2dYXbDtsAX57206j6MK3ejA",
  authDomain: "edutech-smk.firebaseapp.com",
  projectId: "edutech-smk",
  storageBucket: "edutech-smk.firebasestorage.app",
  messagingSenderId: "1007739019694",
  appId: "1:1007739019694:web:a48af541050df726a6683f",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ─── Helpers ──────────────────────────────────────────────────────
const now = Timestamp.now();
const daysAgo  = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86400000));
const daysFrom = (n: number) => Timestamp.fromDate(new Date(Date.now() + n * 86400000));
const dateStr  = (n: number) => {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().split('T')[0];
};

// ─── User definitions ──────────────────────────────────────────────
const USERS = [
  // Siswa (5 siswa di kelas XI-RPL-1)
  { email: 'siswa1@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Ahmad Fauzi',       role: 'STUDENT', nis: '2024001', classId: 'class_xi_rpl_1' } },
  { email: 'siswa2@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Budi Prasetyo',     role: 'STUDENT', nis: '2024002', classId: 'class_xi_rpl_1' } },
  { email: 'siswa3@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Citra Dewi',        role: 'STUDENT', nis: '2024003', classId: 'class_xi_rpl_1' } },
  { email: 'siswa4@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Doni Setiawan',     role: 'STUDENT', nis: '2024004', classId: 'class_xi_rpl_1' } },
  { email: 'siswa5@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Eka Putri',         role: 'STUDENT', nis: '2024005', classId: 'class_xi_rpl_1' } },
  // Siswa kelas XI-RPL-2
  { email: 'siswa6@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Fajar Nugroho',     role: 'STUDENT', nis: '2024006', classId: 'class_xi_rpl_2' } },
  // Guru
  { email: 'guru.mapel@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Budi Santoso, S.Kom', role: 'TEACHER', nip: '198501012010011001',
      subjects: ['subj_pemweb', 'subj_basis_data'] } },
  { email: 'guru.mapel2@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Rina Marlina, S.T.', role: 'TEACHER', nip: '199001012015011002',
      subjects: ['subj_jaringan'] } },
  // Wali Kelas
  { email: 'wali.kelas@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Siti Rahayu, S.Pd', role: 'WALI', nip: '198703152010012002', classId: 'class_xi_rpl_1' } },
  { email: 'wali.kelas2@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Ahmad Ridwan, S.Pd', role: 'WALI', nip: '198805202011011003', classId: 'class_xi_rpl_2' } },
  // BK, Piket, Admin
  { email: 'guru.bk@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Dewi Puspita, S.Psi', role: 'BK', nip: '199002202015012003' } },
  { email: 'guru.piket@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Rudi Hermawan, S.Pd', role: 'PIKET', nip: '198806102010011004' } },
  { email: 'admin@edutechsmk.sch.id', password: 'password123',
    profile: { name: 'Kepala Sekolah', role: 'ADMIN', nip: '197501012000011005' } },
];

async function seedUsers() {
  console.log('\n--- SEEDING USERS ---');
  const uids: Record<string, string> = {};

  // Ambil semua user yang sudah ada dari Firestore berdasarkan email
  const existingSnap = await getDocs(collection(db, 'users'));
  existingSnap.docs.forEach(d => {
    const data = d.data();
    if (data.email) uids[data.email] = d.id;
  });

  for (const u of USERS) {
    if (uids[u.email]) {
      console.log(`  SKIP ${u.email} (sudah ada, uid: ${uids[u.email].slice(0,8)}...)`);
      continue;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      const uid = cred.user.uid;
      uids[u.email] = uid;
      await setDoc(doc(db, 'users', uid), { ...u.profile, uid, email: u.email, createdAt: now });
      console.log(`  OK  ${u.profile.role.padEnd(7)} ${u.email}`);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`  SKIP ${u.email} (auth sudah ada, cek Firestore)`);
      } else {
        console.error(`  ERR  ${u.email}: ${e.message}`);
      }
    }
  }
  return uids;
}

async function seedClasses(uids: Record<string, string>) {
  console.log('\n--- SEEDING CLASSES ---');

  const s1 = uids['siswa1@edutechsmk.sch.id'];
  const s2 = uids['siswa2@edutechsmk.sch.id'];
  const s3 = uids['siswa3@edutechsmk.sch.id'];
  const s4 = uids['siswa4@edutechsmk.sch.id'];
  const s5 = uids['siswa5@edutechsmk.sch.id'];
  const s6 = uids['siswa6@edutechsmk.sch.id'];
  const wali1 = uids['wali.kelas@edutechsmk.sch.id'];
  const wali2 = uids['wali.kelas2@edutechsmk.sch.id'];

  await setDoc(doc(db, 'classes', 'class_xi_rpl_1'), {
    name: 'XI-RPL-1', waliId: wali1 ?? 'unknown',
    studentIds: [s1, s2, s3, s4, s5].filter(Boolean),
  });
  await setDoc(doc(db, 'classes', 'class_xi_rpl_2'), {
    name: 'XI-RPL-2', waliId: wali2 ?? 'unknown',
    studentIds: [s6].filter(Boolean),
  });
  console.log('  OK  XI-RPL-1, XI-RPL-2');
}

async function seedSubjects(uids: Record<string, string>) {
  console.log('\n--- SEEDING SUBJECTS ---');
  const t1 = uids['guru.mapel@edutechsmk.sch.id'];
  const t2 = uids['guru.mapel2@edutechsmk.sch.id'];

  const subjects = [
    { id: 'subj_pemweb',     name: 'Pemrograman Web',   teacherId: t1, classIds: ['class_xi_rpl_1'] },
    { id: 'subj_basis_data', name: 'Basis Data',         teacherId: t1, classIds: ['class_xi_rpl_1'] },
    { id: 'subj_jaringan',   name: 'Jaringan Komputer',  teacherId: t2, classIds: ['class_xi_rpl_1', 'class_xi_rpl_2'] },
  ];

  for (const s of subjects) {
    await setDoc(doc(db, 'subjects', s.id), s);
    console.log(`  OK  ${s.name}`);
  }
}

async function seedMaterials(uids: Record<string, string>) {
  console.log('\n--- SEEDING MATERIALS ---');
  const t1 = uids['guru.mapel@edutechsmk.sch.id'] ?? 'unknown';
  const t2 = uids['guru.mapel2@edutechsmk.sch.id'] ?? 'unknown';

  const materials = [
    { title: 'Pengenalan HTML5 & CSS3',         type: 'pdf',   subjectId: 'subj_pemweb',     classId: 'class_xi_rpl_1', uploadedBy: t1, fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1', description: 'Dasar-dasar HTML5 dan CSS3 untuk pembuatan halaman web modern' },
    { title: 'JavaScript ES6 Modern',            type: 'pdf',   subjectId: 'subj_pemweb',     classId: 'class_xi_rpl_1', uploadedBy: t1, fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1', description: 'Arrow function, destructuring, promises, dan async/await' },
    { title: 'Tutorial React.js untuk Pemula',  type: 'video', subjectId: 'subj_pemweb',     classId: 'class_xi_rpl_1', uploadedBy: t1, fileUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', description: 'Video tutorial membuat aplikasi React.js dari nol' },
    { title: 'Konsep Dasar Basis Data',          type: 'pdf',   subjectId: 'subj_basis_data', classId: 'class_xi_rpl_1', uploadedBy: t1, fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1', description: 'Entity, atribut, relasi, dan normalisasi database' },
    { title: 'SQL Query Lanjutan',               type: 'pdf',   subjectId: 'subj_basis_data', classId: 'class_xi_rpl_1', uploadedBy: t1, fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1', description: 'JOIN, subquery, stored procedure, dan trigger' },
    { title: 'Pengenalan Jaringan Komputer',     type: 'pdf',   subjectId: 'subj_jaringan',   classId: 'class_xi_rpl_1', uploadedBy: t2, fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1', description: 'Topologi jaringan, protokol TCP/IP, dan OSI layer' },
    { title: 'Konfigurasi Router & Switch',      type: 'video', subjectId: 'subj_jaringan',   classId: 'class_xi_rpl_1', uploadedBy: t2, fileUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', description: 'Praktik konfigurasi Cisco Packet Tracer' },
  ];

  for (const m of materials) {
    await addDoc(collection(db, 'materials'), { ...m, createdAt: daysAgo(Math.floor(Math.random() * 14)) });
    console.log(`  OK  ${m.title}`);
  }
}

async function seedAssignmentsAndSubmissions(uids: Record<string, string>) {
  console.log('\n--- SEEDING ASSIGNMENTS & SUBMISSIONS ---');
  const t1 = uids['guru.mapel@edutechsmk.sch.id'] ?? 'unknown';
  const t2 = uids['guru.mapel2@edutechsmk.sch.id'] ?? 'unknown';
  const s1 = uids['siswa1@edutechsmk.sch.id'] ?? 'unknown';
  const s2 = uids['siswa2@edutechsmk.sch.id'] ?? 'unknown';
  const s3 = uids['siswa3@edutechsmk.sch.id'] ?? 'unknown';
  const s4 = uids['siswa4@edutechsmk.sch.id'] ?? 'unknown';
  const s5 = uids['siswa5@edutechsmk.sch.id'] ?? 'unknown';

  const assignments = [
    // Pemweb
    { title: 'Tugas 1 — Buat Halaman Web Profil', description: 'Buat halaman web profil pribadi menggunakan HTML5 dan CSS3. Gunakan semantic HTML dan responsive design. Upload file HTML.', subjectId: 'subj_pemweb', classId: 'class_xi_rpl_1', deadline: daysAgo(7),  maxScore: 100, createdBy: t1, createdAt: daysAgo(14) },
    { title: 'Tugas 2 — JavaScript DOM Manipulation', description: 'Buat aplikasi To-Do List menggunakan JavaScript vanilla. Fitur: tambah, hapus, tandai selesai tugas.', subjectId: 'subj_pemweb', classId: 'class_xi_rpl_1', deadline: daysAgo(2),  maxScore: 100, createdBy: t1, createdAt: daysAgo(9) },
    { title: 'Tugas 3 — React Component', description: 'Buat komponen React untuk menampilkan kartu produk. Gunakan props, state, dan hooks.', subjectId: 'subj_pemweb', classId: 'class_xi_rpl_1', deadline: daysFrom(5), maxScore: 100, createdBy: t1, createdAt: daysAgo(2) },
    // Basis Data
    { title: 'Tugas 1 — ERD Sistem Perpustakaan', description: 'Rancang Entity Relationship Diagram untuk sistem informasi perpustakaan. Identifikasi entity, atribut, dan relasi.', subjectId: 'subj_basis_data', classId: 'class_xi_rpl_1', deadline: daysAgo(5),  maxScore: 100, createdBy: t1, createdAt: daysAgo(12) },
    { title: 'Tugas 2 — Query SQL Lanjutan', description: 'Kerjakan soal-soal query SQL meliputi: JOIN (INNER, LEFT, RIGHT), subquery, GROUP BY, HAVING.', subjectId: 'subj_basis_data', classId: 'class_xi_rpl_1', deadline: daysFrom(3), maxScore: 100, createdBy: t1, createdAt: daysAgo(4) },
    // Jaringan
    { title: 'Praktik — Konfigurasi VLAN', description: 'Konfigurasi VLAN pada switch menggunakan Cisco Packet Tracer. Buat 3 VLAN untuk departemen yang berbeda.', subjectId: 'subj_jaringan', classId: 'class_xi_rpl_1', deadline: daysFrom(7), maxScore: 100, createdBy: t2, createdAt: daysAgo(1) },
  ];

  const assignIds: string[] = [];
  for (const a of assignments) {
    const ref = await addDoc(collection(db, 'assignments'), a);
    assignIds.push(ref.id);
    console.log(`  OK  Assignment: ${a.title}`);
  }

  // Submissions untuk Tugas 1 Pemweb (semua siswa sudah submit & graded)
  const subs1 = [
    { studentId: s1, score: 92, feedback: 'Desain bagus dan kode rapi. Pertahankan!' },
    { studentId: s2, score: 85, feedback: 'Sudah baik, tambahkan animasi CSS untuk lebih menarik.' },
    { studentId: s3, score: 78, feedback: 'Perlu perbaikan pada bagian responsive design.' },
    { studentId: s4, score: 70, feedback: 'HTML semantic masih kurang tepat. Pelajari lagi.' },
    { studentId: s5, score: 88, feedback: 'Bagus! CSS-nya kreatif.' },
  ];
  for (const sub of subs1) {
    await addDoc(collection(db, 'submissions'), {
      assignmentId: assignIds[0], ...sub, status: 'graded',
      gradedBy: t1, submittedAt: daysAgo(6), fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
    });
  }
  console.log('  OK  Submissions Tugas 1 Pemweb (5 graded)');

  // Submissions Tugas 2 Pemweb (beberapa belum graded)
  const subs2 = [
    { studentId: s1, score: 88, feedback: 'Implementasi event listener sudah benar.' },
    { studentId: s2, score: null, feedback: null },
    { studentId: s3, score: 75, feedback: 'Logika delete masih ada bug kecil.' },
    { studentId: s4, score: null, feedback: null },
    { studentId: s5, score: 90, feedback: 'Fitur lengkap dan kode bersih!' },
  ];
  for (const sub of subs2) {
    await addDoc(collection(db, 'submissions'), {
      assignmentId: assignIds[1], studentId: sub.studentId,
      status: sub.score !== null ? 'graded' : 'submitted',
      score: sub.score, feedback: sub.feedback, gradedBy: sub.score ? t1 : null,
      submittedAt: daysAgo(1), textAnswer: 'File To-Do List sudah saya upload.',
    });
  }
  console.log('  OK  Submissions Tugas 2 Pemweb');

  // Submissions Tugas 1 Basis Data
  const subs3 = [
    { studentId: s1, score: 95, feedback: 'ERD sangat lengkap dan normalisasi tepat!' },
    { studentId: s2, score: 80, feedback: 'Kardinalitas relasi ada yang kurang tepat.' },
    { studentId: s3, score: 72, feedback: 'Perlu ditambah atribut pada beberapa entity.' },
    { studentId: s4, score: 65, feedback: 'Relasi many-to-many masih salah. Konsultasi ya.' },
    { studentId: s5, score: 88, feedback: 'Hampir sempurna, hanya ada 1 relasi yang perlu diperbaiki.' },
  ];
  for (const sub of subs3) {
    await addDoc(collection(db, 'submissions'), {
      assignmentId: assignIds[3], studentId: sub.studentId,
      status: 'graded', score: sub.score, feedback: sub.feedback,
      gradedBy: t1, submittedAt: daysAgo(4),
      fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
    });
  }
  console.log('  OK  Submissions Tugas 1 Basis Data');
}

async function seedAttendance(uids: Record<string, string>) {
  console.log('\n--- SEEDING ATTENDANCE ---');
  const t1 = uids['guru.mapel@edutechsmk.sch.id'] ?? 'unknown';
  const s1 = uids['siswa1@edutechsmk.sch.id'] ?? 'unknown';
  const s2 = uids['siswa2@edutechsmk.sch.id'] ?? 'unknown';
  const s3 = uids['siswa3@edutechsmk.sch.id'] ?? 'unknown';
  const s4 = uids['siswa4@edutechsmk.sch.id'] ?? 'unknown';
  const s5 = uids['siswa5@edutechsmk.sch.id'] ?? 'unknown';

  // 14 hari kebelakang (senin-jumat), 2 mapel per hari
  const attendanceData = [
    // Doni (s4) sering alpha — untuk trigger alert
    { date: dateStr(1),  records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'alpha' }, { studentId: s5, status: 'hadir' }] },
    { date: dateStr(2),  records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'izin'  }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'alpha' }, { studentId: s5, status: 'hadir' }] },
    { date: dateStr(3),  records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'sakit' }, { studentId: s4, status: 'alpha' }, { studentId: s5, status: 'hadir' }] },
    { date: dateStr(4),  records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'alpha' }, { studentId: s5, status: 'izin'  }] },
    { date: dateStr(5),  records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'hadir' }, { studentId: s5, status: 'hadir' }] },
    { date: dateStr(7),  records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'alpha' }, { studentId: s5, status: 'hadir' }] },
    { date: dateStr(8),  records: [{ studentId: s1, status: 'sakit' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'alpha' }, { studentId: s5, status: 'hadir' }] },
    { date: dateStr(9),  records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'izin'  }, { studentId: s4, status: 'hadir' }, { studentId: s5, status: 'hadir' }] },
    { date: dateStr(10), records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'alpha' }, { studentId: s5, status: 'sakit' }] },
    { date: dateStr(14), records: [{ studentId: s1, status: 'hadir' }, { studentId: s2, status: 'hadir' }, { studentId: s3, status: 'hadir' }, { studentId: s4, status: 'hadir' }, { studentId: s5, status: 'hadir' }] },
  ];

  let count = 0;
  for (const a of attendanceData) {
    // Pemweb jam 1
    await addDoc(collection(db, 'attendance'), {
      date: a.date, subjectId: 'subj_pemweb', classId: 'class_xi_rpl_1',
      period: 1, inputBy: t1, records: a.records, createdAt: daysAgo(parseInt(a.date.split('T')[0]) || 1),
    });
    // Basis Data jam 3
    await addDoc(collection(db, 'attendance'), {
      date: a.date, subjectId: 'subj_basis_data', classId: 'class_xi_rpl_1',
      period: 3, inputBy: t1,
      records: a.records.map(r => ({ ...r, status: r.studentId === s4 ? 'alpha' : 'hadir' })),
      createdAt: daysAgo(1),
    });
    count++;
  }
  console.log(`  OK  ${count * 2} attendance records (Doni alpha 8x untuk trigger alert)`);
}

async function seedViolations(uids: Record<string, string>) {
  console.log('\n--- SEEDING VIOLATIONS ---');
  const bk    = uids['guru.bk@edutechsmk.sch.id']    ?? 'unknown';
  const wali  = uids['wali.kelas@edutechsmk.sch.id']  ?? 'unknown';
  const piket = uids['guru.piket@edutechsmk.sch.id']  ?? 'unknown';
  const s2 = uids['siswa2@edutechsmk.sch.id'] ?? 'unknown';
  const s4 = uids['siswa4@edutechsmk.sch.id'] ?? 'unknown';

  const violations = [
    // Siswa 2 — minor violations
    { studentId: s2, points: 5,  category: 'Terlambat',    description: 'Terlambat masuk kelas 15 menit saat jam pertama.', reportedBy: piket, reportedByRole: 'PIKET', status: 'verified', verifiedBy: bk, date: daysAgo(10) },
    { studentId: s2, points: 5,  category: 'Atribut',      description: 'Tidak memakai dasi saat upacara bendera.', reportedBy: wali, reportedByRole: 'WALI', status: 'verified', verifiedBy: bk, date: daysAgo(7) },
    { studentId: s2, points: 10, category: 'HP di Kelas',  description: 'Menggunakan HP saat pelajaran berlangsung.', reportedBy: wali, reportedByRole: 'WALI', status: 'pending', date: daysAgo(2) },

    // Siswa 4 — multiple violations (hampir batas 100 poin untuk trigger alert)
    { studentId: s4, points: 10, category: 'Bolos',         description: 'Tidak hadir tanpa keterangan selama 2 hari berturut-turut.', reportedBy: wali, reportedByRole: 'WALI', status: 'verified', verifiedBy: bk, date: daysAgo(14) },
    { studentId: s4, points: 15, category: 'Bolos',         description: 'Tidak hadir tanpa keterangan selama 3 hari.', reportedBy: wali, reportedByRole: 'WALI', status: 'verified', verifiedBy: bk, date: daysAgo(10) },
    { studentId: s4, points: 20, category: 'Perkelahian',   description: 'Terlibat perkelahian di kantin dengan siswa kelas lain.', reportedBy: piket, reportedByRole: 'PIKET', status: 'verified', verifiedBy: bk, date: daysAgo(6) },
    { studentId: s4, points: 15, category: 'Bolos',         description: 'Keluar area sekolah tanpa izin saat jam pelajaran.', reportedBy: piket, reportedByRole: 'PIKET', status: 'verified', verifiedBy: bk, date: daysAgo(3) },
    { studentId: s4, points: 10, category: 'Terlambat',     description: 'Terlambat masuk lebih dari 30 menit tanpa keterangan.', reportedBy: piket, reportedByRole: 'PIKET', status: 'pending', date: daysAgo(1) },
  ];

  for (const v of violations) {
    await addDoc(collection(db, 'violations'), v);
  }
  console.log(`  OK  ${violations.length} violations (Doni total 70 poin, mendekati batas 100)`);
}

async function seedCounseling(uids: Record<string, string>) {
  console.log('\n--- SEEDING COUNSELING ---');
  const bk = uids['guru.bk@edutechsmk.sch.id'] ?? 'unknown';
  const s4 = uids['siswa4@edutechsmk.sch.id']  ?? 'unknown';
  const s2 = uids['siswa2@edutechsmk.sch.id']  ?? 'unknown';
  const s3 = uids['siswa3@edutechsmk.sch.id']  ?? 'unknown';

  const sessions = [
    // Selesai
    { studentId: s4, bkTeacherId: bk, type: 'pelanggaran', scheduledAt: daysAgo(12), status: 'resolved', notes: 'Konsultasi mengenai ketidakhadiran berulang dan masalah di rumah.', createdAt: daysAgo(14) },
    { studentId: s4, bkTeacherId: bk, type: 'pelanggaran', scheduledAt: daysAgo(5),  status: 'resolved', notes: 'Follow-up kasus perkelahian. Siswa berjanji tidak mengulangi.', createdAt: daysAgo(7) },
    // Berjalan
    { studentId: s2, bkTeacherId: bk, type: 'akademik',    scheduledAt: daysAgo(1),  status: 'ongoing',  notes: 'Nilai Basis Data menurun, perlu bimbingan belajar.', createdAt: daysAgo(3) },
    // Booking baru
    { studentId: s3, bkTeacherId: bk, type: 'pribadi',     scheduledAt: daysFrom(2), status: 'booked',   notes: 'Merasa tidak nyaman dengan teman sekelas, ingin cerita.', createdAt: daysAgo(1) },
    { studentId: s4, bkTeacherId: bk, type: 'pelanggaran', scheduledAt: daysFrom(3), status: 'booked',   notes: 'Booking sesi lanjutan terkait akumulasi poin pelanggaran.', createdAt: now },
  ];

  for (const s of sessions) {
    await addDoc(collection(db, 'counseling'), s);
  }
  console.log(`  OK  ${sessions.length} counseling sessions`);
}

async function seedChats(uids: Record<string, string>) {
  console.log('\n--- SEEDING CHATS ---');
  const bk = uids['guru.bk@edutechsmk.sch.id'] ?? 'unknown';
  const s4 = uids['siswa4@edutechsmk.sch.id']  ?? 'unknown';
  const s2 = uids['siswa2@edutechsmk.sch.id']  ?? 'unknown';

  // Chat konfidensial BK - Doni
  const chatId1 = [bk, s4].sort().join('_bk_');
  await setDoc(doc(db, 'chats', chatId1), {
    participants: [bk, s4], type: 'bk_confidential',
    lastMessage: 'Baik Pak, saya akan usahakan hadir setiap hari.',
    updatedAt: daysAgo(5),
  });
  const messages1 = [
    { senderId: bk, text: 'Selamat pagi Doni. Ibu ingin berbicara mengenai ketidakhadiran kamu belakangan ini.', timestamp: daysAgo(6) },
    { senderId: s4, text: 'Selamat pagi Bu. Maaf bu, memang belakangan saya ada masalah di rumah.', timestamp: daysAgo(6) },
    { senderId: bk, text: 'Tidak apa-apa, kamu bisa cerita kalau mau. Apa yang terjadi?', timestamp: daysAgo(6) },
    { senderId: s4, text: 'Orang tua saya sedang sakit bu, jadi saya harus bantu-bantu di rumah dulu.', timestamp: daysAgo(5) },
    { senderId: bk, text: 'Ibu mengerti. Tapi kamu tetap harus lapor ke wali kelas ya. Nanti Ibu akan bicara dengan wali kelas.', timestamp: daysAgo(5) },
    { senderId: s4, text: 'Baik Pak, saya akan usahakan hadir setiap hari.', timestamp: daysAgo(5) },
  ];
  for (const m of messages1) {
    await addDoc(collection(db, `chats/${chatId1}/messages`), { ...m, readBy: [m.senderId] });
  }
  console.log(`  OK  Chat BK-Doni (${messages1.length} messages)`);

  // Chat konfidensial BK - Budi
  const chatId2 = [bk, s2].sort().join('_bk_');
  await setDoc(doc(db, 'chats', chatId2), {
    participants: [bk, s2], type: 'bk_confidential',
    lastMessage: 'Terima kasih Bu, saya akan belajar lebih giat.',
    updatedAt: daysAgo(2),
  });
  const messages2 = [
    { senderId: bk, text: 'Halo Budi, Ibu lihat nilai Basis Data kamu menurun. Ada kesulitan?', timestamp: daysAgo(3) },
    { senderId: s2, text: 'Iya Bu, saya agak kesulitan di bagian JOIN query.', timestamp: daysAgo(3) },
    { senderId: bk, text: 'Coba minta bantuan guru mapel untuk penjelasan ekstra ya. Atau bisa belajar kelompok.', timestamp: daysAgo(2) },
    { senderId: s2, text: 'Terima kasih Bu, saya akan belajar lebih giat.', timestamp: daysAgo(2) },
  ];
  for (const m of messages2) {
    await addDoc(collection(db, `chats/${chatId2}/messages`), { ...m, readBy: [m.senderId] });
  }
  console.log(`  OK  Chat BK-Budi (${messages2.length} messages)`);
}

async function seedPiketLogs(uids: Record<string, string>) {
  console.log('\n--- SEEDING PIKET LOGS ---');
  const piket = uids['guru.piket@edutechsmk.sch.id'] ?? 'unknown';
  const s4 = uids['siswa4@edutechsmk.sch.id'] ?? 'unknown';

  const logs = [
    {
      date: dateStr(1), piketTeacherId: piket,
      events: [
        { studentId: s4,      type: 'terlambat',   description: 'Terlambat 35 menit, tidak ada keterangan.',        time: '07:45' },
        { studentId: '2024002', type: 'izin_pulang', description: 'Izin pulang lebih awal karena ada keperluan keluarga. Sudah ada surat izin.', time: '10:30' },
        { studentId: '-',     type: 'kejadian',    description: 'Ada siswa kelas X yang sakit pingsan di lapangan, sudah ditangani UKS.',        time: '09:15' },
      ],
    },
    {
      date: dateStr(2), piketTeacherId: piket,
      events: [
        { studentId: '2024003', type: 'terlambat',   description: 'Terlambat 20 menit, ban sepeda bocor.',              time: '07:25' },
        { studentId: '2024005', type: 'terlambat',   description: 'Terlambat 10 menit.',                                 time: '07:15' },
        { studentId: s4,        type: 'terlambat',   description: 'Terlambat 45 menit, tidak ada keterangan.',           time: '07:55' },
      ],
    },
    {
      date: dateStr(5), piketTeacherId: piket,
      events: [
        { studentId: '-', type: 'kejadian', description: 'Kran air di kamar mandi lantai 2 bocor, sudah dilaporkan ke bagian sarana prasarana.', time: '08:30' },
        { studentId: s4,  type: 'terlambat', description: 'Terlambat lagi, kali ini 1 jam. Langsung ke ruang BK.', time: '08:05' },
      ],
    },
    {
      date: dateStr(7), piketTeacherId: piket,
      events: [
        { studentId: '2024001', type: 'izin_pulang', description: 'Sakit perut mendadak, sudah dapat surat izin dari UKS.', time: '11:00' },
      ],
    },
  ];

  for (const log of logs) {
    const id = `${log.date}_${piket}`;
    await setDoc(doc(db, 'piket_logs', id), { ...log, createdAt: daysAgo(parseInt(log.date) || 0) });
  }
  console.log(`  OK  ${logs.length} piket log days`);
}

async function seedAnnouncements(uids: Record<string, string>) {
  console.log('\n--- SEEDING ANNOUNCEMENTS ---');
  const admin = uids['admin@edutechsmk.sch.id']   ?? 'unknown';
  const piket = uids['guru.piket@edutechsmk.sch.id'] ?? 'unknown';
  const wali  = uids['wali.kelas@edutechsmk.sch.id'] ?? 'unknown';

  const announcements = [
    { title: 'Selamat Datang di EduTech SMK', body: 'Sistem pembelajaran digital SMK telah resmi diluncurkan. Seluruh siswa, guru, dan staf dapat mulai menggunakan aplikasi ini untuk kegiatan belajar mengajar.', createdBy: admin, isUrgent: false, createdAt: daysAgo(30) },
    { title: 'Jadwal Ujian Tengah Semester (UTS)', body: 'UTS Semester Ganjil akan dilaksanakan pada tanggal 15-22 Agustus 2026. Materi yang diujikan adalah semua bab yang telah dipelajari sejak awal semester. Harap mempersiapkan diri dengan baik.', createdBy: admin, isUrgent: false, createdAt: daysAgo(14) },
    { title: 'PENTING: Siswa Wajib Update Data', body: 'Seluruh siswa diwajibkan memperbarui data diri (nomor HP orang tua, alamat, dll) melalui wali kelas masing-masing paling lambat hari Jumat minggu ini. Data diperlukan untuk keperluan administrasi.', createdBy: wali, isUrgent: true, targetRole: 'STUDENT', createdAt: daysAgo(5) },
    { title: 'Libur Perayaan Kemerdekaan', body: 'Diberitahukan bahwa pada tanggal 17 Agustus 2026, seluruh kegiatan belajar mengajar diliburkan dalam rangka memperingati Hari Kemerdekaan Republik Indonesia ke-81. Kelas akan dimulai kembali pada 18 Agustus 2026.', createdBy: admin, isUrgent: false, createdAt: daysAgo(3) },
    { title: 'DARURAT: Listrik Padam Sebagian Gedung', body: 'Saat ini listrik di gedung B (lantai 2-3) mengalami gangguan. Tim teknisi sedang menangani. Kelas yang berada di gedung B mohon pindah sementara ke aula. Perkiraan selesai perbaikan: 1 jam.', createdBy: piket, isUrgent: true, createdAt: daysAgo(1) },
    { title: 'Pengumuman Lomba Coding Tingkat Provinsi', body: 'SMK Teknologi membuka pendaftaran untuk lomba coding tingkat provinsi. Kategori: Web Development dan Mobile App. Daftarkan diri melalui guru mapel Pemrograman Web. Deadline pendaftaran: 10 Agustus 2026.', createdBy: admin, isUrgent: false, targetRole: 'STUDENT', createdAt: daysAgo(2) },
    { title: 'Rapat Wali Kelas Bulan Ini', body: 'Rapat koordinasi wali kelas akan dilaksanakan hari Senin, 12 Agustus 2026 pukul 13.00 di ruang rapat lantai 1. Semua wali kelas wajib hadir. Agenda: evaluasi akademik semester, laporan pelanggaran, dan rencana kegiatan semester ganjil.', createdBy: admin, isUrgent: false, targetRole: 'WALI', createdAt: daysAgo(4) },
  ];

  for (const a of announcements) {
    await addDoc(collection(db, 'announcements'), a);
    console.log(`  OK  ${a.isUrgent ? '[DARURAT] ' : ''}${a.title}`);
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(55));
  console.log('  SEED DATA LENGKAP — EduTech SMK');
  console.log('='.repeat(55));

  const uids = await seedUsers();
  await seedClasses(uids);
  await seedSubjects(uids);
  await seedMaterials(uids);
  await seedAssignmentsAndSubmissions(uids);
  await seedAttendance(uids);
  await seedViolations(uids);
  await seedCounseling(uids);
  await seedChats(uids);
  await seedPiketLogs(uids);
  await seedAnnouncements(uids);

  console.log('\n' + '='.repeat(55));
  console.log('  SEED SELESAI!');
  console.log('='.repeat(55));

  console.log('\n AKUN LOGIN:');
  console.log('  Siswa 1  : siswa1@edutechsmk.sch.id  / password123  (Ahmad Fauzi)');
  console.log('  Siswa 2  : siswa2@edutechsmk.sch.id  / password123  (Budi Prasetyo)');
  console.log('  Siswa 3  : siswa3@edutechsmk.sch.id  / password123  (Citra Dewi)');
  console.log('  Siswa 4  : siswa4@edutechsmk.sch.id  / password123  (Doni - banyak pelanggaran)');
  console.log('  Siswa 5  : siswa5@edutechsmk.sch.id  / password123  (Eka Putri)');
  console.log('  Guru     : guru.mapel@edutechsmk.sch.id  / password123');
  console.log('  Wali     : wali.kelas@edutechsmk.sch.id  / password123');
  console.log('  Guru BK  : guru.bk@edutechsmk.sch.id     / password123');
  console.log('  Piket    : guru.piket@edutechsmk.sch.id  / password123');
  console.log('  Admin    : admin@edutechsmk.sch.id        / password123 (Web only)');

  console.log('\n SKENARIO UNTUK DEMO:');
  console.log('  - Login sbg Siswa 4 (Doni): alpha 8x + poin 70 → trigger ALERT di Wali');
  console.log('  - Login sbg Wali: lihat alert system Doni merah');
  console.log('  - Login sbg Guru BK: ada booking konseling + chat dengan Doni');
  console.log('  - Login sbg Guru Mapel: nilai submissions, upload materi baru');
  console.log('  - Login sbg Piket: lihat log kejadian harian');
  console.log('  - Tekan W → buka web → Login sbg Admin');

  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
