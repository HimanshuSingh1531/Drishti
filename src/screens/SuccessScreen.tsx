import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';

const TRANSLATIONS = {
  en: {
    title: 'Verified Successfully',
    name: 'Name',
    empId: 'Employee ID',
    department: 'Department',
    time: 'Time',
    location: 'Location',
    status: 'Status',
    offline: 'Offline',
    markBtn: 'Mark Attendance',
    syncNote: 'Data will sync automatically when online',
    dashboard: 'Go to Dashboard',
    attendanceMarked: '✓ Attendance Marked!',
  },
  hi: {
    title: 'सफलतापूर्वक सत्यापित',
    name: 'नाम',
    empId: 'कर्मचारी आईडी',
    department: 'विभाग',
    time: 'समय',
    location: 'स्थान',
    status: 'स्थिति',
    offline: 'ऑफलाइन',
    markBtn: 'उपस्थिति दर्ज करें',
    syncNote: 'ऑनलाइन होने पर डेटा स्वतः सिंक होगा',
    dashboard: 'डैशबोर्ड पर जाएं',
    attendanceMarked: '✓ उपस्थिति दर्ज हो गई!',
  },
};

export default function SuccessScreen({ navigation, route }: any) {
  const lang = route?.params?.lang || 'en';
  const empName = route?.params?.empName || 'Field Employee';
  const empId = route?.params?.empId || 'DL-0000-0000';
  const department = route?.params?.department || 'Field Operations';
  const locationZone = route?.params?.locationZone || 'Zone A';
  const distanceMeters = route?.params?.distanceMeters || 0;

  const t = TRANSLATIONS[lang];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [marked, setMarked] = useState(false);
  const [currentTime] = useState(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  );
  const [currentDate] = useState(
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  );

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === 'en' ? 'Authentication Result' : 'प्रमाणीकरण परिणाम'}
        </Text>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Success Icon */}
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          <Text style={styles.verifiedText}>{t.title}</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </Animated.View>

        {/* Info Card */}
        <Animated.View style={[
          styles.infoCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
          <InfoRow label={t.name} value={empName} />
          <Divider />
          <InfoRow label={t.empId} value={empId} isMonospace />
          <Divider />
          <InfoRow label={t.department} value={department} />
          <Divider />
          <InfoRow label={t.time} value={currentTime} />
          <Divider />
          <InfoRow
            label={t.location}
            value={null}
            locationZone={locationZone}
            distanceMeters={distanceMeters}
          />
          <Divider />
          <InfoRow
            label={t.status}
            value={t.offline}
            isOffline
          />
        </Animated.View>

        {/* Mark Attendance Button */}
        <Animated.View style={[
          styles.fullWidth,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
          {!marked ? (
            <TouchableOpacity
              style={styles.markBtn}
              onPress={() => setMarked(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.markBtnText}>{t.markBtn}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.markedBadge}>
              <Text style={styles.markedText}>{t.attendanceMarked}</Text>
            </View>
          )}
        </Animated.View>

        {/* Sync Note */}
        <Animated.View style={[
          styles.syncNote,
          { opacity: fadeAnim },
        ]}>
          <Text style={styles.syncIcon}>🔄</Text>
          <Text style={styles.syncText}>{t.syncNote}</Text>
        </Animated.View>

        {/* Dashboard Button */}
        {marked && (
          <View style={styles.fullWidth}>
            <TouchableOpacity
              style={styles.dashboardBtn}
              onPress={() => navigation.navigate('Dashboard', { lang })}
              activeOpacity={0.85}
            >
              <Text style={styles.dashboardBtnText}>{t.dashboard}</Text>
            </TouchableOpacity>
          </View>
        )}

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, isMonospace, isOffline, locationZone, distanceMeters }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      {isOffline ? (
        <View style={styles.offlinePill}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlinePillText}>{value}</Text>
        </View>
      ) : locationZone !== undefined ? (
        <View style={styles.locationRow}>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneBadgeText}>{locationZone}</Text>
          </View>
          <Text style={styles.distText}>{distanceMeters}m away</Text>
        </View>
      ) : (
        <Text style={[
          styles.infoValue,
          isMonospace && styles.monoValue,
        ]}>
          {value}
        </Text>
      )}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },

  header: {
    backgroundColor: '#1A3C6E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },

  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 32,
    gap: 14,
  },

  fullWidth: { width: '100%' },

  successCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#E0F7EC',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2ECC71',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  checkIcon: { fontSize: 36, color: '#27AE60' },

  verifiedText: { fontSize: 19, fontWeight: '700', color: '#1A3C6E', marginBottom: 2 },
  dateText: { fontSize: 12, color: '#9AA3B0' },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#E2E6EF',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  infoLabel: { fontSize: 12.5, color: '#9AA3B0' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1C2033' },
  monoValue: {
    fontFamily: 'Courier New',
    fontSize: 12.5,
    color: '#1A3C6E',
    letterSpacing: 0.4,
  },
  divider: { height: 0.5, backgroundColor: '#F2F4F8', marginHorizontal: 0 },

  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF4E8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E87A00',
  },
  offlinePillText: { fontSize: 12, fontWeight: '700', color: '#E87A00' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zoneBadge: {
    backgroundColor: '#EEF2FA',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  zoneBadgeText: { fontSize: 11, fontWeight: '600', color: '#3B5EA6' },
  distText: { fontSize: 12, color: '#9AA3B0' },

  markBtn: {
    backgroundColor: '#1A3C6E',
    borderRadius: 13,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  markBtnText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },

  markedBadge: {
    backgroundColor: '#E8F8F0',
    borderRadius: 13,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2ECC71',
  },
  markedText: { color: '#27AE60', fontSize: 14, fontWeight: '700' },

  syncNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFF4E8',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#FFDDAA',
  },
  syncIcon: { fontSize: 13 },
  syncText: { fontSize: 11.5, color: '#C86800', fontWeight: '500' },

  dashboardBtn: {
    backgroundColor: '#E87A00',
    borderRadius: 13,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  dashboardBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});