import { supabase } from './supabase';
import { loadDiscoveryMainPhotoUrls } from './profilePhotoRepository';

export type DiscoveryProfileRow = {
  profile_id: string;
  display_name: string;
  age: number;
  gender: string;
  interests: string[];
  main_photo_url?: string;
};

export type DiscoveryFilters = {
  enabled: boolean;
  radiusKm: 8 | 10 | 30 | 50;
  countryMode: 'nearby' | 'my_country' | 'worldwide';
  countryCode: string | null;
};

function isDiscoveryProfileRow(value: unknown): value is DiscoveryProfileRow {
  if (typeof value !== 'object' || value === null) return false;

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.profile_id === 'string' &&
    typeof profile.display_name === 'string' &&
    profile.display_name.trim().length > 0 &&
    typeof profile.age === 'number' &&
    Number.isFinite(profile.age) &&
    typeof profile.gender === 'string' &&
    Array.isArray(profile.interests) &&
    profile.interests.every((interest) => typeof interest === 'string')
  );
}

export async function fetchDiscoveryProfiles(filters?: DiscoveryFilters): Promise<DiscoveryProfileRow[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    if (filters?.enabled) throw new Error('Sign in and save a location before using Discovery filters.');
    return [];
  }

  const { data, error } = filters?.enabled
    ? await supabase.rpc('search_discover_profiles', {
        radius_km: filters.radiusKm,
        country_mode: filters.countryMode,
        selected_country_code: filters.countryMode === 'worldwide' ? filters.countryCode : null,
      })
    : await supabase.rpc('discover_profiles');
  if (error) throw error;
  if (data === null) return [];

  const rows: unknown = data;
  if (!Array.isArray(rows) || !rows.every(isDiscoveryProfileRow)) {
    throw new Error('Discovery RPC returned profiles in an unexpected format.');
  }

  try {
    const photoUrls = await loadDiscoveryMainPhotoUrls(rows.map((row) => row.profile_id));
    return rows.map((row) => ({ ...row, main_photo_url: photoUrls.get(row.profile_id) }));
  } catch (photoError) {
    console.warn('[Discovery] Photo gallery is not available; showing profiles without photos.', photoError);
    return rows;
  }
}
