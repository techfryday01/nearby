import React, { useEffect } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { DEVELOPMENT_AUTH_BYPASS } from '../lib/authConfig';
import { useProfile } from '../state/ProfileContext';
import { useTheme } from '../theme/ThemeContext';
import { SecondMeetMark } from '../components/SecondMeetBrand';
import { GlassBackground, GradientButton } from '../components/Glass';

export default function WelcomeScreen() {
  const router = useRouter();
  const { mode, colors } = useTheme();
  const s = styles(colors);
  const { isProfileLoaded, isAuthenticated, hasSupabaseProfile, profileLoadError } = useProfile();
  useEffect(() => {
    if (DEVELOPMENT_AUTH_BYPASS || !isProfileLoaded || !isAuthenticated || profileLoadError) return;
    router.replace(hasSupabaseProfile ? '/discovery' : '/create-profile');
  }, [hasSupabaseProfile, isAuthenticated, isProfileLoaded, profileLoadError, router]);
  return <GlassBackground>
    <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <View style={s.halo}><SecondMeetMark size={190} /></View>
        <Text style={s.brand}>SECOND<Text style={s.accent}>MEET</Text></Text>
        <Text style={s.tagline}>Real People. Real Connections.</Text>
      </View>
      <View style={s.panel}>
        <Text style={s.headline}>A second chance at{ '\n' }something wonderful.</Text>
        <Text style={s.copy}>Meet genuine people and build meaningful connections.</Text>
        <GradientButton onPress={() => router.push('/age-verification')} style={s.primary}><Text style={s.buttonText}>Get Started</Text><Text style={s.arrow}>→</Text></GradientButton>
        <Pressable accessibilityRole="button" onPress={() => router.push(DEVELOPMENT_AUTH_BYPASS ? '/create-profile' : ('/login' as Href))} style={s.secondary}><Text style={s.secondaryText}>I already have an account · Log In</Text></Pressable>
      </View>
      <Text style={s.footer}>18+ · Connect with intention</Text>
    </ScrollView>
  </GlassBackground>;
}
function styles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
 page:{flexGrow:1,paddingHorizontal:24,paddingTop:28,paddingBottom:24,justifyContent:'center',maxWidth:540,width:'100%',alignSelf:'center'},hero:{alignItems:'center',paddingVertical:28},halo:{borderRadius:110,overflow:'hidden',borderWidth:1,borderColor:'#E97AB044',shadowColor:c.accent,shadowOpacity:0.4,shadowRadius:28},brand:{fontSize:28,fontWeight:'800',letterSpacing:3,color:c.text,marginTop:22},accent:{color:c.accent},tagline:{fontSize:14,color:c.text,marginTop:10,fontWeight:'500'},panel:{paddingVertical:22,marginTop:22},headline:{color:c.text,fontSize:23,lineHeight:30,fontWeight:'700',textAlign:'center'},copy:{color:c.muted,fontSize:14,lineHeight:22,textAlign:'center',marginTop:12,marginBottom:26},primary:{flexDirection:'row',gap:22},buttonText:{color:'#FFFFFF',fontWeight:'800',fontSize:16},arrow:{color:'#FFFFFF',fontSize:23},secondary:{minHeight:52,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:c.border,borderRadius:26,marginTop:12,paddingHorizontal:8,backgroundColor:c.surface},secondaryText:{color:c.text,fontSize:12,fontWeight:'600'},footer:{color:c.muted,fontSize:11,textAlign:'center',marginTop:22}
}); }
