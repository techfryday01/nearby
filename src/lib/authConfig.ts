// This switch can bypass auth only in development builds. Even if enabled for local
// testing, production APKs always use Supabase authentication.
const DEVELOPMENT_AUTH_BYPASS_REQUESTED = false;

export const DEVELOPMENT_AUTH_BYPASS = __DEV__ && DEVELOPMENT_AUTH_BYPASS_REQUESTED;
