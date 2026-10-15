import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GlassBackground as SafeAreaView, GradientButton } from '../components/Glass';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { DEVELOPMENT_AUTH_BYPASS } from '../lib/authConfig';
import { useProfile } from '../state/ProfileContext';
import type { UserProfile } from '../state/profileStorage';
import { saveProfileToSupabase, toDatabaseDate } from '../lib/profileRepository';
import { useTheme } from '../theme/ThemeContext';
import { DateOfBirthInput } from '../components/DateOfBirthInput';

const INTERESTS = [
  'Travel',
  'Music',
  'Food',
  'Photography',
  'Movies',
  'Fitness',
  'Books',
  'Gaming',
];

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

export default function CreateProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { profile, isProfileLoaded, refreshProfile, saveProfile } = useProfile();
  const [profileDraft, setProfileDraft] = useState<Partial<UserProfile>>({});
  const name = profileDraft.name ?? profile?.name ?? '';
  const dateOfBirth = profileDraft.dateOfBirth ?? profile?.dateOfBirth ?? '';
  const gender = profileDraft.gender ?? profile?.gender ?? '';
  const profilePhotoUri = Object.prototype.hasOwnProperty.call(profileDraft, 'profilePhotoUri')
    ? profileDraft.profilePhotoUri ?? null
    : profile?.profilePhotoUri ?? null;
  const profilePhotos = profileDraft.profilePhotos ?? profile?.profilePhotos ?? (profilePhotoUri ? [profilePhotoUri] : []);
  const profilePhotoPaths = profileDraft.profilePhotoPaths ?? profile?.profilePhotoPaths ?? [];
  const isDiscoverable = profileDraft.isDiscoverable ?? profile?.isDiscoverable ?? false;
  const selectedInterests = profileDraft.selectedInterests ?? profile?.selectedInterests ?? [];
  const [genderMenuOpen, setGenderMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoProgress, setPhotoProgress] = useState('');
  const [photoError, setPhotoError] = useState('');

  const toggleInterest = (interest: string) => {
    setProfileDraft((current) => {
      const currentInterests = current.selectedInterests ?? profile?.selectedInterests ?? [];
      return {
        ...current,
        selectedInterests: currentInterests.includes(interest)
          ? currentInterests.filter((item) => item !== interest)
          : [...currentInterests, interest],
      };
    });
  };

  const pickProfilePhotos = async () => {
    if (isSaving) return;
    try {
      if (profilePhotos.length >= 8) {
        Alert.alert('Gallery is full', 'Remove a photo before adding another.');
        return;
      }
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo-library access to choose profile photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 8 - profilePhotos.length,
        quality: 0.85,
      });

      if (!result.canceled && result.assets.length) {
        const next = [...profilePhotos, ...result.assets.map((asset) => asset.uri)].slice(0, 8);
        const oldPaths = profilePhotoPaths.length ? profilePhotoPaths : profilePhotos.map(() => '');
        const nextPaths = [...oldPaths, ...result.assets.map(() => '')].slice(0, 8);
        setProfileDraft((current) => ({ ...current, profilePhotos: next, profilePhotoPaths: nextPaths, profilePhotoUri: next[0] ?? null }));
      }
    } catch {
      Alert.alert('Could not open photos', 'Please try choosing a photo again.');
    }
  };

  const removePhoto = (index: number) => {
    if (isSaving) return;
    const next = profilePhotos.filter((_, itemIndex) => itemIndex !== index);
    const nextPaths = profilePhotoPaths.filter((_, itemIndex) => itemIndex !== index);
    setProfileDraft((current) => ({ ...current, profilePhotos: next, profilePhotoPaths: nextPaths, profilePhotoUri: next[0] ?? null }));
  };

  const reorderPhoto = (index: number, direction: -1 | 1) => {
    if (isSaving) return;
    const target = index + direction;
    if (target < 0 || target >= profilePhotos.length) return;
    const next = [...profilePhotos];
    [next[index], next[target]] = [next[target], next[index]];
    const nextPaths = [...profilePhotoPaths, ...Array(Math.max(0, next.length - profilePhotoPaths.length)).fill('')];
    [nextPaths[index], nextPaths[target]] = [nextPaths[target], nextPaths[index]];
    setProfileDraft((current) => ({ ...current, profilePhotos: next, profilePhotoPaths: nextPaths, profilePhotoUri: next[0] ?? null }));
  };

  const handleNext = async () => {
    if (!isProfileLoaded || isSaving) return;

    setIsSaving(true);
    setPhotoError('');
    setPhotoProgress('');
    try {
      const nextProfile: UserProfile = {
        name: name.trim(),
        dateOfBirth,
        gender,
        selectedInterests,
        profilePhotoUri,
        isDiscoverable,
        ...(profile?.pendingPhotoUserId ? { pendingPhotoUserId: profile.pendingPhotoUserId } : {}),
        ...(Object.prototype.hasOwnProperty.call(profileDraft, 'profilePhotos') || profile?.profilePhotos || profile?.profilePhotoPaths
          ? { profilePhotos, profilePhotoPaths }
          : {}),
      };

      if (!nextProfile.name || !nextProfile.gender) {
        throw new Error('Please enter your name and select your gender.');
      }
      toDatabaseDate(nextProfile.dateOfBirth);

      // Keep the local profile available as a cache, even if the network save fails.
      await saveProfile(nextProfile);
      if (!DEVELOPMENT_AUTH_BYPASS) {
        const result = await saveProfileToSupabase(
          nextProfile,
          (completed, total) => setPhotoProgress(`Uploading photo ${completed}/${total}…`),
          Boolean(profile?.profilePhotoPaths?.some(Boolean) || profile?.pendingPhotoUserId),
        );
        if (result.photoError) {
          await saveProfile({ ...nextProfile, pendingPhotoUserId: result.userId });
          setPhotoError(result.photoError);
          return;
        }
        await saveProfile({ ...nextProfile, pendingPhotoUserId: undefined, ...(result.photoPaths ? { profilePhotoPaths: result.photoPaths } : {}) });
        await refreshProfile();
      }
      router.push('/discovery');
    } catch (error) {
      Alert.alert(
        'Could not save profile',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.stepText}>3 of 4</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>Tell us a little about yourself.</Text>

            <View style={styles.photoSection}>
              <View style={styles.photoHeading}><Text style={styles.photoTitle}>Photo gallery</Text><Text style={styles.photoCount}>{profilePhotos.length}/8</Text></View>
              <Text style={styles.photoSubtitle}>Photos are optional. The first photo you choose is your main photo.</Text>
              <View style={styles.galleryGrid}>
                {Array.from({ length: 8 }, (_, index) => {
                  const uri = profilePhotos[index];
                  const isMain = index === 0 && Boolean(uri);
                  return <View key={`photo-slot-${index}`} style={[styles.gallerySlot, isMain && styles.mainPhotoSlot]}>
                    {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                    {uri ? <>
                      {isMain ? <View style={styles.mainBadge}><Text style={styles.galleryActionText}>MAIN</Text></View> : null}
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${index + 1}`} onPress={() => removePhoto(index)} style={styles.removePhoto}><Text style={styles.galleryActionText}>×</Text></Pressable>
                      <View style={styles.reorderRow}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Move photo ${index + 1} earlier`} onPress={() => reorderPhoto(index, -1)} style={styles.reorderButton}><Text style={styles.galleryActionText}>‹</Text></Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Move photo ${index + 1} later`} onPress={() => reorderPhoto(index, 1)} style={styles.reorderButton}><Text style={styles.galleryActionText}>›</Text></Pressable>
                      </View>
                    </> : <Pressable accessibilityRole="button" accessibilityLabel={`Add photo, slot ${index + 1}`} onPress={pickProfilePhotos} style={styles.addSlot}><Text style={styles.addSlotIcon}>＋</Text><Text style={styles.addSlotText}>Add</Text></Pressable>}
                  </View>;
                })}
              </View>
              <Text style={styles.photoSubtitle}>Up to 8 photos · JPEG, PNG or WebP · 5 MB per photo</Text>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={(value) => setProfileDraft((current) => ({ ...current, name: value }))}
              placeholder="Enter your name"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={styles.label}>Date of Birth</Text>
            <DateOfBirthInput value={dateOfBirth} onChangeText={(value) => setProfileDraft((current) => ({ ...current, dateOfBirth: value }))} />
            <Text style={styles.helper}>Your age will be displayed on your profile.</Text>

            <Text style={styles.label}>Gender</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Gender${gender ? `, ${gender}` : ''}`}
              accessibilityState={{ expanded: genderMenuOpen }}
              style={styles.dropdown}
              onPress={() => setGenderMenuOpen((open) => !open)}
            >
              <Text style={gender ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {gender || 'Select your gender'}
              </Text>
              <Text style={styles.chevron}>{genderMenuOpen ? '⌃' : '⌄'}</Text>
            </Pressable>
            {genderMenuOpen && (
              <View style={styles.dropdownOptions}>
                {GENDERS.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    style={styles.dropdownOption}
                    onPress={() => {
                      setProfileDraft((current) => ({ ...current, gender: item }));
                      setGenderMenuOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{item}</Text>
                    {gender === item && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.interestHeader}>
              <Text style={styles.label}>Interests</Text>
              <Text style={styles.interestHint}>Choose any that you like</Text>
            </View>
            <View style={styles.interests}>
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => toggleInterest(interest)}
                    style={[styles.interestButton, isSelected && styles.interestButtonSelected]}
                  >
                    <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                      {interest}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!DEVELOPMENT_AUTH_BYPASS ? (
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Show me to people nearby"
                accessibilityState={{ checked: isDiscoverable }}
                onPress={() =>
                  setProfileDraft((current) => ({
                    ...current,
                    isDiscoverable: !(current.isDiscoverable ?? profile?.isDiscoverable ?? false),
                  }))
                }
                style={styles.discoverabilityRow}
              >
                <View style={styles.discoverabilityCopy}>
                  <Text style={styles.discoverabilityTitle}>Show me to people nearby</Text>
                  <Text style={styles.discoverabilityDescription}>
                    You can change this any time.
                  </Text>
                </View>
                <View style={styles.discoverabilityStatus}>
                  <Text style={styles.discoverabilityStatusText}>
                    {isDiscoverable ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            <View style={styles.bottomSpace} />
          </ScrollView>

          <View style={styles.bottom}>
            {photoError || profile?.pendingPhotoUserId ? <Text accessibilityRole="alert" style={styles.photoSubtitle}>{photoError || 'Your selected photos are waiting to sync. Tap Retry photos to try again.'}</Text> : null}
            {photoError ? <GradientButton accessibilityRole="button" disabled={isSaving} onPress={() => router.push('/discovery')} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Continue without photo sync</Text>
            </GradientButton> : null}
            <GradientButton
              accessibilityRole="button"
              disabled={!isProfileLoaded || isSaving}
              style={[styles.nextButton, (!isProfileLoaded || isSaving) && styles.disabledButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>{isSaving ? photoProgress || 'Saving...' : photoError || profile?.pendingPhotoUserId ? 'Retry photos' : 'Next'}</Text>
            </GradientButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  keyboard: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  topRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: c.text, fontSize: 32, lineHeight: 34, marginTop: -4 },
  stepText: { color: c.muted, fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 12 },
  title: { color: c.text, fontSize: 26, lineHeight: 32, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  subtitle: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  photoSection: { marginBottom: 22 },
  photoHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoCount: { color: c.accent, fontSize: 13, fontWeight: '800' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  gallerySlot: { width: '22%', flexGrow: 1, aspectRatio: 0.82, borderRadius: 13, overflow: 'hidden', backgroundColor: c.surfaceStrong, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  mainPhotoSlot: { borderColor: c.accent, borderWidth: 2 },
  addSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  addSlotIcon: { color: c.accent, fontSize: 24, fontWeight: '500' },
  addSlotText: { color: c.muted, fontSize: 10, marginTop: 3 },
  mainBadge: { position: 'absolute', left: 4, top: 4, borderRadius: 6, backgroundColor: c.accent, paddingHorizontal: 5, paddingVertical: 3 },
  removePhoto: { position: 'absolute', right: 4, top: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#17131dcc', alignItems: 'center', justifyContent: 'center' },
  reorderRow: { position: 'absolute', bottom: 4, left: 4, right: 4, flexDirection: 'row', justifyContent: 'space-between' },
  reorderButton: { minWidth: 26, height: 26, borderRadius: 13, backgroundColor: '#17131dcc', alignItems: 'center', justifyContent: 'center' },
  galleryActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 18 },
  photoWrap: { position: 'relative' },
  photoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: c.surfaceStrong,
    borderWidth: 2,
    borderColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.subtle,
    marginTop: 16,
  },
  avatarShoulders: {
    width: 58,
    height: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: c.subtle,
    marginTop: 6,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: c.background,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { color: c.onAccent, fontSize: 17, fontWeight: '700' },
  photoTitle: { color: c.text, fontSize: 14, fontWeight: '600', marginTop: 10 },
  photoSubtitle: { color: c.muted, fontSize: 12, marginTop: 4 },
  label: { color: c.text, fontSize: 15, fontWeight: '600', marginBottom: 9 },
  input: {
    height: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.input,
    color: c.text,
    fontSize: 16,
    paddingHorizontal: 17,
    marginBottom: 16,
  },
  helper: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: -8, marginBottom: 20 },
  dropdown: {
    minHeight: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.input,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownValue: { color: c.text, fontSize: 16 },
  dropdownPlaceholder: { color: c.muted, fontSize: 16 },
  chevron: { color: c.muted, fontSize: 21 },
  dropdownOptions: {
    backgroundColor: c.surfaceStrong,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: -8,
    marginBottom: 18,
  },
  dropdownOption: {
    minHeight: 46,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  dropdownOptionText: { color: c.text, fontSize: 15 },
  checkmark: { color: c.accent, fontSize: 17, fontWeight: '700' },
  interestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  interestHint: { color: c.muted, fontSize: 11, marginBottom: 9 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  discoverabilityRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.input,
  },
  discoverabilityCopy: { flex: 1, paddingVertical: 12, paddingRight: 12 },
  discoverabilityTitle: { color: c.text, fontSize: 14, fontWeight: '600' },
  discoverabilityDescription: { color: c.muted, fontSize: 11, marginTop: 5 },
  discoverabilityStatus: {
    minWidth: 42,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: c.accentSoft,
  },
  discoverabilityStatusText: { color: c.accent, fontSize: 11, fontWeight: '800' },
  interestButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.input,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  interestButtonSelected: { backgroundColor: c.accent, borderColor: c.accent },
  interestText: { color: c.muted, fontSize: 13, fontWeight: '600' },
  interestTextSelected: { color: c.onAccent },
  bottomSpace: { height: 18 },
  bottom: { paddingTop: 10, paddingBottom: 12, backgroundColor: 'transparent' },
  nextButton: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: { color: c.onAccent, fontSize: 17, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
}); }
