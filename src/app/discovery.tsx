import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { GlassBackground as SafeAreaView, GlassCard, GradientButton } from '../components/Glass';
import { BottomNav, BrandHeader } from '../components/BottomNav';
import { fetchDiscoveryProfiles, type DiscoveryProfileRow, type DiscoveryFilters } from '../lib/discoveryRepository';
import { processLikeAction, type LikeAction } from '../lib/matchRepository';
import { useMatches } from '../state/MatchContext';
import { useProfile } from '../state/ProfileContext';
import { useTheme } from '../theme/ThemeContext';
import { DEMO_PROFILES_ENABLED } from '../lib/demoConfig';

type Profile = { id: string; name: string; age: number; bio: string; interests: string[]; initials: string; color: string; matchOnLike: boolean; source?: 'supabase'; gender?: string; photoUri?: ImageSourcePropType | string };

const MOCK_PROFILES: Profile[] = [
  { id: 'demo-maya', name: 'Maya', age: 26, bio: 'Always looking for a new place to eat, a live show, or a reason to get outdoors.', interests: ['Live music', 'Food', 'Weekend trips'], initials: 'M', color: '#563146', matchOnLike: true, photoUri: require('../../assets/demo-profiles/maya.png') },
  { id: 'demo-nina', name: 'Nina', age: 24, bio: 'Gallery afternoons, slow coffee, and making spontaneous plans with good people.', interests: ['Art', 'Coffee', 'Travel'], initials: 'N', color: '#554633', matchOnLike: true, photoUri: require('../../assets/demo-profiles/nina.png') },
  { id: 'demo-isha', name: 'Isha', age: 29, bio: 'A little bit of park time, a good playlist, and a new book keep me happy.', interests: ['Books', 'Music', 'Nature'], initials: 'I', color: '#304858', matchOnLike: false, photoUri: require('../../assets/demo-profiles/isha.png') },
  { id: 'demo-tara', name: 'Tara', age: 31, bio: 'I love trying new recipes and finding a quiet corner to watch the sunset.', interests: ['Cooking', 'Movies', 'Photography'], initials: 'T', color: '#76503d', matchOnLike: true, photoUri: require('../../assets/demo-profiles/tara.png') },
];
const DEVELOPMENT_MOCK_PROFILES = __DEV__ ? MOCK_PROFILES : [];
const FILTER_STORAGE_KEY = 'secondmeet.discovery-filters.v1';
const DEFAULT_FILTERS: DiscoveryFilters = { enabled: false, radiusKm: 30, countryMode: 'nearby', countryCode: null };
const COUNTRIES = [
  { code: 'IN', name: 'India' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BT', name: 'Bhutan' },
  { code: 'NP', name: 'Nepal' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' }, { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' }, { code: 'JP', name: 'Japan' }, { code: 'DE', name: 'Germany' },
];

function mapProfile(row: DiscoveryProfileRow): Profile {
  const name = row.display_name.trim();
  return { id: row.profile_id, name, age: row.age, bio: '', interests: row.interests, initials: name.charAt(0).toUpperCase() || '?', color: '#253858', matchOnLike: false, source: 'supabase', gender: row.gender, photoUri: row.main_photo_url };
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const { addMatch, isMatchesLoaded } = useMatches();
  const { profile: ownProfile } = useProfile();
  const { colors } = useTheme();
  const s = styles(colors);
  const [profiles, setProfiles] = useState<Profile[]>(DEVELOPMENT_MOCK_PROFILES);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [filtersReady, setFiltersReady] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [filterNotice, setFilterNotice] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FILTER_STORAGE_KEY).then((saved) => {
      if (saved) {
        const value: unknown = JSON.parse(saved);
        if (typeof value === 'object' && value !== null) {
          const stored = value as Partial<DiscoveryFilters>;
          setFilters({
            enabled: stored.enabled === true,
            radiusKm: [8, 10, 30, 50].includes(stored.radiusKm as number) ? stored.radiusKm as DiscoveryFilters['radiusKm'] : 30,
            countryMode: ['nearby', 'my_country', 'worldwide'].includes(stored.countryMode ?? '') ? stored.countryMode as DiscoveryFilters['countryMode'] : 'nearby',
            countryCode: typeof stored.countryCode === 'string' ? stored.countryCode : null,
          });
        }
      }
    }).catch(() => undefined).finally(() => setFiltersReady(true));
  }, []);

  useEffect(() => {
    let active = true;
    if (demoMode) {
      return () => { active = false; };
    }
    if (!filtersReady) return () => { active = false; };
    fetchDiscoveryProfiles(filters).then((rows) => {
      if (!active) return;
      if (rows.length) setProfiles(rows.map(mapProfile));
      else if (filters.enabled) setProfiles([]);
    }).catch((error: unknown) => {
      console.warn('[Discovery] Supabase list unavailable; keeping the sample profiles.', error);
      if (active && filters.enabled) setFilterNotice('Filters could not be applied. Sign in and save a location after the Supabase location migration is deployed; current cards remain unfiltered.');
    });
    return () => { active = false; };
  }, [filters, filtersReady, demoMode]);

  const updateFilters = (next: DiscoveryFilters) => {
    setFilters(next);
    setFilterNotice(next.enabled ? 'Applying filters…' : '');
    void AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(next)).catch(() => setFilterNotice('Filter preference could not be saved on this device.'));
  };

  const openProfile = (profile: Profile) => router.push({ pathname: '/profile/[id]', params: {
    id: profile.id, name: profile.name, age: String(profile.age), gender: profile.gender ?? '',
    interests: JSON.stringify(profile.interests), bio: profile.bio, mock: String(!profile.source), matchOnLike: String(profile.matchOnLike),
    photoUri: typeof profile.photoUri === 'string' ? profile.photoUri : '',
  } });

  const handleAction = async (profile: Profile, action: LikeAction) => {
    if (busyId) return;
    setBusyId(profile.id);
    try {
      let matched = false;
      if (profile.source === 'supabase') {
        const result = await processLikeAction(profile.id, action);
        matched = result.authenticated && result.matched;
      } else {
        matched = action === 'like' && profile.matchOnLike;
      }
      if (matched && action !== 'pass') {
        await addMatch({ id: profile.id, name: profile.name, age: profile.age, initials: profile.initials, color: profile.color, photoUri: typeof profile.photoUri === 'string' ? profile.photoUri : undefined });
      }
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      if (matched && action !== 'pass') router.push('/matches');
    } catch (error) {
      console.warn('[Discovery] Could not save the profile action.', error);
      Alert.alert('Could not save your action', 'We could not confirm that it was saved. Please try again.');
    } finally { setBusyId(null); }
  };

  return (
    <SafeAreaView style={s.page}>
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
      <View style={s.top}>
        <BrandHeader trailing={<Pressable accessibilityRole="button" accessibilityLabel="Open your profile" onPress={() => router.push('/profile')} style={s.profileMini}>{ownProfile?.profilePhotoUri ? <Image source={{ uri: ownProfile.profilePhotoUri }} style={StyleSheet.absoluteFill} /> : <Text style={s.profileInitial}>{ownProfile?.name?.charAt(0).toUpperCase() || 'S'}</Text>}</Pressable>} />
        <Text style={s.title}>Discover</Text>
        <Text style={s.subtitle}>Find your next meaningful connection.</Text>
        {DEMO_PROFILES_ENABLED ? <Pressable accessibilityRole="button" onPress={() => { setProfiles(demoMode ? [] : MOCK_PROFILES); setDemoMode(!demoMode); }} style={s.filterToggle}><Text style={s.filterToggleText}>{demoMode ? 'Demo mode · fictional profiles' : 'Testing: view demo profiles'}</Text><Text style={s.filterHint}>{demoMode ? 'Exit' : 'Open'}</Text></Pressable> : null}
        {demoMode ? <Text style={s.subtitle}>Sample people for testing only. Likes and chats stay on this device; location filters do not apply.</Text> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: filterPanelOpen }} onPress={() => setFilterPanelOpen((open) => !open)} style={s.filterToggle}><Text style={s.filterToggleText}>⌘  Filters</Text><Text style={s.filterHint}>{filters.enabled ? 'On' : 'Set search'}</Text></Pressable>
        {filterPanelOpen ? <GlassCard style={s.filterPanel}>
          <Text style={s.filterTitle}>Country</Text>
          <View style={s.filterOptions}>{([['nearby', 'Nearby'], ['my_country', 'My Country'], ['worldwide', 'Worldwide']] as const).map(([mode, label]) => <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: filters.countryMode === mode }} onPress={() => updateFilters({ ...filters, countryMode: mode, countryCode: mode === 'nearby' ? null : filters.countryCode, enabled: true })} style={[s.filterChip, filters.countryMode === mode && s.filterChipActive]}><Text style={[s.filterChipText, filters.countryMode === mode && s.filterChipTextActive]}>{label}</Text></Pressable>)}</View>
          {filters.countryMode === 'nearby' ? <>
            <Text style={s.filterTitle}>Nearby radius</Text>
            <View style={s.filterOptions}>{([8, 10, 30, 50] as const).map((radius) => <Pressable key={radius} accessibilityRole="button" accessibilityState={{ selected: filters.radiusKm === radius }} onPress={() => updateFilters({ ...filters, radiusKm: radius, enabled: true })} style={[s.filterChip, filters.radiusKm === radius && s.filterChipActive]}><Text style={[s.filterChipText, filters.radiusKm === radius && s.filterChipTextActive]}>{radius} km</Text></Pressable>)}</View>
          </> : null}
          {filters.countryMode === 'worldwide' ? <>
            <TextInput value={countrySearch} onChangeText={setCountrySearch} placeholder="Search country" placeholderTextColor={colors.subtle} style={s.countryInput} accessibilityLabel="Search countries" />
            <View style={s.filterOptions}>{COUNTRIES.filter((country) => country.name.toLowerCase().includes(countrySearch.trim().toLowerCase())).slice(0, 6).map((country) => <Pressable key={country.code} onPress={() => updateFilters({ ...filters, countryCode: country.code, enabled: true })} style={[s.filterChip, filters.countryCode === country.code && s.filterChipActive]}><Text style={[s.filterChipText, filters.countryCode === country.code && s.filterChipTextActive]}>{country.name}</Text></Pressable>)}</View>
          </> : null}
          <Text style={s.filterNote}>Location filters need a saved location. Exact coordinates are never displayed.</Text>
          {filterNotice ? <Text style={s.filterWarning}>{filterNotice}</Text> : null}
        </GlassCard> : null}
      </View>
        {profiles.length ? profiles.map((person) => (
          <GlassCard key={person.id} style={s.card}>
            <Pressable accessibilityRole="button" accessibilityLabel={`View ${person.name}, ${person.age}'s profile`} onPress={() => openProfile(person)} style={[s.photo, { backgroundColor: colors.backgroundRaised }]}>
              {person.photoUri ? <Image source={typeof person.photoUri === 'string' ? { uri: person.photoUri } : person.photoUri} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" /> : <><View style={[s.glow, { backgroundColor: person.source ? colors.blue : person.color }]} /><Text style={[s.bigInitial, { color: person.source ? colors.blue : colors.accent }]}>{person.initials}</Text><Text style={s.photoLabel}>PHOTO NOT AVAILABLE</Text></>}
              {!person.source ? <Text style={s.demoLabel}>DEMO</Text> : null}

            </Pressable>
            <View style={s.details}>
              <Pressable accessibilityRole="button" accessibilityLabel={`View ${person.name}`} onPress={() => openProfile(person)}><Text style={s.name}>{person.name}, {person.age}</Text></Pressable>
              {person.interests.length ? <View style={s.tags}>{person.interests.slice(0, 3).map((interest) => <Text key={interest} style={s.tag}>{interest}</Text>)}</View> : <Text style={s.emptyInterest}>No interests shared yet</Text>}
              <View style={s.actions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Pass on ${person.name}`} disabled={busyId === person.id} onPress={() => handleAction(person, 'pass')} style={s.pass}><Text style={s.passText}>×</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Super like ${person.name}`} disabled={busyId === person.id} onPress={() => handleAction(person, 'super_like')} style={s.super}><Text style={s.superText}>★</Text></Pressable>
                <GradientButton accessibilityRole="button" accessibilityLabel={`Like ${person.name}`} disabled={!isMatchesLoaded || busyId === person.id} onPress={() => handleAction(person, 'like')} style={s.like}><Text style={s.likeText}>{busyId === person.id ? '…' : '♥'}</Text></GradientButton>
              </View>
            </View>
          </GlassCard>
        )) : (
          <GlassCard style={s.empty}>
            <Text style={s.emptyHeart}>♡</Text><Text style={s.emptyTitle}>You’re all caught up</Text>
            <Text style={s.emptyCopy}>There are no profiles to show right now. Come back later.</Text>
            {DEMO_PROFILES_ENABLED ? <GradientButton accessibilityRole="button" onPress={() => { setDemoMode(true); setProfiles(MOCK_PROFILES); }} style={s.reload}><Text style={s.reloadText}>Show demo profiles</Text></GradientButton> : null}
          </GlassCard>
        )}
      </ScrollView>
      <BottomNav active="discover" />
    </SafeAreaView>
  );
}

function styles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background }, top: { paddingHorizontal: 4, paddingTop: 5, paddingBottom: 10 }, kicker: { color: c.accent, fontSize: 10, letterSpacing: 1.8, fontWeight: '800', marginTop: 18 },
  title: { color: c.text, fontSize: 26, lineHeight: 32, fontWeight: '700', marginTop: 10 }, accent: { color: c.accent }, subtitle: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  profileMini: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }, profileInitial: { color: c.accent, fontWeight: '800' },
  filterToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 12, borderRadius: 22, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }, filterToggleText: { color: c.text, fontSize: 13, fontWeight: '700' }, filterHint: { color: c.accent, fontSize: 11, fontWeight: '800' }, filterPanel: { marginTop: 8, padding: 14, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, filterTitle: { color: c.text, fontSize: 12, fontWeight: '800', marginTop: 7, marginBottom: 8 }, filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, filterChip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 13, backgroundColor: c.surfaceStrong, borderWidth: 1, borderColor: c.border }, filterChipActive: { backgroundColor: c.accentSoft, borderColor: c.accent }, filterChipText: { color: c.muted, fontSize: 11, fontWeight: '700' }, filterChipTextActive: { color: c.accent }, countryInput: { height: 42, marginVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.input, color: c.text, paddingHorizontal: 12 }, filterNote: { color: c.subtle, fontSize: 10, lineHeight: 15, marginTop: 10 }, filterWarning: { color: c.danger, fontSize: 11, lineHeight: 16, marginTop: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 }, card: { flexDirection: 'row', padding: 8, gap: 12, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 18, shadowColor: c.shadow, shadowOpacity: 0.05, shadowRadius: 10 },
  photo: { width: 86, minHeight: 126, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, glow: { position: 'absolute', top: -100, right: -55, width: 280, height: 280, borderRadius: 140, opacity: 0.12 }, bigInitial: { fontSize: 64, fontWeight: '200' }, photoLabel: { position: 'absolute', top: 14, left: 14, color: c.muted, backgroundColor: c.surface, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, demoLabel: { position: 'absolute', top: 6, left: 6, color: '#FFFFFF', backgroundColor: '#181323bf', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  nameOverlay: { position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 20, backgroundColor: '#090E23B8', borderWidth: 1, borderColor: '#FFFFFF33', padding: 15 }, name: { color: c.text, fontSize: 17, fontWeight: '700' }, tapHint: { color: '#E0E4F5', fontSize: 11, marginTop: 3 }, details: { paddingVertical: 5, flex: 1, justifyContent: 'center', minWidth: 0 }, tags: { marginTop: 7, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, tag: { color: c.text, backgroundColor: c.surfaceStrong, borderRadius: 10, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3, fontSize: 11, fontWeight: '500' }, emptyInterest: { color: c.subtle, fontSize: 12 }, bio: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 8 }, pass: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceStrong }, passText: { color: c.muted, fontSize: 29, lineHeight: 32, marginTop: -3 }, super: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.blue, backgroundColor: c.surfaceStrong }, superText: { color: c.blue, fontSize: 21 }, like: { width: 44, height: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent, shadowColor: c.accent, shadowOpacity: 0.26, shadowRadius: 10, elevation: 4 }, likeText: { color: c.onAccent, fontSize: 24 },
  empty: { minHeight: 380, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', padding: 28 }, emptyHeart: { color: c.accent, fontSize: 44 }, emptyTitle: { color: c.text, fontSize: 22, fontWeight: '800', marginTop: 12 }, emptyCopy: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 }, reload: { backgroundColor: c.accent, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, marginTop: 18 }, reloadText: { color: c.onAccent, fontWeight: '700' },
}); }
