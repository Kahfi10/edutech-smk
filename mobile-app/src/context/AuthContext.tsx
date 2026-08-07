import React, {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { onAuthChange, getUserProfile } from '../firebase/auth.service';
import { USE_MOCK, MOCK_USERS } from '../constants/mockData';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  // mock only
  setMockRole?: (role: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true, refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── MOCK MODE ──────────────────────────────────────────────────
  const setMockRole = (role: string) => {
    const p = MOCK_USERS[role];
    if (p) setProfile(p as UserProfile);
  };

  useEffect(() => {
    if (USE_MOCK) {
      // Default mock: Siswa — ganti sesuai role yang ingin dilihat
      setProfile(MOCK_USERS['STUDENT'] as UserProfile);
      setLoading(false);
      return;
    }

    // ── FIREBASE MODE ──────────────────────────────────────────
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (USE_MOCK || !user) return;
    const p = await getUserProfile(user.uid);
    setProfile(p);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, setMockRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
