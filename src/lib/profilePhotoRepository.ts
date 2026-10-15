import { supabase } from './supabase';

export const PROFILE_PHOTO_BUCKET = 'secondmeet-profile-photos';
const MAX_PHOTOS = 8;

export function getPhotoSyncErrorMessage(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  if (/bucket.*not found/i.test(message)) return 'Photo storage is not available yet. Your profile is saved. Please retry photos after storage has been configured.';
  if (/5 MB|JPEG|unavailable on this device/i.test(message)) return message;
  return 'Your profile is saved, but photos could not sync. Check your connection and try again. If this continues, contact support.';
}

// RN 0.86 FileReader decodes native file data into an ArrayBuffer. Supabase's
// React Native upload API recommends this instead of sending Blob/FormData.
async function photoBytes(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('A photo could not be read.'));
    reader.onabort = () => reject(new Error('Photo reading was cancelled.'));
    reader.onload = () => reader.result instanceof ArrayBuffer
      ? resolve(reader.result) : reject(new Error('A photo could not be read.'));
    reader.readAsArrayBuffer(blob);
  });
}

type PhotoRow = { storage_path: string; position: number };

export async function loadOwnProfilePhotos(): Promise<{ paths: string[]; urls: string[] }> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return { paths: [], urls: [] };
  const { data, error } = await supabase.from('profile_photos').select('storage_path, position').eq('profile_id', userId).order('position');
  if (error) throw error;
  const rows = (data ?? []) as PhotoRow[];
  const paths = rows.slice(0, MAX_PHOTOS).map((row) => row.storage_path);
  if (!paths.length) return { paths: [], urls: [] };
  const { data: signed, error: signError } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).createSignedUrls(paths, 3600);
  if (signError) throw signError;
  const available = signed.flatMap((item, index) => item.signedUrl ? [{ path: paths[index], url: item.signedUrl }] : []);
  return { paths: available.map((item) => item.path), urls: available.map((item) => item.url) };
}

export async function syncOwnProfilePhotos(photos: string[], existingPaths: string[] = [], onProgress?: (completed: number, total: number) => void): Promise<string[]> {
  if (photos.length > MAX_PHOTOS) throw new Error('Choose no more than 8 photos.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Your session has expired. Sign in again to sync photos.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('discovery_id').eq('id', userId).maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.discovery_id) throw new Error('Create your profile before uploading photos.');

  const savedPaths: string[] = [];
  const uploadedPaths: string[] = [];
  let metadataSaved = false;
  try {
  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];
    const savedPath = existingPaths[index];
    if (savedPath && photo.startsWith('http')) {
      savedPaths.push(savedPath);
      onProgress?.(index + 1, photos.length);
      continue;
    }
    if (!photo.startsWith('file://') && !photo.startsWith('content://')) {
      throw new Error('One of the saved photos is unavailable on this device. Please choose it again.');
    }
    const response = await fetch(photo);
    if (!response.ok) throw new Error('A photo could not be read. Please retry the upload.');
    const blob = await response.blob();
    if (blob.size > 5242880) throw new Error('Each photo must be 5 MB or smaller. Choose a smaller photo and retry.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) throw new Error('Choose JPEG, PNG or WebP photos and retry.');
    const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${profile.discovery_id}/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).upload(path, await photoBytes(blob), { contentType: blob.type, upsert: false });
    if (uploadError) throw uploadError;
    savedPaths.push(path);
    uploadedPaths.push(path);
    onProgress?.(index + 1, photos.length);
  }

  const { data: current, error: currentError } = await supabase.from('profile_photos').select('storage_path').eq('profile_id', userId);
  if (currentError) throw currentError;
  const { error: replaceError } = await supabase.rpc('set_profile_photos', { storage_paths: savedPaths });
  if (replaceError) throw replaceError;
  metadataSaved = true;
  const obsolete = (current ?? []).map((row) => row.storage_path).filter((path) => !savedPaths.includes(path));
  // Cleanup failure must never roll back objects referenced by committed metadata.
  if (obsolete.length) await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove(obsolete).catch(() => undefined);
  return savedPaths;
  } catch (error) {
    if (!metadataSaved && uploadedPaths.length) {
      await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove(uploadedPaths).catch(() => undefined);
    }
    throw error;
  }
}

export async function loadDiscoveryPhotoUrls(discoveryId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('discover_profile_photo_paths', { target_discovery_id: discoveryId });
  if (error) throw error;
  const rows = (data ?? []) as PhotoRow[];
  const paths = rows.sort((a, b) => a.position - b.position).slice(0, MAX_PHOTOS).map((row) => row.storage_path);
  if (!paths.length) return [];
  const { data: signed, error: signError } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).createSignedUrls(paths, 3600);
  if (signError) throw signError;
  return signed.map((item) => item.signedUrl ?? '').filter(Boolean);
}

export async function loadDiscoveryMainPhotoUrls(discoveryIds: string[]): Promise<Map<string, string>> {
  const { data, error } = await supabase.rpc('discover_profiles_with_photo_paths');
  if (error) throw error;
  const requested = new Set(discoveryIds);
  const rows = (data ?? []) as { profile_id: string; main_photo_path: string | null }[];
  const eligible = rows.filter((row) => requested.has(row.profile_id) && typeof row.main_photo_path === 'string');
  if (!eligible.length) return new Map();
  const paths = eligible.map((row) => row.main_photo_path as string);
  const { data: signed, error: signError } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).createSignedUrls(paths, 3600);
  if (signError) throw signError;
  const result = new Map<string, string>();
  eligible.forEach((row, index) => { const url = signed[index]?.signedUrl; if (url) result.set(row.profile_id, url); });
  return result;
}
