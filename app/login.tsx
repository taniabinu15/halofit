// app/login.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import Colors from '@/constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { user, initializing, signIn, signUp, signInGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initializing && user) {
      // If logged in, go to tabs
      router.replace('/(tabs)');
    }
  }, [user, initializing]);

  const onSignIn = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password.');
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const onSignUp = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password.');
    setSubmitting(true);
    try {
      await signUp(email, password);
      Alert.alert('Account created', 'You are signed in.');
    } catch (e: any) {
      Alert.alert('Sign up failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const onGuest = async () => {
    setSubmitting(true);
    try {
      await signInGuest();
    } catch (e: any) {
      Alert.alert('Guest sign-in failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HaloFit Login</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={onSignIn} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onSignUp} disabled={submitting}>
        <Text style={styles.secondaryText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghostBtn} onPress={onGuest} disabled={submitting}>
        <Text style={styles.ghostText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: (Colors as any).light?.tint ?? '#d63384',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  primaryBtn: {
    backgroundColor: '#ff4da6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  secondaryText: {
    color: '#ff4da6',
    fontWeight: '600',
    fontSize: 16,
  },
  ghostBtn: {
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  ghostText: {
    color: '#666',
  },
});
