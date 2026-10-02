import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#09090D"
      />

      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoSymbol}>N</Text>
        </View>

        <Text style={styles.logo}>Nearby</Text>

        <Text style={styles.headline}>
          Real People.{'\n'}
          <Text style={styles.accent}>
            Real Connections.
          </Text>
        </Text>

        <Text style={styles.subtitle}>
          Discover people around you and start a genuine
          conversation.
        </Text>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.push('/age-verification')}
        >
          <Text style={styles.primaryButtonText}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>
            I already have an account
          </Text>
        </TouchableOpacity>

        <Text style={styles.ageNotice}>
          18+ • Dating & social connections
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090D',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 50,
    paddingBottom: 24,
  },

  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  logoSymbol: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  headline: {
    width: '100%',
    marginTop: 90,
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -1,
  },

  accent: {
    color: '#E83E8C',
  },

  subtitle: {
    color: '#A9A9B2',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 22,
    maxWidth: 330,
  },

  spacer: {
    flex: 1,
  },

  primaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  secondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#34343D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#E5E5EA',
    fontSize: 15,
    fontWeight: '600',
  },

  ageNotice: {
    color: '#6F6F79',
    fontSize: 12,
    marginTop: 18,
  },
});