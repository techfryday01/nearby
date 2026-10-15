export function getSafeAuthMessage(error: unknown): string {
  const rawMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message).toLowerCase()
      : '';

  if (rawMessage.includes('invalid login credentials')) {
    return 'The email or password is incorrect.';
  }
  if (rawMessage.includes('email not confirmed')) {
    return 'Please verify your email before logging in. Check your inbox for the confirmation link.';
  }
  if (rawMessage.includes('already registered') || rawMessage.includes('already exists')) {
    return 'An account may already exist for this email. Try logging in instead.';
  }
  if (rawMessage.includes('password') && (rawMessage.includes('weak') || rawMessage.includes('short'))) {
    return 'Choose a stronger password and try again.';
  }
  if (rawMessage.includes('too many requests') || rawMessage.includes('rate limit')) {
    return 'There have been too many attempts. Please wait a moment and try again.';
  }
  if (rawMessage.includes('fetch') || rawMessage.includes('network')) {
    return 'Unable to reach SecondMeet. Check your connection and try again.';
  }

  return 'Unable to complete authentication right now. Please check your details and try again.';
}
