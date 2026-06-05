import React, { useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { loadModels } from './src/ml/faceDetector';
import { initDB } from './src/utils/storage';
import { Eye } from 'lucide-react-native';

const NAVY        = '#1A3C6E';
const NAVY_MID    = '#1E4880';
const ORANGE      = '#FF6B00';
const WHITE       = '#FFFFFF';
const GREEN       = '#22C55E';

export default function App() {
  const [loading, setLoading]       = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing DRISHTI...');

  // Animations
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.75)).current;
  const pulseRing  = useRef(new Animated.Value(1)).current;
  const scanLine   = useRef(new Animated.Value(0)).current;
  const dotAnim    = useRef(new Animated.Value(0)).current;
  const fadeOut    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // ── Entrance ──
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
    ]).start();

    // Pulse ring loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, { toValue: 1.14, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseRing, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Scan line loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    ).start();

    // Progress dots loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 3, duration: 900, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0, duration: 0,   useNativeDriver: false }),
      ])
    ).start();

    // ── Init ──
    async function initialize() {
      try {
        setLoadingText('Setting up secure database...');
        await initDB();

        setLoadingText('Loading AI models...');
        await loadModels();

        setLoadingText('Ready!');

        // Short fade-out then unmount
        Animated.timing(fadeOut, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setLoading(false);
        });
      } catch (error) {
        console.log('Init error:', error);
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const scanLineY = scanLine.interpolate({
    inputRange:  [0, 1],
    outputRange: [-50, 50],
  });

  if (!loading) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <AppNavigator />
      </>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: Animated.multiply(fadeAnim, fadeOut) }]}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* BG decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* ── Logo ── */}
      <Animated.View style={{ transform: [{ scale: logoScale }], alignItems: 'center' }}>

        {/* Pulse ring */}
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseRing }] }]} />

        {/* Orange logo square */}
        <View style={styles.logoCircle}>
          {/* Scan line */}
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

      {/* App Name */}
      <View style={styles.nameRow}>
        <Text style={styles.appName}>DRISHTI</Text>
        <View style={styles.nameBadge}>
          <Text style={styles.nameBadgeText}>AI</Text>
        </View>
      </View>

      <Text style={styles.tagline}>Authenticating India, Offline.</Text>

      {/* Loading status */}
      <View style={styles.statusRow}>
        <View style={styles.greenDot} />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>

      {/* Thin progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={styles.progressBar} />
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  bgCircle1: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: NAVY_MID,
    top: -70, right: -70, opacity: 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: ORANGE,
    bottom: 60, left: -60, opacity: 0.07,
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
    elevation: 14,
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
  bracket: {
    position: 'absolute',
    width: 14, height: 14,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  bracketTL: { top: 8,  left: 8,  borderTopWidth: 2, borderLeftWidth: 2,  borderTopLeftRadius: 3 },
  bracketTR: { top: 8,  right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 3 },
  bracketBL: { bottom: 8, left: 8,  borderBottomWidth: 2, borderLeftWidth: 2,  borderBottomLeftRadius: 3 },
  bracketBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 3 },

  // Text
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: {
    fontSize: 36, fontWeight: '800', color: WHITE, letterSpacing: 8,
  },
  nameBadge: {
    backgroundColor: ORANGE, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  nameBadgeText: { color: WHITE, fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  tagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8, textAlign: 'center',
  },

  // Status
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 24,
  },
  greenDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN,
  },
  loadingText: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3,
  },

  // Progress bar (decorative thin line)
  progressTrack: {
    width: 160, height: 2, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    width: '60%', height: '100%', borderRadius: 2,
    backgroundColor: ORANGE,
    opacity: 0.7,
  },
});