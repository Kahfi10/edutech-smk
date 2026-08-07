/**
 * SEED DATA SCRIPT — Jalankan sekali untuk populate Firestore
 * 
 * Cara pakai:
 * 1. Pastikan firebase config sudah diisi di src/firebase/config.ts
 * 2. Jalankan: npx ts-node src/scripts/seedData.ts
 *    (atau copy-paste ke Firebase Console > Firestore secara manual)
 * 
 * Data yang dibuat:
 * - 6 user (1 per role) dengan password: "password123"
 * - 1 kelas: XI-RPL-1
 * - 2 mata pelajaran
 * - Contoh materi, tugas, absensi
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  collection,
  addDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA94eenf8Mu2dYXbDtsAX57206j6MK3ejA",
  authDomain: "edutech-smk.firebaseapp.com",
  projectId: "edutech-smk",
  storageBucket: "edutech-smk.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  messagingSenderId: "1007739019694",
  appId: "1:1007739019694:web:a48af541050df726a6683f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SEED_USERS = [
  {
    email: 'siswa1@edutechsmk.sch.id',
    password: 'password123',
    profile: {
      name: 'Ahmad Fauzi',
      role: 'STUDENT',
      nis: '2024001',
      classId: 'class_xi_rpl_1',
    },
  },
  {
    email: 'guru.mapel@edutechsmk.sch.id',
    password: 'password123',
    profile: {
      name: 'Budi Santoso, S.Kom',
      role: 'TEACHER',
      nip: '198501012010011001',
      subjects: ['subj_pemweb', 'subj_basis_data'],
    },
  },
  {
    email: 'wali.kelas@edutechsmk.sch.id',
    password: 'password123',
    profile: {
      name: 'Siti Rahayu, S.Pd',
      role: 'WALI',
      nip: '198703152010012002',
      classId: 'class_xi_rpl_1',
    },
  },
  {
    email: 'guru.bk@edutechsmk.sch.id',
    password: 'password123',
    profile: {
      name: 'Dewi Puspita, S.Psi',
      role: 'BK',
      nip: '199002202015012003',
    },
  },
  {
    email: 'guru.piket@edutechsmk.sch.id',
    password: 'password123',
    profile: {
      name: 'Rudi Hermawan, S.Pd',
      role: 'PIKET',
      nip: '198806102010011004',
    },
  },
  {
    email: 'admin@edutechsmk.sch.id',
    password: 'password123',
    profile: {
      name: 'Kepala Sekolah',
      role: 'ADMIN',
      nip: '197501012000011005',
    },
  },
];

async function seed() {
  console.log('🌱 Memulai seed data...');
  const uids: Record<string, string> = {};

  // 1. Buat users
  for (const u of SEED_USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      uids[u.profile.role] = cred.user.uid;

      await setDoc(doc(db, 'users', cred.user.uid), {
        ...u.profile,
        uid: cred.user.uid,
        email: u.email,
        createdAt: Timestamp.now(),
      });
      console.log(`✅ User ${u.profile.role}: ${u.email}`);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`⚠️  ${u.email} sudah ada, skip.`);
      } else {
        console.error(`❌ ${u.email}:`, e.message);
      }
    }
  }

  // 2. Buat kelas
  await setDoc(doc(db, 'classes', 'class_xi_rpl_1'), {
    name: 'XI-RPL-1',
    waliId: uids['WALI'] || 'placeholder_wali',
    studentIds: [uids['STUDENT'] || 'placeholder_student'],
  });
  console.log('✅ Kelas XI-RPL-1');

  // 3. Buat mata pelajaran
  await setDoc(doc(db, 'subjects', 'subj_pemweb'), {
    name: 'Pemrograman Web',
    teacherId: uids['TEACHER'] || 'placeholder_teacher',
    classIds: ['class_xi_rpl_1'],
  });
  await setDoc(doc(db, 'subjects', 'subj_basis_data'), {
    name: 'Basis Data',
    teacherId: uids['TEACHER'] || 'placeholder_teacher',
    classIds: ['class_xi_rpl_1'],
  });
  console.log('✅ Mata pelajaran');

  // 4. Buat materi contoh
  await addDoc(collection(db, 'materials'), {
    title: 'Pengenalan HTML & CSS',
    description: 'Materi dasar HTML dan CSS untuk pembuatan halaman web',
    type: 'pdf',
    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
    subjectId: 'subj_pemweb',
    classId: 'class_xi_rpl_1',
    uploadedBy: uids['TEACHER'] || 'placeholder_teacher',
    createdAt: Timestamp.now(),
  });
  console.log('✅ Materi contoh');

  // 5. Buat tugas contoh
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  await addDoc(collection(db, 'assignments'), {
    title: 'Tugas 1: Buat Halaman Web Profil',
    description: 'Buat halaman web profil pribadi menggunakan HTML dan CSS. Upload file HTML.',
    subjectId: 'subj_pemweb',
    classId: 'class_xi_rpl_1',
    deadline: Timestamp.fromDate(deadline),
    maxScore: 100,
    createdBy: uids['TEACHER'] || 'placeholder_teacher',
    createdAt: Timestamp.now(),
  });
  console.log('✅ Tugas contoh');

  // 6. Buat pengumuman contoh
  await addDoc(collection(db, 'announcements'), {
    title: 'Selamat Datang di EduTech SMK',
    body: 'Sistem pembelajaran digital SMK telah resmi diluncurkan. Silakan login dan eksplorasi fitur-fitur yang tersedia.',
    createdBy: uids['ADMIN'] || 'placeholder_admin',
    isUrgent: false,
    createdAt: Timestamp.now(),
  });
  console.log('✅ Pengumuman contoh');

  console.log('\n🎉 Seed selesai!');
  console.log('\n📋 Akun login:');
  SEED_USERS.forEach(u => {
    console.log(`  ${u.profile.role.padEnd(8)}: ${u.email} / ${u.password}`);
  });
}

seed().catch(console.error);
