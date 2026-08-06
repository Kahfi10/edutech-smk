import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loginUser } from '../../src/firebase/auth.service';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { ROLES } from '../../src/constants/roles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { profile } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Perhatian', 'Email dan password tidak boleh kosong.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      // Redirect handled by index.tsx via AuthContext
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Email atau password salah.'
          : err.code === 'auth/user-not-found'
          ? 'Akun tidak ditemukan.'
          : 'Gagal login. Coba lagi.';
      Alert.alert('Login Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>ES</Text>
          </View>
          <Text style={styles.appName}>EduTech SMK</Text>
          <Text style={styles.subtitle}>Sistem Manajemen Pembelajaran Digital</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Masuk ke Akun</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@sekolah.sch.id"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan password"
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Masuk"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Role Info */}
        <View style={styles.roleInfo}>
          <Text style={styles.roleInfoTitle}>Platform untuk:</Text>
          <View style={styles.roleRow}>
            {['Siswa', 'Guru Mapel', 'Wali Kelas', 'Guru BK', 'Guru Piket'].map(r => (
              <View key={r} style={styles.roleChip}>
                <Text style={styles.roleChipText}>{r}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.adminNote}>
            Admin / Kepala Sekolah: akses via Web Admin Portal
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  appName: { fontSize: 26, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  roleInfo: { marginTop: 24, alignItems: 'center' },
  roleInfoTitle: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  roleChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleChipText: { fontSize: 11, color: '#4F46E5', fontWeight: '600' },
  adminNote: { fontSize: 11, color: '#94A3B8', marginTop: 10, textAlign: 'center' },
});
