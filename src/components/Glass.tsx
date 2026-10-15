import { createContext, useContext, useRef, type ComponentProps, type RefObject } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type PressableProps, type TextInputProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const BlurTarget = createContext<RefObject<View | null> | undefined>(undefined);

// Layered low-opacity circles keep the lighting soft on native and web alike.
function AmbientGlow({ color, style }: { color: string; style: ViewProps['style'] }) {
  return <View style={[s.glow, style]}>
    {Array.from({ length: 16 }, (_, index) => <View key={index} style={{
      position: 'absolute', inset: index * 9, borderRadius: 300,
      backgroundColor: color, opacity: 0.025,
    }} />)}
  </View>;
}

export function GlassBackground({ children, style, ...props }: ComponentProps<typeof SafeAreaView>) {
  const { mode, colors } = useTheme();
  const target = useRef<View | null>(null);
  const dark = mode === 'dark';
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <BlurTargetView ref={target} pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={dark ? ['#060C15', '#080C17', '#090B13'] : ['#FFDAD2', '#F5D6F5', '#DFB8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {dark ? <>
        <AmbientGlow color="#D52368" style={s.glowTop} />
        <AmbientGlow color="#9A234E" style={s.glowBottom} />
      </> : <>
        <LinearGradient colors={['#FFF7FE', '#ECC3FF', '#CD8CEB']} start={{ x: 0.15, y: 0 }} end={{ x: 0.8, y: 1 }} style={[s.orb, s.orbTop]} />
        <LinearGradient colors={['#FFF0FF', '#F1B4F2', '#D48DEA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.orb, s.orbSide]} />
        <LinearGradient colors={['#FFFFFFBB', '#EDC5FE99', '#D3A0F399']} style={[s.orb, s.orbBottom]} />
      </>}
    </BlurTargetView>
    <BlurTarget.Provider value={target}>
      <SafeAreaView {...props} style={[{ flex: 1 }, style, { backgroundColor: 'transparent' }]}>{children}</SafeAreaView>
    </BlurTarget.Provider>
  </View>;
}

export function GlassCard({ children, style, ...props }: ViewProps) {
  const { mode, colors } = useTheme();
  const target = useContext(BlurTarget);
  return <View {...props} style={[s.glass, { borderColor: colors.border, shadowColor: colors.shadow }, style, { backgroundColor: 'transparent' }]}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BlurView blurTarget={target} blurMethod={Platform.OS === 'android' && target ? 'dimezisBlurViewSdk31Plus' : 'none'} intensity={20} tint={mode} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={mode === 'dark' ? ['rgba(107,74,99,0.26)', 'rgba(26,32,47,0.62)', 'rgba(28,26,42,0.55)'] : ['rgba(255,255,255,0.48)', 'rgba(255,243,255,0.28)', 'rgba(247,229,255,0.36)']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
    </View>
    {children}
  </View>;
}

export function GlassInput(props: TextInputProps) {
  const { colors } = useTheme();
  return <TextInput placeholderTextColor={colors.subtle} selectionColor={colors.accent} {...props} style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.input }, props.style]} />;
}

export function GradientButton({ children, style, activeOpacity: _activeOpacity, ...props }: PressableProps & { activeOpacity?: number }) {
  const { mode } = useTheme();
  return <Pressable accessibilityRole="button" {...props} style={(state) => [s.button, typeof style === 'function' ? style(state) : style, { overflow: 'hidden' }, (props.disabled || state.pressed) && { opacity: 0.55 }]}>
    {(state) => <>
      <LinearGradient pointerEvents="none" colors={mode === 'dark' ? ['#FF79AE', '#F42D85', '#EC1671'] : ['#FF986B', '#ED5AAF', '#B94FE7']} start={{ x: 0, y: 0 }} end={mode === 'dark' ? { x: 0.1, y: 1 } : { x: 1, y: 0.7 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={s.shine} />
      {typeof children === 'function' ? children(state) : children}
    </>}
  </Pressable>;
}
const s = StyleSheet.create({
  glow: { position: 'absolute', width: 440, height: 440 },
  glowTop: { right: -215, top: -120 },
  glowBottom: { left: -235, bottom: -80 },
  orb: { position: 'absolute', borderRadius: 160, borderWidth: 1, borderColor: '#FFFFFF33' },
  orbTop: { width: 148, height: 148, right: -65, top: 44 },
  orbSide: { width: 92, height: 92, left: -48, top: '40%' },
  orbBottom: { width: 154, height: 154, right: -85, bottom: 90 },
  glass: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 17, fontSize: 16 },
  button: { minHeight: 52, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF33', shadowColor: '#ED2581', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  shine: { position: 'absolute', top: 0, left: 15, right: 15, height: 1, backgroundColor: '#FFFFFF88' },
});
