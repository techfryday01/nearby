import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_STORAGE_KEY = 'nearby.profile.v1';

export type UserProfile = {
  name: string;
  dateOfBirth: string;
  gender: string;
  selectedInterests: string[];
  profilePhotoUri: string | null;
  /** Ordered gallery URLs or local device URIs. The first item is the main photo. */
  profilePhotos?: string[];
  /** Private storage object paths corresponding to profilePhotos when cloud sync is active. */
  profilePhotoPaths?: string[];
  /** Device-only retry marker, scoped to the signed-in account. Never sent to Discovery. */
  pendingPhotoUserId?: string;
  isDiscoverable?: boolean;
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
    (typeof profile.profilePhotoUri === 'string' || profile.profilePhotoUri === null) &&
    (profile.profilePhotos === undefined || (Array.isArray(profile.profilePhotos) && profile.profilePhotos.every((photo) => typeof photo === 'string'))) &&
    (profile.profilePhotoPaths === undefined || (Array.isArray(profile.profilePhotoPaths) && profile.profilePhotoPaths.every((path) => typeof path === 'string'))) &&
    (profile.isDiscoverable === undefined || typeof profile.isDiscoverable === 'boolean')
    && (profile.pendingPhotoUserId === undefined || typeof profile.pendingPhotoUserId === 'string')
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

export async function clearUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
}
