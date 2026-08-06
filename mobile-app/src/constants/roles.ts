export const ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  WALI: 'WALI',
  BK: 'BK',
  PIKET: 'PIKET',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Siswa',
  TEACHER: 'Guru Mapel',
  WALI: 'Wali Kelas',
  BK: 'Guru BK',
  PIKET: 'Guru Piket',
  ADMIN: 'Admin',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  STUDENT: '#4F46E5',
  TEACHER: '#059669',
  WALI: '#D97706',
  BK: '#DC2626',
  PIKET: '#7C3AED',
  ADMIN: '#0F172A',
};
