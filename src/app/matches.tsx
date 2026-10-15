import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GlassBackground as SafeAreaView, GlassCard, GradientButton } from '../components/Glass';
import { BottomNav, BrandHeader } from '../components/BottomNav';
import { useMatches } from '../state/MatchContext';
import { useTheme } from '../theme/ThemeContext';
import { demoProfilePhoto } from '../components/demoProfilePhoto';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, isMatchesLoaded } = useMatches();
  const { colors } = useTheme();
  const s = styles(colors);

  return (
    <SafeAreaView style={s.page}>
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <BrandHeader />
        <Text style={s.title}>Matches</Text>
        <Text style={s.subtitle}>{!isMatchesLoaded ? 'Loading your matches…' : matches.length ? 'A little spark could turn into something great.' : 'Your connections will show up here.'}</Text>
        {!isMatchesLoaded ? <GlassCard style={s.empty}><Text style={s.copy}>Loading matches…</Text></GlassCard> : matches.length ? (
          <View style={s.list}>{matches.map((match) => <Pressable key={match.id} accessibilityRole="button" accessibilityLabel={`Open chat with ${match.name}, ${match.age}`} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: match.id } })} style={({ pressed }) => [s.card, pressed && s.pressed]}>
            <View style={[s.avatar, { backgroundColor: match.color }]}>{match.photoUri ? <Image source={{ uri: match.photoUri }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /> : demoProfilePhoto(match.id) ? <Image source={demoProfilePhoto(match.id)!} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Text style={s.initial}>{match.initials}</Text>}</View>
            <View style={s.info}><Text style={s.name}>{match.name}, {match.age}</Text><Text style={s.copy}>You matched! Say hello.</Text></View><Text style={s.chevron}>›</Text>
          </Pressable>)}</View>
        ) : <GlassCard style={s.empty}><Text style={s.heart}>♡</Text><Text style={s.emptyTitle}>No matches yet</Text><Text style={s.copy}>Keep discovering people. When you match, you’ll find them here.</Text><GradientButton accessibilityRole="button" onPress={() => router.push('/discovery')} style={s.button}><Text style={s.buttonText}>Discover people</Text></GradientButton></GlassCard>}
      </ScrollView>
      <BottomNav active="matches" />
    </SafeAreaView>
  );
}

function styles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background }, content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 7, paddingBottom: 22 }, eyebrow: { color: c.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginTop: 24 }, title: { color: c.text, fontSize: 27, fontWeight: '700', marginTop: 18 }, subtitle: { color: c.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 22 },
  list: { gap: 11 }, card: { minHeight: 82, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, avatar: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, initial: { color: c.onAccent, fontSize: 22, fontWeight: '700' }, info: { flex: 1, marginLeft: 13 }, name: { color: c.text, fontSize: 15, fontWeight: '800' }, copy: { color: c.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 }, chevron: { color: c.subtle, fontSize: 24, paddingHorizontal: 6 },
  empty: { minHeight: 360, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, borderRadius: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, heart: { color: c.accent, fontSize: 43 }, emptyTitle: { color: c.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 11 }, button: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 15, backgroundColor: c.accent, marginTop: 22 }, buttonText: { color: c.onAccent, fontWeight: '800', fontSize: 14 }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
}); }
