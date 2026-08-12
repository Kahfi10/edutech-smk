import React, {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react';
import { UserProfile } from '../types';
import { onAuthChange, getUserProfile } from '../firebase/auth.service';
import { USE_MOCK, MOCK_USERS } from '../constants/mockData';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  setMockRole?: (role: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true, error: null, refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const setMockRole = (role: string) => {
    const p = MOCK_USERS[role];
    if (p) setProfile(p as UserProfile);
  };

  useEffect(() => {
    if (USE_MOCK) {
      setProfile(MOCK_USERS['STUDENT'] as UserProfile);
      setLoading(false);
      return;
    }

    const unsub = onAuthChange(async (u) => {
      setUser(u);
      setError(null);

      if (u) {
        try {
          const p = await getUserProfile(u.uid);
          if (p) {
            setProfile(p);
          } else {
            // User ada di Auth tapi tidak ada di Firestore
            // Kemungkinan: seed data belum dijalankan atau uid tidak cocok
            console.warn('[AuthContext] Profile null untuk uid:', u.uid);
            setError('Profil pengguna tidak ditemukan. Hubungi admin.');
            setProfile(null);
          }
        } catch (err: any) {
          console.error('[AuthContext] Gagal load profile:', err.code, err.message);
          // Firestore permission denied atau network error
          if (err.code === 'permission-denied') {
            setError('Akses ditolak. Coba login ulang.');
          } else if (err.code === 'unavailable') {
            setError('Tidak ada koneksi internet.');
          } else {
            setError('Gagal memuat data. Coba lagi.');
          }
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (USE_MOCK || !user) return;
    try {
      const p = await getUserProfile(user.uid);
      if (p) setProfile(p);
    } catch (err) {
      console.error('[AuthContext] refreshProfile failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, refreshProfile, setMockRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
