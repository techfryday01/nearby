import { useProfile } from '../state/ProfileContext';
import { BottomNav } from '../components/BottomNav';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GlassBackground as SafeAreaView, GlassCard } from '../components/Glass';
import { useTheme, type ThemeMode } from '../theme/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, colors, setMode } = useTheme();
  const s = styles(colors);
  const { isAuthenticated, signOut } = useProfile();
  const logOut = async () => {
    try { await signOut(); router.replace('/'); }
    catch { Alert.alert('Could not sign out', 'Please check your connection and try again.'); }
  };
  const choose = (value: ThemeMode) => { void setMode(value); };

  return (
    <SafeAreaView style={s.page}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={s.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back to profile" onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹</Text></Pressable>
        <Text style={s.title}>Settings</Text>
        <Text style={s.subtitle}>Make SecondMeet feel like yours.</Text>
        <GlassCard style={s.panel}>
          <Text style={s.panelTitle}>Appearance</Text>
          <Text style={s.copy}>Choose the look you prefer. Your choice stays on this device.</Text>
          <View style={s.options}>
            {(['dark', 'light'] as const).map((item) => {
              const active = mode === item;
              return <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => choose(item)} style={[s.option, active && s.optionActive]}><Text style={s.optionIcon}>{item === 'dark' ? '☾' : '☼'}</Text><Text style={s.optionText}>{item === 'dark' ? 'Dark' : 'Light'}</Text><Text style={s.optionHint}>{item === 'dark' ? 'Midnight + neon' : 'Pastel + soft'}</Text></Pressable>;
            })}
          </View>
        </GlassCard>
        <GlassCard style={s.info}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/profile')} style={s.settingRow}><Text style={s.infoTitle}>Account & profile</Text><Text style={s.infoTitle}>›</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/create-profile')} style={s.settingRow}><Text style={s.infoTitle}>Edit profile & photos</Text><Text style={s.infoTitle}>›</Text></Pressable>
          {isAuthenticated ? <Pressable accessibilityRole="button" onPress={logOut} style={s.settingRow}><Text style={[s.infoTitle, {color: colors.danger}]}>Log Out</Text><Text style={s.infoTitle}>›</Text></Pressable> : null}
        </GlassCard>
      </ScrollView>
      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

function styles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background }, content: { flexGrow: 1, paddingBottom: 22, paddingHorizontal: 22, paddingTop: 12 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, backText: { color: c.text, fontSize: 32, lineHeight: 35, marginTop: -5 },
  eyebrow: { color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 28 }, title: { color: c.text, fontSize: 27, fontWeight: '700', marginTop: 18 }, subtitle: { color: c.muted, fontSize: 15, marginTop: 8 },
  panel: { padding: 19, marginTop: 30, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 22, shadowColor: c.shadow, shadowOpacity: 0.08, shadowRadius: 15, elevation: 2 }, panelTitle: { color: c.text, fontSize: 18, fontWeight: '800' }, copy: { color: c.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  options: { flexDirection: 'row', gap: 12, marginTop: 18 }, option: { flex: 1, minHeight: 112, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceStrong, alignItems: 'center', justifyContent: 'center', padding: 10 }, optionActive: { borderColor: c.accent, backgroundColor: c.accentSoft }, optionIcon: { color: c.accent, fontSize: 23 }, optionText: { color: c.text, fontSize: 15, fontWeight: '800', marginTop: 5 }, optionHint: { color: c.muted, fontSize: 10, marginTop: 3 },
  settingRow: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  info: { marginTop: 20, padding: 18, borderRadius: 16, backgroundColor: c.surface }, infoTitle: { color: c.text, fontWeight: '700', fontSize: 15 },
}); }
