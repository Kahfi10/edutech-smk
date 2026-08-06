import { Timestamp } from 'firebase/firestore';
import { UserRole } from '../constants/roles';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  nis?: string;
  nip?: string;
  classId?: string;
  subjects?: string[];
  photoUrl?: string;
  fcmToken?: string;
  createdAt: Timestamp;
}

export interface ClassData {
  id: string;
  name: string;
  waliId: string;
  studentIds: string[];
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  classIds: string[];
}

export interface Material {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video';
  fileUrl: string;
  subjectId: string;
  classId: string;
  uploadedBy: string;
  createdAt: Timestamp;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  deadline: Timestamp;
  maxScore: number;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl?: string;
  textAnswer?: string;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  status: 'submitted' | 'graded';
  submittedAt: Timestamp;
}

export interface AttendanceRecord {
  studentId: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpha';
}

export interface Attendance {
  id: string;
  date: string;
  subjectId: string;
  classId: string;
  period: number;
  inputBy: string;
  records: AttendanceRecord[];
  createdAt: Timestamp;
}

export interface Violation {
  id: string;
  studentId: string;
  points: number;
  category: string;
  description: string;
  reportedBy: string;
  reportedByRole: string;
  verifiedBy?: string;
  status: 'pending' | 'verified';
  date: Timestamp;
}

export interface Counseling {
  id: string;
  studentId: string;
  bkTeacherId: string;
  type: 'akademik' | 'sosial' | 'pribadi' | 'karir' | 'pelanggaran';
  scheduledAt: Timestamp;
  status: 'booked' | 'ongoing' | 'resolved';
  notes?: string;
  createdAt: Timestamp;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  type: 'dm' | 'bk_confidential' | 'forum';
  subjectId?: string;
  lastMessage: string;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  readBy: string[];
}

export interface PiketEvent {
  studentId: string;
  type: 'terlambat' | 'izin_pulang' | 'kejadian';
  description: string;
  time: string;
}

export interface PiketLog {
  id: string;
  date: string;
  piketTeacherId: string;
  events: PiketEvent[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  targetRole?: string;
  createdBy: string;
  isUrgent: boolean;
  createdAt: Timestamp;
}
