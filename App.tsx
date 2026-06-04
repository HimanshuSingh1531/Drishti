import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { loadModels } from './src/ml/faceDetector';
import { initDB } from './src/utils/storage';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing DRISHTI...');

  useEffect(() => {
    async function initialize() {
      try {
        // Step 1: Init Database
        setLoadingText('Setting up secure database...');
        await initDB();

        // Step 2: Load AI Models
        setLoadingText('Loading AI models...');
        await loadModels();

        // Step 3: Ready!
        setLoadingText('Ready!');
        await new Promise(res => setTimeout(res, 500));
        setLoading(false);
      } catch (error) {
        console.log('Init error:', error);
        setLoading(false);
      }
    }
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>👁️</Text>
        </View>
        <Text style={styles.appName}>DRISHTI</Text>
        <Text style={styles.tagline}>Authenticating India, Offline.</Text>
        <ActivityIndicator
          size="large"
          color="#FF6B00"
          style={styles.loader}
        />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A3C6E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 90,
    height: 90,
    backgroundColor: '#FF6B00',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 40 },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  loader: { marginTop: 24 },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
});