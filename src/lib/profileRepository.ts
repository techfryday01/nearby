import type { UserProfile } from '../state/profileStorage';
import { supabase } from './supabase';

function toDatabaseDate(dateOfBirth: string): string {
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

  return `${year}-${month}-${day}`;
}

export async function saveProfileToSupabase(profile: UserProfile): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!userData.user) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userData.user.id,
      name: profile.name,
      date_of_birth: toDatabaseDate(profile.dateOfBirth),
      gender: profile.gender,
      interests: profile.selectedInterests,
      // A device-local file URI cannot be used as a remote photo URL.
      photo_url: profile.profilePhotoUri?.startsWith('http')
        ? profile.profilePhotoUri
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(error.message);
  }
}
