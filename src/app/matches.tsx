import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMatches } from '../state/MatchContext';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, isMatchesLoaded } = useMatches();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090D" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerEyebrow}>NEARBY</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>
          {!isMatchesLoaded
            ? 'Loading your matches...'
            : matches.length > 0
            ? 'A little spark could turn into something great.'
            : 'Your connections will show up here.'}
        </Text>

        {!isMatchesLoaded ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading matches...</Text>
          </View>
        ) : matches.length > 0 ? (
          <View style={styles.list}>
            {matches.map((match) => (
              <Pressable
                key={match.id}
                accessibilityRole="button"
                accessibilityLabel={`Open chat with ${match.name}, ${match.age}`}
                onPress={() =>
                  router.push({ pathname: '/chat/[id]', params: { id: match.id } })
                }
                style={({ pressed }) => [styles.matchCard, pressed && styles.pressed]}
              >
                <View style={[styles.avatar, { backgroundColor: match.color }]}>
                  <Text style={styles.avatarInitial}>{match.initials}</Text>
                  <View style={styles.onlineDot} />
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>
                    {match.name}, {match.age}
                  </Text>
                  <Text style={styles.matchMessage}>You matched! Say hello.</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>♥</Text>
            </View>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyMessage}>
              Keep discovering people nearby. When you match, you’ll find them here.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/discovery')}
              style={({ pressed }) => [styles.discoverButton, pressed && styles.pressed]}
            >
              <Text style={styles.discoverButtonText}>Discover people</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090D' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#17171E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#FFFFFF', fontSize: 31, lineHeight: 34, marginTop: -4 },
  headerEyebrow: { color: '#E83E8C', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headerSpacer: { width: 42 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginTop: 28 },
  subtitle: { color: '#A9A9B2', fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 24 },
  list: { gap: 12 },
  loadingState: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#A9A9B2', fontSize: 14 },
  matchCard: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    backgroundColor: '#121219',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282832',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#FFFFFF', fontSize: 27, fontWeight: '500' },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#E83E8C',
    borderWidth: 2,
    borderColor: '#121219',
  },
  matchInfo: { flex: 1, marginLeft: 14 },
  matchName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  matchMessage: { color: '#E5A6C7', fontSize: 13, marginTop: 6 },
  chevron: { color: '#777783', fontSize: 27, marginLeft: 8 },
  emptyState: {
    flex: 1,
    minHeight: 390,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#26141F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyIcon: { color: '#E83E8C', fontSize: 30 },
  emptyTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
  emptyMessage: { color: '#A9A9B2', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9 },
  discoverButton: {
    backgroundColor: '#E83E8C',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 22,
  },
  discoverButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
