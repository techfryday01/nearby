import { Stack } from 'expo-router';
import { MatchProvider } from '../state/MatchContext';
import { ProfileProvider } from '../state/ProfileContext';
import { ThemeProvider } from '../theme/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <MatchProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </MatchProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
