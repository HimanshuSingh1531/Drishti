import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import {
  ScanFace,
  UserPlus,
  Wifi,
  Eye,
  Fingerprint,
  ChevronRight,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const NAVY        = '#1A3C6E';
const NAVY_DARK   = '#112A50';
const NAVY_MID    = '#1E4880';
const ORANGE      = '#FF6B00';
const ORANGE_SOFT = '#FF8C3A';
const WHITE       = '#FFFFFF';
const GREEN       = '#22C55E';

const TRANSLATIONS = {
  en: {
    tagline: 'Authenticating India, Offline.',
    loginBtn: 'Login with Face ID',
    registerBtn: 'New Employee? Register Here',
    english: 'English',
    hindi: 'हिंदी',
    version: 'v1.0  •  Offline Mode Active',
    poweredBy: 'Powered by DRISHTI AI Engine',
  },
  hi: {
    tagline: 'भारत को ऑफलाइन प्रमाणित करना।',
    loginBtn: 'फेस आईडी से लॉगिन करें',
    registerBtn: 'नए कर्मचारी? यहाँ रजिस्टर करें',
    english: 'English',
    hindi: 'हिंदी',
    version: 'v1.0  •  ऑफलाइन मोड सक्रिय',
    poweredBy: 'DRISHTI AI इंजन द्वारा संचालित',
  },
};

export default function SplashScreen({ navigation }: any) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = TRANSLATIONS[lang];

  // Animations
  const fadeTop    = useRef(new Animated.Value(0)).current;
  const slideUp    = useRef(new Animated.Value(40)).current;
  const fadeBottom = useRef(new Animated.Value(0)).current;
  const slideBottom= useRef(new Animated.Value(60)).current;
  const logoScale  = useRef(new Animated.Value(0.7)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseRing  = useRef(new Animated.Value(1)).current;
  const scanLine   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(logoRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(fadeTop,    { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideUp,    { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeBottom,   { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideBottom,  { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Pulse ring loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseRing, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Scan line loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const logoRotateDeg = logoRotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const scanLineY = scanLine.interpolate({
    inputRange:  [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <SafeAreaView style={styles.container}>

      {/* Background circles — decorative */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* ── TOP SECTION ── */}
      <Animated.View style={[styles.topSection, { opacity: fadeTop, transform: [{ translateY: slideUp }] }]}>

        {/* Logo lockup */}
        <Animated.View style={{ transform: [{ scale: logoScale }, { rotate: logoRotateDeg }] }}>
          {/* Outer pulse ring */}
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseRing }] }]} />

          {/* Logo circle */}
          <View style={styles.logoCircle}>
            {/* Scan line animation */}
            <View style={styles.scanLineContainer}>
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
            </View>

            {/* Eye icon */}
            <Eye size={42} color={WHITE} strokeWidth={1.8} />

            {/* Corner brackets */}
            <View style={[styles.bracket, styles.bracketTL]} />
            <View style={[styles.bracket, styles.bracketTR]} />
            <View style={[styles.bracket, styles.bracketBL]} />
            <View style={[styles.bracket, styles.bracketBR]} />
          </View>
        </Animated.View>

        {/* App name */}
        <View style={styles.nameRow}>
          <Text style={styles.appName}>DRISHTI</Text>
          <View style={styles.nameBadge}>
            <Text style={styles.nameBadgeText}>AI</Text>
          </View>
        </View>

        <Text style={styles.tagline}>{t.tagline}</Text>

        {/* Feature pills */}
        <View style={styles.pillsRow}>
          {['Face ID', 'Offline', 'Secure'].map((pill, i) => (
            <View key={i} style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>{pill}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View style={[styles.bottomSection, { opacity: fadeBottom, transform: [{ translateY: slideBottom }] }]}>

        {/* Language Toggle */}
        <View style={styles.langRow}>
          {(['en', 'hi'] as const).map(l => (
            <TouchableOpacity
              key={l}
              style={[styles.langBtn, lang === l && styles.langBtnActive]}
              onPress={() => setLang(l)}
              activeOpacity={0.8}
            >
              <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                {l === 'en' ? t.english : t.hindi}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login', { lang })}
          activeOpacity={0.85}
        >
          <View style={styles.loginBtnInner}>
            <View style={styles.loginBtnIconWrap}>
              <ScanFace size={22} color={ORANGE} strokeWidth={2} />
            </View>
            <Text style={styles.loginBtnText}>{t.loginBtn}</Text>
          </View>
          <ChevronRight size={18} color={WHITE} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => navigation.navigate('Register', { lang })}
          activeOpacity={0.85}
        >
          <UserPlus size={18} color={NAVY} strokeWidth={2} style={{ marginRight: 8 }} />
          <Text style={styles.registerBtnText}>{t.registerBtn}</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Fingerprint size={18} color="#C0CAD8" strokeWidth={1.5} />
          <View style={styles.dividerLine} />
        </View>

        {/* Offline Badge */}
        <View style={styles.offlineBadge}>
          <View style={styles.greenDot} />
          <Wifi size={12} color={GREEN} strokeWidth={2.5} />
          <Text style={styles.offlineText}>{t.version}</Text>
        </View>

        <Text style={styles.poweredBy}>{t.poweredBy}</Text>

      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },

  // Background decorative circles
  bgCircle1: {
    position: 'absolute',
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: NAVY_MID,
    top: -80, right: -80, opacity: 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: NAVY_DARK,
    top: 60, left: -60, opacity: 0.6,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: ORANGE,
    top: height * 0.28, right: -50, opacity: 0.07,
  },

  // Top section
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },

  // Logo
  pulseRing: {
    position: 'absolute',
    width: 124, height: 124, borderRadius: 62,
    borderWidth: 2,
    borderColor: 'rgba(255,107,0,0.3)',
    top: -12, left: -12,
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
    elevation: 12,
    shadowColor: ORANGE,
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    overflow: 'hidden',
  },
  scanLineContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 28,
  },
  scanLine: {
    position: 'absolute',
    left: 0, right: 0, height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: '50%',
  },
  // Corner brackets on logo
  bracket: {
    position: 'absolute',
    width: 14, height: 14,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  bracketTL: { top: 8,  left: 8,  borderTopWidth: 2, borderLeftWidth: 2,  borderTopLeftRadius: 3 },
  bracketTR: { top: 8,  right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 3 },
  bracketBL: { bottom: 8, left: 8,  borderBottomWidth: 2, borderLeftWidth: 2,  borderBottomLeftRadius: 3 },
  bracketBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 3 },

  // App name
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: {
    fontSize: 36, fontWeight: '800', color: WHITE,
    letterSpacing: 8,
  },
  nameBadge: {
    backgroundColor: ORANGE,
    borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  nameBadgeText: { color: WHITE, fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  tagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8, textAlign: 'center', lineHeight: 20,
  },

  // Feature pills
  pillsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ORANGE_SOFT },
  pillText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },

  // Bottom sheet
  bottomSection: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 28, paddingBottom: 20,
    gap: 14,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
  },

  // Language toggle
  langRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F3FA',
    borderRadius: 14, padding: 4,
    width: '100%',
  },
  langBtn: {
    flex: 1, paddingVertical: 11,
    borderRadius: 11, alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: NAVY,
    elevation: 2,
    shadowColor: NAVY, shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  langText:       { fontSize: 14, color: '#8A93A8', fontWeight: '600' },
  langTextActive: { color: WHITE },

  // Login button
  loginBtn: {
    backgroundColor: NAVY,
    borderRadius: 16, paddingVertical: 15, paddingHorizontal: 20,
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 5,
    shadowColor: NAVY, shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loginBtnIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtnText: { color: WHITE, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  // Register button
  registerBtn: {
    backgroundColor: WHITE,
    borderRadius: 16, paddingVertical: 14,
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#DDE3EE',
  },
  registerBtnText: { color: NAVY, fontSize: 14, fontWeight: '600' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8ECF4' },

  // Offline badge
  offlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EDFBF3',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1, borderColor: '#B6EDD0',
  },
  greenDot: { width: 7, height: 7, backgroundColor: GREEN, borderRadius: 4 },
  offlineText: { fontSize: 11, color: '#1a7a4a', fontWeight: '600' },

  poweredBy: { fontSize: 11, color: '#B0B8C8', letterSpacing: 0.3 },
});