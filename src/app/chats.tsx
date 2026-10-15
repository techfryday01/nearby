import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassBackground as SafeAreaView, GlassCard, GradientButton } from '../components/Glass';
import { BottomNav, BrandHeader } from '../components/BottomNav';
import { useMatches, type ChatMessage, type MatchProfile } from '../state/MatchContext';
import { useTheme } from '../theme/ThemeContext';
import { demoProfilePhoto } from '../components/demoProfilePhoto';

type ChatRow = { match: MatchProfile; last: ChatMessage | null };

function timeLabel(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const s = styles(colors);
  const { matches, isMatchesLoaded, loadConversation } = useMatches();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!isMatchesLoaded) return;
    Promise.resolve().then(async () => {
      if (!active) return null;
      setLoading(true);
      return Promise.all(matches.map(async (match) => ({ match, last: (await loadConversation(match.id))?.at(-1) ?? null })));
    })
      .then((all) => { if (active && all) setRows(all.filter((row) => row.last !== null)); })
      .catch(() => { if (active) setRows([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isMatchesLoaded, loadConversation, matches]);

  return <SafeAreaView style={s.page}>
    <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <BrandHeader />
      <Text style={s.title}>Chats</Text>
      <Text style={s.subtitle}>Your conversations with matched people stay on this device.</Text>
      {loading ? <GlassCard style={s.empty}><Text style={s.copy}>Loading conversations…</Text></GlassCard> : rows.length ? <View style={s.list}>
        {rows.map(({ match, last }) => <Pressable key={match.id} accessibilityRole="button" accessibilityLabel={`Open chat with ${match.name}`} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: match.id } })} style={({ pressed }) => [s.card, pressed && s.pressed]}>
          <View style={[s.avatar, { backgroundColor: match.color }]}>{match.photoUri ? <Image source={{ uri: match.photoUri }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /> : demoProfilePhoto(match.id) ? <Image source={demoProfilePhoto(match.id)!} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Text style={s.initial}>{match.initials}</Text>}</View>
          <View style={s.detail}><View style={s.nameRow}><Text numberOfLines={1} style={s.name}>{match.name}</Text><Text style={s.time}>{timeLabel(last?.sentAt)}</Text></View><Text numberOfLines={1} style={s.last}>{last?.text ?? 'No messages yet'}</Text></View>
        </Pressable>)}
      </View> : <GlassCard style={s.empty}><Text style={s.heart}>♡</Text><Text style={s.emptyTitle}>No conversations yet</Text><Text style={s.copy}>Start a chat from an existing match. Messages are stored locally and are not synced between devices.</Text><GradientButton accessibilityRole="button" onPress={() => router.push('/matches')} style={s.button}><Text style={s.buttonText}>View matches</Text></GradientButton></GlassCard>}
    </ScrollView>
    <BottomNav active="chats" />
  </SafeAreaView>;
}

function styles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background }, content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22 },
  eyebrow: { color: c.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginTop: 24 }, title: { color: c.text, fontSize: 27, fontWeight: '700', marginTop: 18 }, subtitle: { color: c.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 22 },
  list: { gap: 10 }, card: { minHeight: 82, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, avatar: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, initial: { color: c.onAccent, fontSize: 22, fontWeight: '700' }, detail: { flex: 1, marginLeft: 13 }, nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, name: { flex: 1, color: c.text, fontSize: 15, fontWeight: '800' }, time: { color: c.subtle, fontSize: 10 }, last: { color: c.muted, fontSize: 12, marginTop: 6 },
  empty: { minHeight: 330, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, borderRadius: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, marginTop: 6 }, heart: { color: c.accent, fontSize: 43 }, emptyTitle: { color: c.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 11 }, copy: { color: c.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 }, button: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 15, backgroundColor: c.accent, marginTop: 22 }, buttonText: { color: c.onAccent, fontWeight: '800', fontSize: 14 }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
}); }
