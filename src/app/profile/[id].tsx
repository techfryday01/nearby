import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GlassBackground as SafeAreaView, GlassCard, GradientButton } from '../../components/Glass';
import { useMatches } from '../../state/MatchContext';
import { processLikeAction, type LikeAction } from '../../lib/matchRepository';
import { useTheme } from '../../theme/ThemeContext';
import { loadDiscoveryPhotoUrls } from '../../lib/profilePhotoRepository';

function first(value: string | string[] | undefined): string { return Array.isArray(value) ? value[0] ?? '' : value ?? ''; }

export default function DiscoveryProfileScreen() {
  const p = useLocalSearchParams<{ id?: string | string[]; name?: string | string[]; age?: string | string[]; gender?: string | string[]; interests?: string | string[]; bio?: string | string[]; mock?: string | string[]; matchOnLike?: string | string[]; photoUri?: string | string[] }>();
  const router = useRouter();
  const { addMatch } = useMatches();
  const { colors } = useTheme();
  const s = styles(colors);
  const [busy, setBusy] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const id = first(p.id);
  const name = first(p.name) || 'SecondMeet member';
  const age = first(p.age);
  const gender = first(p.gender);
  let interests: string[] = [];
  try { const parsed: unknown = JSON.parse(first(p.interests) || '[]'); if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) interests = parsed; } catch { interests = []; }
  const isMock = first(p.mock) === 'true';

  useEffect(() => {
    if (isMock || !id) return;
    let active = true;
    loadDiscoveryPhotoUrls(id).then((photos) => { if (active) setGallery(photos); }).catch((error: unknown) => {
      console.warn('[Profile] Gallery unavailable; keeping the main photo only.', error);
    });
    return () => { active = false; };
  }, [id, isMock]);

  const demoPhoto = isMock ? ({
    'demo-maya': require('../../../assets/demo-profiles/maya.png'),
    'demo-nina': require('../../../assets/demo-profiles/nina.png'),
    'demo-isha': require('../../../assets/demo-profiles/isha.png'),
    'demo-tara': require('../../../assets/demo-profiles/tara.png'),
  } as Record<string, number>)[id] : undefined;
  const mainPhoto = demoPhoto ?? (first(p.photoUri) || gallery[0] || '');

  const act = async (action: LikeAction) => {
    if (!id || busy) return;
    setBusy(true);
    try {
      let matched = isMock && action === 'like' && first(p.matchOnLike) === 'true';
      if (!isMock) {
        const result = await processLikeAction(id, action);
        matched = result.authenticated && result.matched;
      }
      if (matched && action !== 'pass') {
        await addMatch({ id, name, age: Number(age) || 18, initials: name.trim().charAt(0).toUpperCase() || '?', color: colors.accent, photoUri: first(p.photoUri) || undefined });
        router.replace('/matches');
      } else router.back();
    } catch {
      Alert.alert('Could not save your action', 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={s.page}>
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back to discovery" onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹</Text></Pressable>
        <View style={s.photo}>{mainPhoto ? <Image source={typeof mainPhoto === 'number' ? mainPhoto : { uri: mainPhoto }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <><Text style={s.initial}>{name.trim().charAt(0).toUpperCase() || '?'}</Text><Text style={s.photoNote}>Profile photo not available</Text></>}</View>
        {isMock ? <Text style={s.demoTag}>FICTIONAL DEMO PROFILE</Text> : null}
        {!isMock && gallery.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.gallery}>{gallery.slice(1).map((photo, index) => <Image key={`${photo}-${index}`} source={{ uri: photo }} style={s.galleryImage} resizeMode="cover" />)}</ScrollView> : null}
        <View style={s.heading}><Text style={s.name}>{name}{age ? `, ${age}` : ''}</Text>{gender ? <Text style={s.muted}>{gender}</Text> : null}</View>
        {first(p.bio) ? <GlassCard style={s.panel}><Text style={s.label}>ABOUT</Text><Text style={s.bio}>{first(p.bio)}</Text></GlassCard> : <GlassCard style={s.panel}><Text style={s.label}>ABOUT</Text><Text style={s.muted}>No bio has been shared yet.</Text></GlassCard>}
        {interests.length > 0 ? <GlassCard style={s.panel}><Text style={s.label}>INTERESTS</Text><View style={s.chips}>{interests.map((item) => <Text key={item} style={s.chip}>{item}</Text>)}</View></GlassCard> : null}
        <View style={s.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Pass on profile" disabled={busy} onPress={() => act('pass')} style={s.pass}><Text style={s.passText}>Pass</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Super like profile" disabled={busy} onPress={() => act('super_like')} style={s.super}><Text style={s.superText}>★</Text></Pressable>
          <GradientButton accessibilityRole="button" accessibilityLabel="Like profile" disabled={busy} onPress={() => act('like')} style={s.like}><Text style={s.likeText}>{busy ? '…' : '♥'}</Text></GradientButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function styles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background }, content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface }, backText: { color: c.text, fontSize: 32, marginTop: -5 },
  photo: { minHeight: 380, maxHeight: 520, marginTop: 14, borderRadius: 26, backgroundColor: c.backgroundRaised, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, initial: { color: c.accent, fontSize: 112, fontWeight: '200' }, photoNote: { color: c.subtle, fontSize: 12, position: 'absolute', bottom: 17 }, demoTag: { color: c.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 9 }, gallery: { gap: 10, paddingVertical: 14 }, galleryImage: { width: 126, height: 160, borderRadius: 16, backgroundColor: c.surfaceStrong },
  heading: { paddingVertical: 20 }, name: { color: c.text, fontSize: 30, fontWeight: '800' }, muted: { color: c.muted, fontSize: 14, marginTop: 6 }, panel: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 18, marginBottom: 12 }, label: { color: c.subtle, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, bio: { color: c.text, fontSize: 15, lineHeight: 23, marginTop: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }, chip: { color: c.accent, backgroundColor: c.accentSoft, borderRadius: 13, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 12 }, pass: { minWidth: 86, minHeight: 52, borderRadius: 17, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }, passText: { color: c.muted, fontWeight: '700' }, super: { width: 54, height: 54, borderRadius: 27, backgroundColor: c.surfaceStrong, borderWidth: 1, borderColor: c.blue, alignItems: 'center', justifyContent: 'center' }, superText: { color: c.blue, fontSize: 22 }, like: { width: 58, height: 58, borderRadius: 29, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }, likeText: { color: c.onAccent, fontSize: 25 },
}); }
