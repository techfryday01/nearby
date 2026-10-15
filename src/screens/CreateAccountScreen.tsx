import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassBackground as SafeAreaView, GlassCard, GradientButton } from '../components/Glass';
import { useRouter, type Href } from 'expo-router';
import { DEVELOPMENT_AUTH_BYPASS } from '../lib/authConfig';
import { getSafeAuthMessage } from '../lib/authErrors';
import { supabase } from '../lib/supabase';
import { SecondMeetMark } from '../components/SecondMeetBrand';
import { useTheme } from '../theme/ThemeContext';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

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
      if (DEVELOPMENT_AUTH_BYPASS) {
        router.push('/create-profile');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: 'nearby://auth/callback',
        },
      });

      if (error) {
        setMessage(getSafeAuthMessage(error));
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
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

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

            <View style={{ alignItems: 'center', marginBottom: 18 }}><SecondMeetMark size={62} /></View>

            <Text style={styles.title}>
              Create your account
            </Text>

            <Text style={styles.subtitle}>
              Join SecondMeet and start meeting real people
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
              placeholderTextColor={colors.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            {/* Password */}
            <Text style={styles.label}>
              Password
            </Text>

            <GlassCard style={styles.passwordContainer}>
              <TextInput
                value={password}
              onChangeText={(value) => {
                setPassword(value);
                setMessage('');
              }}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.subtle}
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
            </GlassCard>

            <Text style={styles.helper}>
              Use a password you don&apos;t use anywhere else.
            </Text>

            {/* Terms */}
            <Text style={styles.terms}>
              By creating an account, you agree to SecondMeet&apos;s
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

            <GradientButton
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
            </GradientButton>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  DEVELOPMENT_AUTH_BYPASS ? '/create-profile' : ('/login' as Href),
                )
              }
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginAccent}>
                  Log in
                </Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    width: '100%', maxWidth: 520, alignSelf: 'center',
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
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: c.text,
    fontSize: 32,
    lineHeight: 34,
    marginTop: -4,
  },

  stepText: {
    color: c.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  main: {
    flexGrow: 1,
    paddingVertical: 28,
    justifyContent: 'center',
  },

  title: {
    color: c.text,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },

  subtitle: {
    color: c.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },

  label: {
    color: c.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },

  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.input,
    color: c.text,
    fontSize: 16,
    paddingHorizontal: 18,
  },

  passwordContainer: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.input,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    color: c.text,
    fontSize: 16,
    paddingHorizontal: 18,
  },

  showButton: {
    paddingHorizontal: 16,
  },

  showText: {
    color: c.accent,
    fontSize: 14,
    fontWeight: '600',
  },

  helper: {
    color: c.subtle,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },

  terms: {
    color: c.subtle,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 24,
  },

  message: {
    color: c.accent,
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
    borderRadius: 28,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  primaryButtonText: {
    color: c.onAccent,
    fontSize: 17,
    fontWeight: '700',
  },

  loginButton: {
    marginTop: 16,
    paddingVertical: 8,
  },

  loginText: {
    color: c.muted,
    fontSize: 14,
  },

  loginAccent: {
    color: c.accent,
    fontWeight: '700',
  },
}); }
