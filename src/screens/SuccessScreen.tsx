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

  // ─── Real employee data from route params ───
  const empName = route?.params?.empName || 'Field Employee';
  const empId = route?.params?.empId || 'DL-0000-0000';
  const department = route?.params?.department || 'Field Operations';
  const locationZone = route?.params?.locationZone || 'Zone A';
  const distanceMeters = route?.params?.distanceMeters || 0;

  const t = TRANSLATIONS[lang];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [marked, setMarked] = useState(false);
  const [currentTime] = useState(
    new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  );
  const [currentDate] = useState(
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  );

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === 'en' ? 'Authentication Result' : 'प्रमाणीकरण परिणाम'}
        </Text>
      </View>

      <View style={styles.content}>

        {/* Success Icon */}
        <Animated.View style={[
          styles.successCircle,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Text style={styles.verifiedText}>{t.title}</Text>
        <Text style={styles.dateText}>{currentDate}</Text>

        {/* Info Card — Real Data */}
        <View style={styles.infoCard}>
          <InfoRow label={t.name} value={empName} />
          <Divider />
          <InfoRow label={t.empId} value={empId} />
          <Divider />
          <InfoRow label={t.department} value={department} />
          <Divider />
          <InfoRow label={t.time} value={currentTime} />
          <Divider />
          <InfoRow
            label={t.location}
            value={`${locationZone} • ${distanceMeters}m`}
          />
          <Divider />
          <InfoRow
            label={t.status}
            value={t.offline}
            valueStyle={{ color: '#FF6B00', fontWeight: '600' }}
          />
        </View>

        {/* Mark Attendance Button */}
        {!marked ? (
          <TouchableOpacity
            style={styles.markBtn}
            onPress={() => setMarked(true)}>
            <Text style={styles.markBtnText}>{t.markBtn}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markedBadge}>
            <Text style={styles.markedText}>{t.attendanceMarked}</Text>
          </View>
        )}

        {/* Sync Note */}
        <View style={styles.syncNote}>
          <Text style={styles.syncIcon}>🔄</Text>
          <Text style={styles.syncText}>{t.syncNote}</Text>
        </View>

        {/* Dashboard Button */}
        {marked && (
          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={() => navigation.navigate('Dashboard', { lang })}>
            <Text style={styles.dashboardBtnText}>{t.dashboard}</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, valueStyle }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    backgroundColor: '#1A3C6E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 14,
  },
  successCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#E8F8F0',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2ECC71',
  },
  checkIcon: { fontSize: 36, color: '#2ECC71' },
  verifiedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3C6E',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: -8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13, color: '#888888' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  divider: { height: 0.5, backgroundColor: '#F0F0F0' },
  markBtn: {
    backgroundColor: '#1A3C6E',
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  markBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  markedBadge: {
    backgroundColor: '#E8F8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#2ECC71',
    width: '100%',
    alignItems: 'center',
  },
  markedText: { color: '#2ECC71', fontSize: 14, fontWeight: '600' },
  syncNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  syncIcon: { fontSize: 13 },
  syncText: { fontSize: 11, color: '#FF6B00', fontWeight: '500' },
  dashboardBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  dashboardBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});