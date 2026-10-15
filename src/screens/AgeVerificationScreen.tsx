import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassBackground as SafeAreaView, GradientButton } from '../components/Glass';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { DateOfBirthInput, validateAdultDateOfBirth } from '../components/DateOfBirthInput';

export default function AgeVerificationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [dateOfBirth, setDateOfBirth] = useState('');

  const validateAge = () => {
    const validationError = validateAdultDateOfBirth(dateOfBirth);
    if (validationError) {
      Alert.alert(validationError.includes('18 or older') ? 'Sorry' : 'Invalid date', validationError);
      return;
    }

    router.push('/create-account');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* TOP BAR */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.stepText}>
              1 of 4
            </Text>
          </View>

          {/* MAIN CONTENT */}
          <View style={styles.main}>

            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>
                18+
              </Text>
            </View>

            <Text style={styles.title}>
              Let’s verify your age
            </Text>

            <Text style={styles.subtitle}>
              You must be at least 18 years old
              to use SecondMeet.
            </Text>

            <Text style={styles.label}>
              Date of birth
            </Text>

            <DateOfBirthInput value={dateOfBirth} onChangeText={setDateOfBirth} />

            <Text style={styles.helper}>
              Your exact date of birth will not be displayed
              on your profile.
            </Text>

          </View>

          {/* BOTTOM */}
          <View style={styles.bottom}>

            <GradientButton
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={validateAge}
            >
              <Text style={styles.primaryButtonText}>
                Continue
              </Text>
            </GradientButton>

            <Text style={styles.footer}>
              By continuing, you confirm that the information
              you provide is accurate.
            </Text>

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
    paddingBottom: 24,
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
    fontSize: 34,
    lineHeight: 36,
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

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: c.accentSoft,
    borderWidth: 1.5,
    borderColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    alignSelf: 'center',
  },

  iconText: {
    color: c.accent,
    fontSize: 20,
    fontWeight: '800',
  },

  title: {
    color: c.text,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 14,
  },

  subtitle: {
    color: c.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 36,
  },

  label: {
    color: c.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },

  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.input,
    color: c.text,
    fontSize: 17,
    paddingHorizontal: 18,
  },

  helper: {
    color: c.subtle,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
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

  primaryButtonText: {
    color: c.onAccent,
    fontSize: 17,
    fontWeight: '700',
  },

  footer: {
    color: c.subtle,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 330,
  },
}); }
