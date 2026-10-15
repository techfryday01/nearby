// Explicitly enabled for the internal testing APK; never bypasses authentication.
export const DEMO_PROFILES_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEMO_PROFILES === 'true';
