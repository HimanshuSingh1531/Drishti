import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const TRANSLATIONS = {
  en: {
    tagline: 'Authenticating India, Offline.',
    loginBtn: 'Login with Face ID',
    english: 'English',
    hindi: 'हिंदी',
    version: 'v1.0 • Offline Mode Active',
    poweredBy: 'Powered by DRISHTI AI Engine',
  },
  hi: {
    tagline: 'भारत को ऑफलाइन प्रमाणित करना।',
    loginBtn: 'फेस आईडी से लॉगिन करें',
    english: 'English',
    hindi: 'हिंदी',
    version: 'v1.0 • ऑफलाइन मोड सक्रिय',
    poweredBy: 'DRISHTI AI इंजन द्वारा संचालित',
  },
};

export default function SplashScreen({ navigation }: any) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = TRANSLATIONS[lang];

  return (
    <SafeAreaView style={styles.container}>

      {/* Top Blue Section */}
      <View style={styles.topSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>👁️</Text>
        </View>
        <Text style={styles.appName}>DRISHTI</Text>
        <Text style={styles.tagline}>{t.tagline}</Text>
      </View>

      {/* Bottom White Section */}
      <View style={styles.bottomSection}>

        {/* Language Toggle */}
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
            onPress={() => setLang('en')}>
            <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>
              {t.english}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}
            onPress={() => setLang('hi')}>
            <Text style={[styles.langText, lang === 'hi' && styles.langTextActive]}>
              {t.hindi}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button — Login Screen pe jaata hai */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login', { lang })}>
          <Text style={styles.loginBtnText}>{t.loginBtn}</Text>
        </TouchableOpacity>

        {/* Offline Badge */}
        <View style={styles.offlineBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.offlineText}>{t.version}</Text>
        </View>

        <Text style={styles.poweredBy}>{t.poweredBy}</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3C6E',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#FF6B00',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 36 },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    gap: 16,
    alignItems: 'center',
  },
  langRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 4,
    width: '100%',
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: '#1A3C6E' },
  langText: { fontSize: 14, color: '#6E6E73', fontWeight: '500' },
  langTextActive: { color: '#FFFFFF' },
  loginBtn: {
    backgroundColor: '#1A3C6E',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  greenDot: {
    width: 8,
    height: 8,
    backgroundColor: '#2ECC71',
    borderRadius: 4,
  },
  offlineText: { fontSize: 12, color: '#2ECC71', fontWeight: '500' },
  poweredBy: { fontSize: 11, color: '#AAAAAA' },
});