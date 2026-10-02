import { Stack } from 'expo-router';
import { MatchProvider } from '../state/MatchContext';
import { ProfileProvider } from '../state/ProfileContext';

export default function RootLayout() {
  return (
    <ProfileProvider>
      <MatchProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </MatchProvider>
    </ProfileProvider>
  );
}
