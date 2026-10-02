import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackScreen() {
  const { code, error, error_description: errorDescription } = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [message, setMessage] = useState('Verifying your email…');
  const [hasError, setHasError] = useState(false);
  const handledCode = useRef<string | null>(null);

  useEffect(() => {
    const authCode = Array.isArray(code) ? code[0] : code;
    const callbackError = Array.isArray(error) ? error[0] : error;
    const callbackErrorDescription = Array.isArray(errorDescription)
      ? errorDescription[0]
      : errorDescription;

    if (callbackError) {
      setHasError(true);
      setMessage(callbackErrorDescription || 'The email verification link could not be used.');
      return;
    }

    if (!authCode || handledCode.current === authCode) {
      if (!authCode) {
        setHasError(true);
        setMessage('This verification link is missing its authentication code. Request a new email and try again.');
      }
      return;
    }

    handledCode.current = authCode;

    const completeVerification = async () => {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
      if (exchangeError) {
        setHasError(true);
        setMessage(exchangeError.message);
        return;
      }

      router.replace('/create-profile');
    };

    completeVerification().catch(() => {
      setHasError(true);
      setMessage('Unable to verify your email right now. Please open the link again or request a new one.');
    });
  }, [code, error, errorDescription]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{hasError ? 'Verification failed' : 'Welcome to Nearby'}</Text>
        <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
        {hasError ? (
          <Pressable style={styles.button} onPress={() => router.replace('/create-account')}>
            <Text style={styles.buttonText}>Back to Create Account</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090D' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', textAlign: 'center' },
  message: { color: '#A9A9B2', fontSize: 15, lineHeight: 23, marginTop: 14, textAlign: 'center' },
  button: {
    alignItems: 'center',
    backgroundColor: '#E83E8C',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 28,
    minHeight: 54,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
