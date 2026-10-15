import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const heart = require('../../assets/secondmeet-heart-no-text.png');

export function SecondMeetMark({ size = 72 }: { size?: number }) {
  return <Image accessibilityLabel="SecondMeet two-face heart logo" source={heart} resizeMode="contain" style={{ width: size, height: size }} />;
}

export function SecondMeetWordmark({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <SecondMeetMark size={compact ? 28 : 38} />
      <Text style={[styles.wordmark, { color: colors.text, fontSize: compact ? 15 : 18 }]}>
        SECOND<Text style={{ color: colors.accent }}>MEET</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 9 }, wordmark: { fontWeight: '800', letterSpacing: 2.2 } });
