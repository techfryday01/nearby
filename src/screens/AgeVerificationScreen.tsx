import React, { useState } from 'react';
import {
  Alert,
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

export default function AgeVerificationScreen() {
  const router = useRouter();
  const [dateOfBirth, setDateOfBirth] = useState('');

  const validateAge = () => {
    const parts = dateOfBirth.trim().split('/');

    if (parts.length !== 3) {
      Alert.alert(
        'Enter your date of birth',
        'Please use the format DD/MM/YYYY.'
      );
      return;
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year) ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1900
    ) {
      Alert.alert(
        'Invalid date',
        'Please enter a valid date of birth.'
      );
      return;
    }

    const birthDate = new Date(year, month - 1, day);

    if (
      birthDate.getFullYear() !== year ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day
    ) {
      Alert.alert(
        'Invalid date',
        'Please enter a real calendar date.'
      );
      return;
    }

    const today = new Date();

    let age = today.getFullYear() - year;

    const birthdayPassed =
      today.getMonth() > month - 1 ||
      (
        today.getMonth() === month - 1 &&
        today.getDate() >= day
      );

    if (!birthdayPassed) {
      age -= 1;
    }

    if (age < 18) {
      Alert.alert(
        'Sorry',
        'Nearby is currently available only to people aged 18 or older.'
      );
      return;
    }

    router.push('/create-account');
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
              Before we continue
            </Text>

            <Text style={styles.subtitle}>
              Nearby is an adults-only dating and social
              connection app. Please enter your date of birth.
            </Text>

            <Text style={styles.label}>
              Date of birth
            </Text>

            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#666671"
              keyboardType="number-pad"
              maxLength={10}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.helper}>
              Your exact date of birth will not be displayed
              on your profile.
            </Text>

          </View>

          {/* BOTTOM */}
          <View style={styles.bottom}>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={validateAge}
            >
              <Text style={styles.primaryButtonText}>
                Continue
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              By continuing, you confirm that the information
              you provide is accurate.
            </Text>

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
    backgroundColor: '#17171E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 36,
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

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#241522',
    borderWidth: 1.5,
    borderColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  iconText: {
    color: '#E83E8C',
    fontSize: 20,
    fontWeight: '800',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    marginBottom: 14,
  },

  subtitle: {
    color: '#A9A9B2',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 36,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },

  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#35353F',
    backgroundColor: '#121219',
    color: '#FFFFFF',
    fontSize: 17,
    paddingHorizontal: 18,
  },

  helper: {
    color: '#6F6F79',
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
    borderRadius: 18,
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  footer: {
    color: '#666671',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 330,
  },
});