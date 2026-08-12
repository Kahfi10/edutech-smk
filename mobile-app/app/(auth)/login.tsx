import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../../src/firebase/auth.service';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { AppLogo } from '../../src/components/shared/AppLogo';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [focused, setFocused]           = useState<'email' | 'password' | null>(null);
  const insets = useSafeAreaInsets();

  // Watch AuthContext error (e.g. profile not found after login)
  const { error: authError, loading: authLoading } = useAuth();
  useEffect(() => {
    if (authError && loginSuccess) {
      setErrorMsg(authError);
      setLoginSuccess(false);
      setLoading(false);
    }
  }, [authError, loginSuccess]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Email dan password tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setLoginSuccess(false);
    try {
      await loginUser(email.trim().toLowerCase(), password);
      // Login Firebase berhasil — tunggu AuthGuard redirect
      setLoginSuccess(true);
    } catch (err: any) {
      setLoginSuccess(false);
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Email atau password salah.'
          : err.code === 'auth/user-not-found'
          ? 'Akun tidak ditemukan.'
          : err.code === 'auth/too-many-requests'
          ? 'Terlalu banyak percobaan. Coba beberapa saat lagi.'
          : err.code === 'auth/network-request-failed'
          ? 'Tidak ada koneksi internet.'
          : err.code === 'auth/invalid-email'
          ? 'Format email tidak valid.'
          : `Gagal masuk: ${err.message}`;
      setErrorMsg(msg);
      setLoading(false);
    }
    // Jangan setLoading(false) jika berhasil — biarkan loading sampai redirect
  };

  // Jika login sukses dan AuthContext sedang load profile
  if (loginSuccess && (loading || authLoading)) {
    return (
      <View style={styles.loadingScreen}>
        <AppLogo size={64} />
        <ActivityIndicator size="large" color={Colors.black} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <AppLogo size={72} />
          <Text style={styles.appName}>EduTech SMK</Text>
          <Text style={styles.appSub}>Sistem Manajemen Pembelajaran</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Error message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.gray2} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={[styles.inputWrap, focused === 'email' && styles.inputFocused]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={focused === 'email' ? Colors.black : Colors.gray6}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Colors.gray7}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              returnKeyType="next"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGap} />

          {/* Password */}
          <View style={[styles.inputWrap, focused === 'password' && styles.inputFocused]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={focused === 'password' ? Colors.black : Colors.gray6}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={Colors.gray7}
              secureTextEntry={!showPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} disabled={loading}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.gray6}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Button
            title="Masuk"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Login sebagai Siswa, Guru, Wali Kelas, Guru BK, atau Guru Piket
          </Text>
          <View style={styles.divider} />
          <Text style={styles.adminNote}>
            Admin Sekolah — akses via edutech-smk-admin.web.app
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingScreen: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { ...Typography.subheadline, color: Colors.tertiaryLabel, marginTop: 12 },
  scroll: {
    flexGrow: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center',
  },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  appName:  { ...Typography.title2, color: Colors.black, marginBottom: 4, marginTop: 16 },
  appSub:   { ...Typography.subheadline, color: Colors.tertiaryLabel },
  form: { marginBottom: 32 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF2F2', borderRadius: Radius.sm, padding: Spacing.md,
    marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: '#FF3B30',
  },
  errorText: { ...Typography.footnote, color: '#FF3B30', flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.separator,
    paddingHorizontal: Spacing.md, minHeight: 52, ...Shadow.xs,
  },
  inputFocused: { borderColor: Colors.black, borderWidth: 1.5 },
  inputIcon:  { marginRight: 10 },
  input: {
    flex: 1, ...Typography.body, color: Colors.black, paddingVertical: 0,
  },
  eyeBtn:   { padding: 4 },
  inputGap: { height: 10 },
  loginBtn: { marginTop: 20 },
  footer: { alignItems: 'center', gap: 10 },
  footerText: {
    ...Typography.caption1, color: Colors.tertiaryLabel, textAlign: 'center', lineHeight: 18,
  },
  divider: {
    width: 40, height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator,
  },
  adminNote: { ...Typography.caption2, color: Colors.quaternaryLabel, textAlign: 'center' },
});
