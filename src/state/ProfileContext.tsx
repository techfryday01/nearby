import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { DEVELOPMENT_AUTH_BYPASS } from '../lib/authConfig';
import {
  clearUserProfile,
  loadUserProfile,
  storeUserProfile,
  type UserProfile,
} from './profileStorage';
import { supabase } from '../lib/supabase';
import { loadOwnProfilePhotos } from '../lib/profilePhotoRepository';

function toLocalDateOfBirth(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

type ProfileContextValue = {
  profile: UserProfile | null;
  isProfileLoaded: boolean;
  isAuthenticated: boolean;
  hasSupabaseProfile: boolean;
  profileLoadError: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
  saveProfile: (profile: UserProfile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSupabaseProfile, setHasSupabaseProfile] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(false);

  const refreshProfile = useCallback(async (): Promise<boolean> => {
    let cachedProfile: UserProfile | null = null;
    try {
      cachedProfile = await loadUserProfile();
    } catch {
      // The remote profile can still load if local storage is unavailable.
    }

    if (DEVELOPMENT_AUTH_BYPASS) {
      setIsAuthenticated(false);
      setHasSupabaseProfile(false);
      setProfileLoadError(false);
      setProfile(cachedProfile);
      return false;
    }

    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      setIsAuthenticated(false);
      setHasSupabaseProfile(false);
      setProfileLoadError(true);
      setProfile(cachedProfile);
      throw authError;
    }

    if (!authData.session) {
      setIsAuthenticated(false);
      setHasSupabaseProfile(false);
      setProfileLoadError(false);
      setProfile(cachedProfile);
      return false;
    }

    setIsAuthenticated(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('name, date_of_birth, gender, interests, photo_url, is_discoverable')
      .eq('id', authData.session.user.id)
      .maybeSingle();

    if (error) {
      setHasSupabaseProfile(false);
      setProfileLoadError(true);
      setProfile(cachedProfile);
      throw error;
    }

    if (!data) {
      setHasSupabaseProfile(false);
      setProfileLoadError(false);
      setProfile(cachedProfile);
      return false;
    }

    if (
      typeof data.name !== 'string' ||
      typeof data.date_of_birth !== 'string' ||
      typeof data.gender !== 'string' ||
      !isStringArray(data.interests)
    ) {
      setHasSupabaseProfile(false);
      setProfileLoadError(true);
      setProfile(cachedProfile);
      throw new Error('Your saved profile has an unexpected format.');
    }

    let remotePhotos = { paths: [] as string[], urls: [] as string[] };
    try { remotePhotos = await loadOwnProfilePhotos(); } catch {
      // Keep the local gallery available when Storage is not configured yet.
    }

    const remoteProfile: UserProfile = {
      name: data.name,
      dateOfBirth: toLocalDateOfBirth(data.date_of_birth),
      gender: data.gender,
      selectedInterests: data.interests,
      isDiscoverable: data.is_discoverable === true,
      // Keep a device-local image URI until photo uploads are supported.
      profilePhotoUri: remotePhotos.urls[0] ?? (typeof data.photo_url === 'string' ? data.photo_url : cachedProfile?.profilePhotoUri ?? null),
      ...(remotePhotos.paths.length || cachedProfile?.profilePhotos || cachedProfile?.profilePhotoPaths
        ? {
            profilePhotos: remotePhotos.urls.length ? remotePhotos.urls : cachedProfile?.profilePhotos ?? [],
            profilePhotoPaths: remotePhotos.paths.length ? remotePhotos.paths : cachedProfile?.profilePhotoPaths ?? [],
          }
        : {}),
    };

    // A token refresh or restart must not replace an unsynced selection with the
    // old cloud gallery. Never carry a pending selection into another account.
    if (cachedProfile?.pendingPhotoUserId === authData.session.user.id) {
      remoteProfile.profilePhotos = cachedProfile.profilePhotos;
      remoteProfile.profilePhotoPaths = cachedProfile.profilePhotoPaths;
      remoteProfile.profilePhotoUri = cachedProfile.profilePhotoUri;
      remoteProfile.pendingPhotoUserId = cachedProfile.pendingPhotoUserId;
    }

    try {
      await storeUserProfile(remoteProfile);
    } catch {
      // The remote profile can still be used for this session.
    }

    setHasSupabaseProfile(true);
    setProfileLoadError(false);
    setProfile(remoteProfile);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    await clearUserProfile();
    setProfile(null);
    setIsAuthenticated(false);
    setHasSupabaseProfile(false);
    setProfileLoadError(false);
    setIsProfileLoaded(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initialRefreshTimer = setTimeout(() => {
      refreshProfile()
        .catch(() => undefined)
        .finally(() => {
          if (isMounted) setIsProfileLoaded(true);
        });
    }, 0);
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (DEVELOPMENT_AUTH_BYPASS) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        if (refreshTimer) clearTimeout(refreshTimer);
        setProfile(null);
        setIsAuthenticated(false);
        setHasSupabaseProfile(false);
        setProfileLoadError(false);
        setIsProfileLoaded(true);
        void clearUserProfile().catch(() => undefined);
        return;
      }

      if (!['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) return;

      if (refreshTimer) clearTimeout(refreshTimer);
      setProfileLoadError(false);
      setIsProfileLoaded(false);
      // Defer Supabase queries until the auth callback releases its internal lock.
      refreshTimer = setTimeout(() => {
        refreshProfile()
          .catch(() => undefined)
          .finally(() => {
            if (isMounted) setIsProfileLoaded(true);
          });
      }, 0);
    });

    return () => {
      isMounted = false;
      clearTimeout(initialRefreshTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const saveProfile = async (nextProfile: UserProfile) => {
    await storeUserProfile(nextProfile);
    setProfile(nextProfile);
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isProfileLoaded,
        isAuthenticated,
        hasSupabaseProfile,
        profileLoadError,
        signOut,
        refreshProfile,
        saveProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
