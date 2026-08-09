/**
 * FCM & Notification Service — EduTech SMK
 *
 * Expo Go SDK 53+: remote push (FCM) tidak didukung
 * Solusi: local notifications yang dipicu oleh Firestore triggers
 * Untuk demo: notifikasi muncul saat ada tugas baru, alert, atau pengumuman darurat
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';
import { USE_MOCK } from '../constants/mockData';

// Konfigurasi tampilan notifikasi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Request permission ────────────────────────────────────────────
export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Simpan token ke Firestore jika Firebase aktif
  if (!USE_MOCK) {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      const user  = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { fcmToken: token.data });
      }
      return token.data;
    } catch {
      // Token tidak bisa diambil di Expo Go → pakai local notifications saja
    }
  }

  return null;
};

// ─── Local Notification Triggers ──────────────────────────────────
// Dipakai sebagai pengganti FCM remote push di Expo Go

export const notifyNewAssignment = async (title: string, subject: string) => {
  await sendLocalNotification(
    'Tugas Baru',
    `${subject}: "${title}" telah diterbitkan. Segera kerjakan!`,
    { type: 'assignment', title }
  );
};

export const notifyGraded = async (assignmentTitle: string, score: number) => {
  await sendLocalNotification(
    'Tugas Dinilai',
    `"${assignmentTitle}" telah dinilai. Nilai kamu: ${score}`,
    { type: 'grade', score }
  );
};

export const notifyViolationAlert = async (studentName: string, points: number) => {
  await sendLocalNotification(
    'Alert Pelanggaran',
    `${studentName} memiliki ${points} poin pelanggaran. Perlu perhatian segera!`,
    { type: 'violation', points }
  );
};

export const notifyAttendanceAlert = async (studentName: string, alphaCount: number) => {
  await sendLocalNotification(
    'Alert Absensi',
    `${studentName} alpha ${alphaCount}x. Segera tindak lanjuti!`,
    { type: 'attendance', alphaCount }
  );
};

export const notifyBroadcast = async (title: string, body: string, isUrgent = false) => {
  await sendLocalNotification(
    isUrgent ? `DARURAT: ${title}` : title,
    body,
    { type: 'announcement', isUrgent }
  );
};

export const notifyNewQuiz = async (quizTitle: string, subject: string) => {
  await sendLocalNotification(
    'Kuis Baru',
    `${subject}: Kuis "${quizTitle}" telah dibuka. Kerjakan sebelum deadline!`,
    { type: 'quiz', quizTitle }
  );
};

export const notifyNewBooking = async (studentName: string, type: string) => {
  await sendLocalNotification(
    'Booking Konseling Baru',
    `${studentName} mengajukan konseling "${type}". Segera konfirmasi jadwal.`,
    { type: 'counseling', studentName }
  );
};

// ─── Core: Send Local Notification ────────────────────────────────
export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  if (Platform.OS === 'web') return; // Web tidak support local notifications

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: true,
        badge: 1,
      },
      trigger: null, // tampil langsung
    });
  } catch (err) {
    console.warn('[FCM] Local notification failed:', err);
  }
};

// ─── Notification Listeners ────────────────────────────────────────
export const setupNotificationListeners = (
  onNotification?: (n: Notifications.Notification) => void,
  onResponse?: (r: Notifications.NotificationResponse) => void,
) => {
  const sub1 = Notifications.addNotificationReceivedListener(n => {
    console.log('[FCM] Notification received:', n.request.content.title);
    onNotification?.(n);
  });

  const sub2 = Notifications.addNotificationResponseReceivedListener(r => {
    console.log('[FCM] Notification tapped:', r.notification.request.content.title);
    onResponse?.(r);
  });

  return () => {
    sub1.remove();
    sub2.remove();
  };
};

// ─── Demo Helper: Trigger test notifications ────────────────────────
export const triggerDemoNotifications = async (role: string) => {
  if (Platform.OS === 'web') return;

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  switch (role) {
    case 'STUDENT':
      await delay(1000);
      await notifyNewAssignment('Tugas 3 — React Component', 'Pemrograman Web');
      await delay(2000);
      await notifyGraded('Tugas 1 — Buat Halaman Web', 92);
      break;
    case 'TEACHER':
      await delay(1000);
      await notifyGraded('Ada 3 submission baru menunggu penilaian', 0);
      break;
    case 'WALI':
      await delay(1000);
      await notifyViolationAlert('Doni Setiawan', 70);
      await delay(2000);
      await notifyAttendanceAlert('Doni Setiawan', 8);
      break;
    case 'BK':
      await delay(1000);
      await notifyNewBooking('Doni Setiawan', 'pelanggaran');
      break;
    case 'PIKET':
      await delay(1000);
      await notifyBroadcast('Pengingat Tugas Piket', 'Jangan lupa rekap absensi hari ini.', false);
      break;
  }
};
