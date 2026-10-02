import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function CreateAccountScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const normalizedEmail = email.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const canContinue = isValidEmail && password.length >= 6;

  const handleCreateAccount = async () => {
    if (!canContinue || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: 'nearby://auth/callback',
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.session) {
        setMessage('Check your email to verify your account before continuing.');
        return;
      }

      router.push('/create-profile');
    } catch {
      setMessage('Unable to create your account right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#09090D"
      />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>

          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.stepText}>
              2 of 4
            </Text>
          </View>

          {/* Main */}
          <View style={styles.main}>

            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>N</Text>
            </View>

            <Text style={styles.title}>
              Create your account
            </Text>

            <Text style={styles.subtitle}>
              Join Nearby and start meeting real people
              around you.
            </Text>

            {/* Email */}
            <Text style={styles.label}>
              Email address
            </Text>

            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setMessage('');
              }}
              placeholder="Enter your email"
              placeholderTextColor="#666671"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            {/* Password */}
            <Text style={styles.label}>
              Password
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
              onChangeText={(value) => {
                setPassword(value);
                setMessage('');
              }}
                placeholder="At least 6 characters"
                placeholderTextColor="#666671"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.passwordInput}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(!showPassword)
                }
                style={styles.showButton}
              >
                <Text style={styles.showText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helper}>
              Use a password you don't use anywhere else.
            </Text>

            {/* Terms */}
            <Text style={styles.terms}>
              By creating an account, you agree to Nearby's
              Terms of Service and Privacy Policy.
            </Text>

            {message ? (
              <Text accessibilityRole="alert" style={styles.message}>
                {message}
              </Text>
            ) : null}

          </View>

          {/* Bottom */}
          <View style={styles.bottom}>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canContinue || isSubmitting) && styles.disabledButton,
              ]}
              activeOpacity={0.85}
              disabled={!canContinue || isSubmitting}
              onPress={handleCreateAccount}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginAccent}>
                  Log in
                </Text>
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090D',
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#17171E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
    marginTop: -4,
  },

  stepText: {
    color: '#777783',
    fontSize: 13,
    fontWeight: '600',
  },

  main: {
    flex: 1,
    justifyContent: 'center',
  },

  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    marginBottom: 12,
  },

  subtitle: {
    color: '#A9A9B2',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },

  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#35353F',
    backgroundColor: '#121219',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 18,
  },

  passwordContainer: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#35353F',
    backgroundColor: '#121219',
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 18,
  },

  showButton: {
    paddingHorizontal: 16,
  },

  showText: {
    color: '#E83E8C',
    fontSize: 14,
    fontWeight: '600',
  },

  helper: {
    color: '#666671',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },

  terms: {
    color: '#666671',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 24,
  },

  message: {
    color: '#F28BB9',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },

  bottom: {
    alignItems: 'center',
  },

  primaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  loginButton: {
    marginTop: 16,
    paddingVertical: 8,
  },

  loginText: {
    color: '#8A8A95',
    fontSize: 14,
  },

  loginAccent: {
    color: '#E83E8C',
    fontWeight: '700',
  },
});
