import { GlassCard } from './Glass';
import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = { value: string; onChangeText: (value: string) => void; accessibilityLabel?: string };
type Part = 'day' | 'month' | 'year';

function splitValue(value: string) {
  const parts = value.split('/');
  return { day: (parts[0] ?? '').replace(/\D/g, '').slice(0, 2), month: (parts[1] ?? '').replace(/\D/g, '').slice(0, 2), year: (parts[2] ?? '').replace(/\D/g, '').slice(0, 4) };
}

export function validateAdultDateOfBirth(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return 'Enter your full date of birth.';
  const day = Number(match[1]); const month = Number(match[2]); const year = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  if (year < 1900 || candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return 'Enter a real calendar date.';
  const today = new Date();
  if (candidate > new Date(today.getFullYear(), today.getMonth(), today.getDate())) return 'Your date of birth cannot be in the future.';
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age -= 1;
  if (age < 18) return 'SecondMeet is available only to people aged 18 or older.';
  return null;
}

export function DateOfBirthInput({ value, onChangeText, accessibilityLabel = 'Date of birth' }: Props) {
  const { colors } = useTheme();
  const parts = splitValue(value);
  const refs = useRef<Record<Part, TextInput | null>>({ day: null, month: null, year: null });
  const ordered: Part[] = ['day', 'month', 'year'];

  const update = (part: Part, raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, part === 'year' ? 4 : 2);
    const next = { ...parts, [part]: clean };
    onChangeText(`${next.day}/${next.month}/${next.year}`);
    if (clean.length === (part === 'year' ? 4 : 2)) {
      const nextPart = ordered[ordered.indexOf(part) + 1];
      if (nextPart) refs.current[nextPart]?.focus();
    }
  };

  const widths: Record<Part, number> = { day: 45, month: 48, year: 72 };
  return <GlassCard style={[s.row, { backgroundColor: colors.input, borderColor: colors.border }]} accessibilityLabel={accessibilityLabel}>
    {ordered.map((part, index) => <View key={part} style={s.partWrap}>
      <TextInput
        ref={(node) => { refs.current[part] = node; }}
        value={parts[part]}
        onChangeText={(text) => update(part, text)}
        onKeyPress={(event) => {
          if (event.nativeEvent.key === 'Backspace' && !parts[part]) {
            const previous = ordered[index - 1];
            if (previous) {
              const next = { ...parts, [previous]: parts[previous].slice(0, -1) };
              onChangeText(`${next.day}/${next.month}/${next.year}`);
              refs.current[previous]?.focus();
            }
          }
        }}
        keyboardType="number-pad"
        maxLength={part === 'year' ? 4 : 2}
        placeholder={part === 'day' ? 'DD' : part === 'month' ? 'MM' : 'YYYY'}
        placeholderTextColor={colors.subtle}
        accessibilityLabel={`${accessibilityLabel}, ${part}`}
        textContentType="none"
        selectTextOnFocus
        style={[s.input, { width: widths[part], color: colors.text }]}
      />
      {index < 2 ? <Text accessibilityElementsHidden style={[s.slash, { color: colors.accent }]}>/</Text> : null}
    </View>)}
  </GlassCard>;
}

const s = StyleSheet.create({ row: { minHeight: 58, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, partWrap: { flexDirection: 'row', alignItems: 'center' }, input: { height: 52, textAlign: 'center', fontSize: 17, fontWeight: '700', paddingHorizontal: 0 }, slash: { width: 17, textAlign: 'center', fontSize: 20, fontWeight: '600' } });
