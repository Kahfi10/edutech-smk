import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { loginUser } from '../../src/firebase/auth.service';
import { Button } from '../../src/components/ui/Button';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Perhatian', 'Email dan password tidak boleh kosong.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Email atau password salah.'
          : err.code === 'auth/user-not-found'
          ? 'Akun tidak ditemukan.'
          : err.code === 'auth/too-many-requests'
          ? 'Terlalu banyak percobaan. Coba lagi nanti.'
          : 'Gagal masuk. Coba lagi.';
      Alert.alert('Gagal Masuk', msg);
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.appName}>EduTech SMK</Text>
          <Text style={styles.appSub}>Sistem Manajemen Pembelajaran</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
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
            Admin Sekolah — akses via Web Portal
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },

  // Logo
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoBox: {
    width: 72, height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    ...Shadow.md,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  appName: { ...Typography.title2, color: Colors.black, marginBottom: 4 },
  appSub: { ...Typography.subheadline, color: Colors.tertiaryLabel },

  // Form
  form: { marginBottom: 32 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.separator,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    ...Shadow.xs,
  },
  inputFocused: {
    borderColor: Colors.black,
    borderWidth: 1.5,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.black,
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },
  inputGap: { height: 10 },
  loginBtn: { marginTop: 20 },

  // Footer
  footer: { alignItems: 'center', gap: 10 },
  footerText: {
    ...Typography.caption1,
    color: Colors.tertiaryLabel,
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    width: 40,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
  },
  adminNote: {
    ...Typography.caption2,
    color: Colors.quaternaryLabel,
    textAlign: 'center',
  },
});
