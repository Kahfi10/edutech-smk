# EduTech SMK — Mobile LMS + Admin Web Portal

Sistem Manajemen Pembelajaran Digital untuk SMK berbasis React Native (Expo) + Firebase.

---

## Struktur Proyek

```
edutech-smk/
├── mobile-app/     ← Expo React Native (Android + iOS)
├── admin-web/      ← React.js + Vite (Web Admin)
├── firebase/       ← Security Rules
└── firebase.json   ← Firebase konfigurasi deploy
```

---

## Setup Firebase (WAJIB dilakukan pertama)

### 1. Buat Firebase Project
1. Buka [Firebase Console](https://console.firebase.google.com)
2. Buat project baru: **"edutech-smk-app"**
3. Aktifkan layanan berikut:
   - **Authentication** → Sign-in method → Email/Password → Enable
   - **Firestore Database** → Create database → Production mode
   - **Storage** → Get started
   - **Hosting** → Get started (untuk admin web)

### 2. Ambil Firebase Config
1. Project Settings → Your apps → Add app → Web
2. Copy `firebaseConfig` object

### 3. Isi Firebase Config
Ganti placeholder `YOUR_API_KEY`, `YOUR_PROJECT_ID`, dll di:
- `mobile-app/src/firebase/config.ts`
- `admin-web/src/firebase/config.ts`

### 4. Tambahkan Android App (untuk FCM)
1. Project Settings → Add app → Android
2. Package name: `com.edutechsmk.app`
3. Download `google-services.json` → taruh di `mobile-app/google-services.json`

---

## Menjalankan Mobile App

```bash
cd mobile-app

# Install dependencies (jika belum)
npm install

# Jalankan di Expo Go (scan QR di HP)
npx expo start

# Atau jalankan di Android
npx expo run:android
```

---

## Menjalankan Admin Web (Dev)

```bash
cd admin-web
npm install --legacy-peer-deps
npm run dev
# Buka: http://localhost:5173
```

---

## Seed Data (Login Pertama)

Setelah Firebase config diisi, jalankan seed script untuk membuat user demo:

```bash
cd mobile-app
npx ts-node src/scripts/seedData.ts
```

**Akun default yang dibuat:**

| Role | Email | Password |
|------|-------|----------|
| Siswa | siswa1@edutechsmk.sch.id | password123 |
| Guru Mapel | guru.mapel@edutechsmk.sch.id | password123 |
| Wali Kelas | wali.kelas@edutechsmk.sch.id | password123 |
| Guru BK | guru.bk@edutechsmk.sch.id | password123 |
| Guru Piket | guru.piket@edutechsmk.sch.id | password123 |
| Admin | admin@edutechsmk.sch.id | password123 |

---

## Deploy Admin Web ke Firebase Hosting

```bash
# 1. Login Firebase
firebase login

# 2. Init (pilih project & set public dir = admin-web/dist)
firebase init hosting

# 3. Build admin web
cd admin-web && npm run build

# 4. Deploy ke Firebase Hosting
cd .. && firebase deploy --only hosting

# Live URL: https://YOUR_PROJECT_ID.web.app
```

---

## Deploy Security Rules

```bash
firebase deploy --only firestore:rules,storage
```

---

## Fitur Per Role

| Role | Fitur Utama |
|------|-------------|
| **Siswa** | Lihat materi (PDF/Video), kerjakan tugas, lihat nilai, absensi, poin pelanggaran, booking BK |
| **Guru Mapel** | Upload materi, buat tugas, nilai submission, input absensi, statistik kelas |
| **Wali Kelas** | Monitor kelas, alert system cerdas (alpha >3x, nilai drop >20%, poin near max), input pelanggaran |
| **Guru BK** | Kelola konseling, confidential chat, verifikasi pelanggaran, tren kasus |
| **Guru Piket** | Scan QR / input NISN, buku piket digital, broadcast darurat |
| **Admin** | CRUD user + assign role, monitor semua data, pengumuman global (Web Portal) |

---

## Tech Stack

- **Mobile**: React Native (Expo SDK 51+), Expo Router, TypeScript
- **Admin Web**: React 18, Vite 5, React Router DOM 6, TypeScript
- **Backend**: Firebase Auth, Firestore, Storage, FCM, Hosting
- **State**: React Context + Hooks

---

## Checklist Penilaian

- [x] Login Multi-Role (6 role)
- [x] Firebase Authentication + Custom user roles
- [x] Cloud Firestore (realtime sync)
- [x] Firebase Storage (upload PDF/Video)
- [x] FCM Push Notifications
- [x] Firebase Hosting (Admin Web Portal)
- [ ] Isi Firebase config → seed data → video demo 10 menit
