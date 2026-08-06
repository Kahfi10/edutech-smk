import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { onAuthChange, getUserProfile } from '../firebase/auth.service';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User) => {
    const p = await getUserProfile(u.uid);
    setProfile(p);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
