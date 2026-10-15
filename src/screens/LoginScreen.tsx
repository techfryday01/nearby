import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassBackground as SafeAreaView, GlassCard, GlassInput, GradientButton } from '../components/Glass';
import { DEVELOPMENT_AUTH_BYPASS } from '../lib/authConfig';
import { getSafeAuthMessage } from '../lib/authErrors';
import { supabase } from '../lib/supabase';
import { useProfile } from '../state/ProfileContext';
import { SecondMeetMark } from '../components/SecondMeetBrand';
import { useTheme } from '../theme/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { refreshProfile } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const normalizedEmail = email.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const canContinue = DEVELOPMENT_AUTH_BYPASS ? true : isValidEmail && password.length >= 6;

  const handleLogin = async () => {
    if (!canContinue || isSubmitting) return;

    if (DEVELOPMENT_AUTH_BYPASS) {
      router.replace('/create-profile');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    let signedIn = false;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage(getSafeAuthMessage(error));
        return;
      }

      if (!data.session) {
        setMessage('Check your email to verify your account before continuing.');
        return;
      }

      signedIn = true;
      const hasProfile = await refreshProfile();
      router.replace(hasProfile ? '/discovery' : '/create-profile');
    } catch (error) {
      setMessage(
        signedIn
          ? 'You are signed in, but your profile could not be loaded. Check your connection and try again.'
          : getSafeAuthMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return <SafeAreaView style={styles.page}>
    <StatusBar barStyle={colors.text === '#F7F7FC' ? 'light-content' : 'dark-content'} />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <View style={styles.hero}><SecondMeetMark size={92} /><Text style={styles.title}>Welcome Back</Text><Text style={styles.subtitle}>Log in to continue your journey on SecondMeet.</Text></View>
        <GlassCard style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <GlassInput value={email} onChangeText={(value) => { setEmail(value); setMessage(''); }} accessibilityLabel="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" style={styles.input} />
          <Text style={styles.label}>Password</Text>
          <View style={styles.password}>
            <GlassInput value={password} onChangeText={(value) => { setPassword(value); setMessage(''); }} accessibilityLabel="Password" placeholder="Your password" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" style={styles.passwordInput} onSubmitEditing={handleLogin} />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)} style={styles.visibility}><Text style={styles.link}>{showPassword ? 'Hide' : 'Show'}</Text></TouchableOpacity>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={() => setMessage('Password recovery is not configured in this build yet. No reset email has been sent.')} style={styles.forgot}><Text style={styles.link}>Forgot password?</Text></TouchableOpacity>
          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
          <GradientButton disabled={!canContinue || isSubmitting} onPress={handleLogin} style={styles.login}><Text style={styles.buttonText}>{isSubmitting ? 'Logging in…' : DEVELOPMENT_AUTH_BYPASS ? 'Continue in development' : 'Log In'}</Text></GradientButton>
        </GlassCard>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/age-verification')} style={styles.signup}><Text style={styles.subtitle}>New to SecondMeet? <Text style={styles.link}>Sign Up</Text></Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
function makeStyles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
 page:{flex:1},flex:{flex:1},scroll:{flexGrow:1,padding:24,paddingBottom:32,width:'100%',maxWidth:520,alignSelf:'center'},back:{width:44,height:44,borderRadius:22,backgroundColor:c.surface,alignItems:'center',justifyContent:'center'},backText:{color:c.text,fontSize:30},
 hero:{alignItems:'center',paddingTop:22,paddingBottom:28},title:{color:c.text,fontSize:26,fontWeight:'700',marginTop:18},subtitle:{color:c.muted,fontSize:14,lineHeight:21,textAlign:'center',marginTop:8},form:{padding:20},label:{color:c.text,fontSize:13,fontWeight:'600',marginBottom:8},input:{marginBottom:18},password:{position:'relative'},passwordInput:{paddingRight:70},visibility:{position:'absolute',right:3,top:3,minWidth:62,minHeight:50,alignItems:'center',justifyContent:'center'},link:{color:c.accent,fontWeight:'700',fontSize:13},forgot:{minHeight:44,alignItems:'flex-end',justifyContent:'center'},message:{color:c.danger,fontSize:13,lineHeight:20,marginBottom:14},login:{marginTop:6},buttonText:{color:'#FFFFFF',fontSize:16,fontWeight:'800'},signup:{minHeight:54,justifyContent:'center',marginTop:15}
}); }
