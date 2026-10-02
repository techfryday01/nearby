import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_STORAGE_KEY = 'nearby.profile.v1';

export type UserProfile = {
  name: string;
  dateOfBirth: string;
  gender: string;
  selectedInterests: string[];
  profilePhotoUri: string | null;
};

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) return false;

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.name === 'string' &&
    typeof profile.dateOfBirth === 'string' &&
    typeof profile.gender === 'string' &&
    Array.isArray(profile.selectedInterests) &&
    profile.selectedInterests.every((interest) => typeof interest === 'string') &&
    (typeof profile.profilePhotoUri === 'string' || profile.profilePhotoUri === null)
  );
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
  if (!storedProfile) return null;

  try {
    const parsedProfile: unknown = JSON.parse(storedProfile);
    return isUserProfile(parsedProfile) ? parsedProfile : null;
  } catch {
    return null;
  }
}

export async function storeUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
