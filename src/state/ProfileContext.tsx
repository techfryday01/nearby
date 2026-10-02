import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  loadUserProfile,
  storeUserProfile,
  type UserProfile,
} from './profileStorage';
import { supabase } from '../lib/supabase';

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
  saveProfile: (profile: UserProfile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      let cachedProfile: UserProfile | null = null;

      try {
        cachedProfile = await loadUserProfile();
      } catch {
        // Continue loading from Supabase even if local storage is unavailable.
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (!authError && authData.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, date_of_birth, gender, interests, photo_url')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (
            !error &&
            data &&
            typeof data.name === 'string' &&
            typeof data.date_of_birth === 'string' &&
            typeof data.gender === 'string' &&
            isStringArray(data.interests)
          ) {
            const remoteProfile: UserProfile = {
              name: data.name,
              dateOfBirth: toLocalDateOfBirth(data.date_of_birth),
              gender: data.gender,
              selectedInterests: data.interests,
              // Keep a device-local image URI until photo uploads are supported.
              profilePhotoUri:
                typeof data.photo_url === 'string'
                  ? data.photo_url
                  : cachedProfile?.profilePhotoUri ?? null,
            };

            try {
              await storeUserProfile(remoteProfile);
            } catch {
              // The remote profile can still be used for this session.
            }

            if (isMounted) setProfile(remoteProfile);
            return;
          }
        }
      } catch {
        // Supabase is optional here; fall back to the local profile if it is unavailable.
      }

      if (isMounted) setProfile(cachedProfile);
    };

    loadProfile()
      .catch(() => {
        if (isMounted) setProfile(null);
      })
      .finally(() => {
        if (isMounted) setIsProfileLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = async (nextProfile: UserProfile) => {
    await storeUserProfile(nextProfile);
    setProfile(nextProfile);
  };

  return (
    <ProfileContext.Provider value={{ profile, isProfileLoaded, saveProfile }}>
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
