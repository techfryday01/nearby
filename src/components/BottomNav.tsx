import { GlassCard } from './Glass';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { SecondMeetWordmark } from './SecondMeetBrand';

const TABS = [
  { key: 'discover', label: 'Discover', route: '/discovery', icon: '♡' },
  { key: 'matches', label: 'Matches', route: '/matches', icon: '♥' },
  { key: 'chats', label: 'Chats', route: '/chats', icon: '◌' },
  { key: 'profile', label: 'Profile', route: '/profile', icon: '○' },
] as const;

export function BottomNav({ active }: { active: 'discover' | 'matches' | 'chats' | 'profile' }) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <GlassCard style={[styles.bar, { borderColor: colors.border }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${tab.label}`}
            accessibilityState={{ selected: isActive }}
            onPress={() => { if (!isActive) router.replace(tab.route as Href); }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            {tab.key === 'profile' || tab.key === 'chats' ? (
              <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.drawnIcon}>
                {tab.key === 'profile' ? <>
                  <View style={[styles.personHead, { borderColor: isActive ? colors.accent : colors.subtle }]} />
                  <View style={[styles.personShoulders, { borderColor: isActive ? colors.accent : colors.subtle }]} />
                </> : <>
                  <View style={[styles.chatBubble, { borderColor: isActive ? colors.accent : colors.subtle }]}>
                    {[0, 1, 2].map((dot) => <View key={dot} style={[styles.chatDot, { backgroundColor: isActive ? colors.accent : colors.subtle }]} />)}
                  </View>
                  <View style={[styles.chatTail, { borderColor: isActive ? colors.accent : colors.subtle }]} />
                </>}
              </View>
            ) : <Text style={[styles.icon, { color: isActive ? colors.accent : colors.subtle }]}>{tab.icon}</Text>}
            <Text style={[styles.label, { color: isActive ? colors.accent : colors.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </GlassCard>
  );
}

export function BrandHeader({ trailing }: { trailing?: ReactNode }) {
  return (
    <View style={styles.header}>
      <SecondMeetWordmark compact />
      <View>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { marginHorizontal: 0, marginTop: 0, marginBottom: 0, borderRadius: 0, minHeight: 66, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingTop: 7, paddingBottom: 4 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, gap: 2 },
  icon: { fontSize: 22, lineHeight: 25 },
  drawnIcon: { width: 26, height: 25, alignItems: 'center' },
  personHead: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.7, marginTop: 1 },
  personShoulders: { position: 'absolute', bottom: 1, width: 22, height: 11, borderWidth: 1.7, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  chatBubble: { marginTop: 2, width: 23, height: 18, borderRadius: 7, borderWidth: 1.7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  chatDot: { width: 2.5, height: 2.5, borderRadius: 2 },
  chatTail: { position: 'absolute', left: 4, bottom: 2, width: 5, height: 6, borderLeftWidth: 1.7, transform: [{ rotate: '28deg' }] },
  label: { fontSize: 10, fontWeight: '700' },
  pressed: { opacity: 0.68 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
});
