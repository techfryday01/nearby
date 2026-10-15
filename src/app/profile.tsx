import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GlassBackground as SafeAreaView, GlassCard } from '../components/Glass';
import { BottomNav, BrandHeader } from '../components/BottomNav';
import { useProfile } from '../state/ProfileContext';
import { useTheme } from '../theme/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isAuthenticated, signOut } = useProfile();
  const { colors } = useTheme();
  const s = styles(colors);
  const initials = profile?.name?.trim().charAt(0).toUpperCase() || 'S';

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch {
      // Keep the account screen available if the remote sign-out cannot complete.
    }
  };

  return (
    <SafeAreaView style={s.page}>
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <BrandHeader trailing={<Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={s.settings}><Text style={s.settingsGlyph}>⚙</Text></Pressable>} />
        <Text style={s.title}>Profile</Text>
        <GlassCard style={s.hero}>
          <View style={s.avatar}>
            {profile?.profilePhotoUri ? <Image source={{ uri: profile.profilePhotoUri }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" /> : <Text style={s.initial}>{initials}</Text>}
          </View>
          <Text style={s.name}>{profile?.name || 'Your profile'}</Text>
          <Text style={s.caption}>{profile?.gender || 'Add a little about yourself'}</Text>
        </GlassCard>
        <GlassCard style={s.panel}>
          <Text style={s.label}>INTERESTS</Text>
          {profile?.selectedInterests.length ? <View style={s.chips}>{profile.selectedInterests.map((item) => <Text key={item} style={s.chip}>{item}</Text>)}</View> : <Text style={s.empty}>Your chosen interests will appear here.</Text>}
        </GlassCard>
        <Pressable accessibilityRole="button" onPress={() => router.push('/create-profile')} style={s.row}><Text style={s.rowText}>Edit profile</Text><Text style={s.chevron}>›</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={s.row}><Text style={s.rowText}>Settings and appearance</Text><Text style={s.chevron}>›</Text></Pressable>
        {isAuthenticated ? <Pressable accessibilityRole="button" onPress={handleSignOut} style={s.signOut}><Text style={s.signOutText}>Sign out</Text></Pressable> : null}
      </ScrollView>
      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

function styles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: c.background }, scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22 },
    settings: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    settingsGlyph: { color: c.accent, fontSize: 21 }, eyebrow: { color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 26 },
    title: { color: c.text, fontSize: 27, fontWeight: '700', marginTop: 18 }, hero: { alignItems: 'center', paddingVertical: 28, marginVertical: 20 },
    avatar: { width: 144, height: 144, borderRadius: 72, overflow: 'hidden', backgroundColor: c.accentSoft, borderWidth: 2, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    initial: { color: c.accent, fontSize: 58, fontWeight: '300' }, name: { color: c.text, fontSize: 23, fontWeight: '800', marginTop: 14 }, caption: { color: c.muted, fontSize: 14, marginTop: 5 },
    panel: { padding: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 22, marginBottom: 14 }, label: { color: c.subtle, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
    chip: { color: c.accent, backgroundColor: c.accentSoft, borderRadius: 13, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontWeight: '700' }, empty: { color: c.muted, marginTop: 10, fontSize: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }, rowText: { color: c.text, fontSize: 15, fontWeight: '600' }, chevron: { color: c.subtle, fontSize: 23 },
    signOut: { alignItems: 'center', paddingVertical: 18 }, signOutText: { color: c.danger, fontWeight: '700' },
  });
}
