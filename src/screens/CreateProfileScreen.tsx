import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../state/ProfileContext';
import { saveProfileToSupabase } from '../lib/profileRepository';

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
  const { profile, isProfileLoaded, saveProfile } = useProfile();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [genderMenuOpen, setGenderMenuOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isProfileLoaded || !profile) return;

    setName(profile.name);
    setDateOfBirth(profile.dateOfBirth);
    setGender(profile.gender);
    setSelectedInterests(profile.selectedInterests);
    setProfilePhotoUri(profile.profilePhotoUri);
  }, [isProfileLoaded, profile]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const handleNext = async () => {
    if (!isProfileLoaded || isSaving) return;

    setIsSaving(true);
    try {
      const nextProfile = {
        name: name.trim(),
        dateOfBirth,
        gender,
        selectedInterests,
        profilePhotoUri,
      };

      if (!nextProfile.name || !nextProfile.gender) {
        throw new Error('Please enter your name and select your gender.');
      }

      // Keep the local profile available as a cache, even if the network save fails.
      await saveProfile(nextProfile);
      await saveProfileToSupabase(nextProfile);
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
      <StatusBar barStyle="light-content" backgroundColor="#09090D" />
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
              <View style={styles.photoWrap}>
                <View style={styles.photoCircle}>
                  {profilePhotoUri ? (
                    <Image
                      source={{ uri: profilePhotoUri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <View style={styles.avatarHead} />
                      <View style={styles.avatarShoulders} />
                    </>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add profile photo"
                  style={styles.cameraButton}
                  onPress={() =>
                    Alert.alert('Profile photo', 'Photo selection will be added soon.')
                  }
                >
                  <Text style={styles.cameraIcon}>📷</Text>
                </Pressable>
              </View>
              <Text style={styles.photoTitle}>Add a profile photo</Text>
              <Text style={styles.photoSubtitle}>Help people recognize you</Text>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#777783"
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#777783"
              keyboardType="number-pad"
              maxLength={10}
              style={styles.input}
              accessibilityLabel="Date of birth, day month year"
            />
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
                      setGender(item);
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
            <View style={styles.bottomSpace} />
          </ScrollView>

          <View style={styles.bottom}>
            <Pressable
              accessibilityRole="button"
              disabled={!isProfileLoaded || isSaving}
              style={[styles.nextButton, (!isProfileLoaded || isSaving) && styles.disabledButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>{isSaving ? 'Saving...' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090D' },
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
    backgroundColor: '#17171E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#FFFFFF', fontSize: 32, lineHeight: 34, marginTop: -4 },
  stepText: { color: '#777783', fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 32, lineHeight: 39, fontWeight: '700', marginTop: 8 },
  subtitle: { color: '#A9A9B2', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 },
  photoSection: { alignItems: 'center', marginBottom: 22 },
  photoWrap: { position: 'relative' },
  photoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#17171E',
    borderWidth: 2,
    borderColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#777783',
    marginTop: 16,
  },
  avatarShoulders: {
    width: 58,
    height: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#777783',
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
    borderColor: '#09090D',
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  photoTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 10 },
  photoSubtitle: { color: '#777783', fontSize: 12, marginTop: 4 },
  label: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 9 },
  input: {
    height: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#35353F',
    backgroundColor: '#121219',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 17,
    marginBottom: 16,
  },
  helper: { color: '#777783', fontSize: 11, lineHeight: 17, marginTop: -8, marginBottom: 20 },
  dropdown: {
    minHeight: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#35353F',
    backgroundColor: '#121219',
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownValue: { color: '#FFFFFF', fontSize: 16 },
  dropdownPlaceholder: { color: '#777783', fontSize: 16 },
  chevron: { color: '#A9A9B2', fontSize: 21 },
  dropdownOptions: {
    backgroundColor: '#17171E',
    borderColor: '#35353F',
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
    borderBottomColor: '#35353F',
  },
  dropdownOptionText: { color: '#FFFFFF', fontSize: 15 },
  checkmark: { color: '#E83E8C', fontSize: 17, fontWeight: '700' },
  interestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  interestHint: { color: '#777783', fontSize: 11, marginBottom: 9 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  interestButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#35353F',
    backgroundColor: '#121219',
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  interestButtonSelected: { backgroundColor: '#E83E8C', borderColor: '#E83E8C' },
  interestText: { color: '#A9A9B2', fontSize: 13, fontWeight: '600' },
  interestTextSelected: { color: '#FFFFFF' },
  bottomSpace: { height: 18 },
  bottom: { paddingTop: 10, paddingBottom: 12, backgroundColor: '#09090D' },
  nextButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});
