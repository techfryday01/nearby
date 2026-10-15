import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GlassBackground as SafeAreaView, GradientButton } from '../../components/Glass';
import { getSafeAuthMessage } from '../../lib/authErrors';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import { useProfile } from '../../state/ProfileContext';

export default function AuthCallbackScreen() {
  const { refreshProfile } = useProfile();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { code, error, error_description: errorDescription } = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [exchangeErrorMessage, setExchangeErrorMessage] = useState<string | null>(null);
  const handledCode = useRef<string | null>(null);
  const authCode = Array.isArray(code) ? code[0] : code;
  const callbackError = Array.isArray(error) ? error[0] : error;
  const callbackErrorDescription = Array.isArray(errorDescription)
    ? errorDescription[0]
    : errorDescription;
  const hasError = Boolean(callbackError || exchangeErrorMessage || !authCode);
  const message = callbackError
    ? getSafeAuthMessage({ message: callbackErrorDescription || callbackError })
    : !authCode
      ? 'This verification link is missing its authentication code. Request a new email and try again.'
      : exchangeErrorMessage ?? 'Completing your secure sign-in…';

  useEffect(() => {
    if (callbackError || !authCode || handledCode.current === authCode) return;

    handledCode.current = authCode;

    const completeVerification = async () => {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
      if (exchangeError) {
        setExchangeErrorMessage(getSafeAuthMessage(exchangeError));
        return;
      }

      const hasProfile = await refreshProfile();
      router.replace(hasProfile ? '/discovery' : '/create-profile');
    };

    completeVerification().catch(() => {
      setExchangeErrorMessage(
        'Unable to verify your email right now. Please open the link again or request a new one.',
      );
    });
  }, [authCode, callbackError, refreshProfile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{hasError ? 'Sign-in failed' : 'Welcome to SecondMeet'}</Text>
        <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
        {hasError ? (
          <GradientButton style={styles.button} onPress={() => router.replace('/create-account')}>
            <Text style={styles.buttonText}>Back to Create Account</Text>
          </GradientButton>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { color: c.text, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  message: { color: c.muted, fontSize: 15, lineHeight: 23, marginTop: 14, textAlign: 'center' },
  button: {
    alignItems: 'center',
    backgroundColor: c.accent,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 28,
    minHeight: 54,
  },
  buttonText: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
}); }
