import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMatches } from '../state/MatchContext';
import { useProfile } from '../state/ProfileContext';

type Profile = {
  id: string;
  name: string;
  age: number;
  bio: string;
  distance: string;
  interests: string[];
  initials: string;
  color: string;
  matchOnLike: boolean;
};

const PROFILES: Profile[] = [
  {
    id: 'maya',
    name: 'Maya',
    age: 26,
    bio: 'Always looking for a new place to eat, a live show, or a reason to get outdoors.',
    distance: '2 km away',
    interests: ['Live music', 'Foodie', 'Weekend trips'],
    initials: 'M',
    color: '#563146',
    matchOnLike: true,
  },
  {
    id: 'arun',
    name: 'Arun',
    age: 29,
    bio: 'Coffee enthusiast, amateur photographer, and happiest near the ocean.',
    distance: '4 km away',
    interests: ['Photography', 'Coffee', 'The outdoors'],
    initials: 'A',
    color: '#304858',
    matchOnLike: false,
  },
  {
    id: 'nina',
    name: 'Nina',
    age: 25,
    bio: 'Bookshop regular who loves spontaneous plans and good conversations.',
    distance: '6 km away',
    interests: ['Books', 'Art', 'Travel'],
    initials: 'N',
    color: '#554633',
    matchOnLike: true,
  },
];

export default function DiscoveryScreen() {
  const router = useRouter();
  const { addMatch, isMatchesLoaded } = useMatches();
  const { profile: ownProfile } = useProfile();
  const { height } = useWindowDimensions();
  const [profileIndex, setProfileIndex] = useState(0);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const profile = PROFILES[profileIndex];
  const photoHeight = Math.min(400, Math.max(260, height * 0.43));

  const moveToNextProfile = () => {
    setProfileIndex((current) => Math.min(current + 1, PROFILES.length));
  };

  const resetProfiles = () => setProfileIndex(0);

  const handleLike = async () => {
    if (!profile) return;

    if (profile.matchOnLike) {
      setIsSavingMatch(true);
      try {
        await addMatch({
          id: profile.id,
          name: profile.name,
          age: profile.age,
          initials: profile.initials,
          color: profile.color,
        });
        moveToNextProfile();
        router.push('/matches');
      } catch {
        Alert.alert('Could not save match', 'Please try again.');
      } finally {
        setIsSavingMatch(false);
      }
      return;
    }

    moveToNextProfile();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090D" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NEARBY</Text>
            <Text style={styles.title}>Discover</Text>
            {ownProfile?.name ? (
              <Text style={styles.greeting}>Hi, {ownProfile.name}</Text>
            ) : null}
          </View>
          <View style={styles.locationPill}>
            <Text style={styles.locationPin}>⌖</Text>
            <Text style={styles.locationText}>Colombo</Text>
          </View>
        </View>

        {profile ? (
          <>
            <View style={styles.profileCard}>
              <View style={[styles.photo, { height: photoHeight, backgroundColor: profile.color }]}>
                <View style={styles.photoGlow} />
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{profile.initials}</Text>
                </View>
                <View style={styles.photoCaption}>
                  <Text style={styles.name}>
                    {profile.name}, {profile.age}
                  </Text>
                  <View style={styles.distanceRow}>
                    <Text style={styles.distancePin}>⌖</Text>
                    <Text style={styles.distance}>{profile.distance}</Text>
                  </View>
                </View>
                <View style={styles.photoPlaceholderTag}>
                  <Text style={styles.photoPlaceholderText}>PHOTO PLACEHOLDER</Text>
                </View>
              </View>

              <View style={styles.profileDetails}>
                <Text style={styles.sectionLabel}>ABOUT</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
                <Text style={[styles.sectionLabel, styles.interestsLabel]}>INTERESTS</Text>
                <View style={styles.tags}>
                  {profile.interests.map((interest) => (
                    <View key={interest} style={styles.tag}>
                      <Text style={styles.tagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pass on profile"
                onPress={moveToNextProfile}
                style={({ pressed }) => [styles.actionButton, styles.passButton, pressed && styles.pressed]}
              >
                <Text style={[styles.actionIcon, styles.passIcon]}>×</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Super like profile"
                onPress={moveToNextProfile}
                style={({ pressed }) => [styles.actionButton, styles.superLikeButton, pressed && styles.pressed]}
              >
                <Text style={[styles.actionIcon, styles.superLikeIcon]}>★</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Like profile"
                disabled={!isMatchesLoaded || isSavingMatch}
                onPress={handleLike}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.likeButton,
                  (!isMatchesLoaded || isSavingMatch) && styles.actionButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.actionIcon, styles.likeIcon]}>♥</Text>
              </Pressable>
            </View>
            <Text style={styles.actionHint}>Choose someone who catches your eye</Text>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>♥</Text>
            </View>
            <Text style={styles.emptyTitle}>You’re all caught up</Text>
            <Text style={styles.emptyText}>Check back soon to meet more people nearby.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={resetProfiles}
              style={({ pressed }) => [styles.showAgainButton, pressed && styles.pressed]}
            >
              <Text style={styles.showAgainText}>Show profiles again</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090D' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: { color: '#E83E8C', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 3 },
  greeting: { color: '#A9A9B2', fontSize: 12, marginTop: 3 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#17171E',
    borderWidth: 1,
    borderColor: '#2B2B35',
  },
  locationPin: { color: '#E83E8C', fontSize: 17, lineHeight: 18 },
  locationText: { color: '#D9D9E0', fontSize: 12, fontWeight: '600' },
  profileCard: {
    overflow: 'hidden',
    backgroundColor: '#121219',
    borderWidth: 1,
    borderColor: '#282832',
    borderRadius: 24,
  },
  photo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -100,
    right: -80,
  },
  avatarCircle: {
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: 'rgba(9,9,13,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: 'rgba(255,255,255,0.8)', fontSize: 62, fontWeight: '300' },
  photoCaption: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 19,
  },
  name: { color: '#FFFFFF', fontSize: 30, fontWeight: '700', textShadowColor: '#00000088', textShadowRadius: 12 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  distancePin: { color: '#F3D4E3', fontSize: 15, marginRight: 4 },
  distance: { color: '#F3D4E3', fontSize: 13, fontWeight: '600' },
  photoPlaceholderTag: {
    position: 'absolute',
    right: 14,
    top: 14,
    backgroundColor: 'rgba(9,9,13,0.48)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  photoPlaceholderText: { color: '#FFFFFFCC', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  profileDetails: { paddingHorizontal: 19, paddingTop: 17, paddingBottom: 19 },
  sectionLabel: { color: '#858590', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  bio: { color: '#E9E9EE', fontSize: 14, lineHeight: 21, marginTop: 7 },
  interestsLabel: { marginTop: 18, marginBottom: 9 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#1C1720',
    borderWidth: 1,
    borderColor: '#493044',
  },
  tagText: { color: '#F1C7DC', fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 19,
    marginTop: 20,
  },
  actionButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17171E',
    borderWidth: 1,
  },
  passButton: { borderColor: '#41414C' },
  superLikeButton: { width: 48, height: 48, borderRadius: 24, borderColor: '#4C3A61' },
  likeButton: { borderColor: '#743052', backgroundColor: '#26141F' },
  actionButtonDisabled: { opacity: 0.5 },
  actionIcon: { fontWeight: '500' },
  passIcon: { color: '#D7D7DE', fontSize: 34, lineHeight: 36, marginTop: -3 },
  superLikeIcon: { color: '#C4A2F2', fontSize: 21 },
  likeIcon: { color: '#E83E8C', fontSize: 25 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  actionHint: { color: '#777783', fontSize: 12, textAlign: 'center', marginTop: 12 },
  emptyCard: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#121219',
    borderWidth: 1,
    borderColor: '#282832',
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26141F',
    marginBottom: 18,
  },
  emptyIcon: { color: '#E83E8C', fontSize: 27 },
  emptyTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: '#A9A9B2', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9 },
  showAgainButton: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: '#E83E8C',
    borderRadius: 15,
    marginTop: 23,
  },
  showAgainText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
