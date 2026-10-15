import type { UserProfile } from '../state/profileStorage';
import { supabase } from './supabase';
import { getPhotoSyncErrorMessage, syncOwnProfilePhotos } from './profilePhotoRepository';

export function toDatabaseDate(dateOfBirth: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateOfBirth.trim());
  if (!match) {
    throw new Error('Enter your date of birth in DD/MM/YYYY format.');
  }

  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new Error('Enter a valid date of birth.');
  }

  const today = new Date();
  let age = today.getFullYear() - Number(year);
  const birthdayPassed =
    today.getMonth() + 1 > Number(month) ||
    (today.getMonth() + 1 === Number(month) && today.getDate() >= Number(day));
  if (!birthdayPassed) age -= 1;
  if (age < 18) {
    throw new Error('SecondMeet is available only to people aged 18 or older.');
  }

  return `${year}-${month}-${day}`;
}

export async function saveProfileToSupabase(profile: UserProfile, onPhotoProgress?: (completed: number, total: number) => void, clearRemoteGallery = false): Promise<{ userId: string; photoError?: string; photoPaths?: string[] }> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }
  if (!sessionData.session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!userData.user) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles')
    .select('photo_url')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (existingError) throw existingError;

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userData.user.id,
      name: profile.name,
      display_name: profile.name.trim(),
      is_discoverable: profile.isDiscoverable ?? false,
      date_of_birth: toDatabaseDate(profile.dateOfBirth),
      gender: profile.gender,
      interests: profile.selectedInterests,
      // A device-local file URI cannot be used as a remote photo URL.
      // Keep the legacy value unchanged; ordered private Storage references live in profile_photos.
      photo_url: typeof existingProfile?.photo_url === 'string' ? existingProfile.photo_url : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(error.message);
  }

  const photos = profile.profilePhotos ?? (profile.profilePhotoUri ? [profile.profilePhotoUri] : []);
  // A new profile with no photos has no Storage dependency. Explicit removal of
  // a previously saved gallery must still clear its remote metadata.
  const hasGallery = Array.isArray(profile.profilePhotos) || Array.isArray(profile.profilePhotoPaths);
  if ((hasGallery && photos.length > 0) || clearRemoteGallery) {
    try {
      const photoPaths = await syncOwnProfilePhotos(photos, profile.profilePhotoPaths ?? [], onPhotoProgress);
      return { userId: userData.user.id, photoPaths };
    } catch (photoError) {
      // The profile upsert already succeeded. Photos are a separate, retryable operation.
      return { userId: userData.user.id, photoError: getPhotoSyncErrorMessage(photoError) };
    }
  }
  return { userId: userData.user.id };
}
