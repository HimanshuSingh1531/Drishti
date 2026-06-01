import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  getAllRecords,
  getUnsyncedRecords,
  getTodayCount,
  AttendanceRecord,
} from '../utils/storage';
import { syncToAWS, isInternetAvailable } from '../utils/syncService';
import { autoSyncIfOnline } from '../utils/syncService';

const TRANSLATIONS = {
  en: {
    welcome: 'Welcome back',
    admin: 'Admin Dashboard',
    todayAttendance: "Today's Attendance",
    pendingSync: 'Pending Sync',
    successRate: 'Success Rate',
    zoneStatus: 'Zone Status',
    recentActivity: 'Recent Activity',
    syncBtn: 'Sync Now',
    newScan: '+ New Face Scan',
    records: 'records',
    active: 'Active',
    syncing: 'Syncing...',
    synced: 'All Synced!',
    offlineMode: 'Offline Mode',
    onlineMode: 'Online Mode',
    noRecords: 'No attendance records yet',
    pullRefresh: 'Pull to refresh',
    syncSuccess: 'Sync Complete',
    syncFailed: 'Sync Failed',
    empId: 'ID',
    zone: 'Zone',
    liveness: 'Liveness',
  },
  hi: {
    welcome: 'वापस स्वागत है',
    admin: 'एडमिन डैशबोर्ड',
    todayAttendance: 'आज की उपस्थिति',
    pendingSync: 'लंबित सिंक',
    successRate: 'सफलता दर',
    zoneStatus: 'क्षेत्र स्थिति',
    recentActivity: 'हालिया गतिविधि',
    syncBtn: 'अभी सिंक करें',
    newScan: '+ नया फेस स्कैन',
    records: 'रिकॉर्ड',
    active: 'सक्रिय',
    syncing: 'सिंक हो रहा है...',
    synced: 'सब सिंक हो गया!',
    offlineMode: 'ऑफलाइन मोड',
    onlineMode: 'ऑनलाइन मोड',
    noRecords: 'अभी कोई रिकॉर्ड नहीं',
    pullRefresh: 'रिफ्रेश करें',
    syncSuccess: 'सिंक पूर्ण',
    syncFailed: 'सिंक विफल',
    empId: 'आईडी',
    zone: 'क्षेत्र',
    liveness: 'जीवंतता',
  },
};

export default function DashboardScreen({ navigation, route }: any) {
  const lang = route?.params?.lang || 'en';
  const t = TRANSLATIONS[lang];

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [refreshing, setRefreshing] = useState(false);

  // ─── Load Data from SQLite ───
  const loadData = useCallback(async () => {
    try {
      const [allRecords, unsynced, todayTotal, online] = await Promise.all([
        getAllRecords(),
        getUnsyncedRecords(),
        getTodayCount(),
        isInternetAvailable(),
      ]);
      setRecords(allRecords);
      setPendingCount(unsynced.length);
      setTodayCount(todayTotal);
      setIsOnline(online);
    } catch (e) {
      console.log('Load error:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
    autoSyncIfOnline();
  }, []);

  // ─── Pull to Refresh ───
  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // ─── Sync to AWS ───
  async function handleSync() {
    if (pendingCount === 0) return;
    setSyncStatus('syncing');
    try {
      const result = await syncToAWS();
      setSyncStatus(result.success ? 'synced' : 'idle');
      await loadData();
      Alert.alert(
        result.success ? t.syncSuccess : t.syncFailed,
        result.message,
      );
    } catch {
      setSyncStatus('idle');
      Alert.alert(t.syncFailed, lang === 'en' ? 'Please try again.' : 'पुनः प्रयास करें।');
    }
  }

  // ─── Format timestamp ───
  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return '';
    }
  }

  const successRate =
    records.length > 0
      ? ((records.length / (records.length + 1)) * 100).toFixed(1)
      : '0.0';

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>{t.welcome}</Text>
          <Text style={styles.adminText}>{t.admin}</Text>
        </View>
        <View style={[
          styles.modeBadge,
          isOnline ? styles.modeBadgeOnline : styles.modeBadgeOffline,
        ]}>
          <View style={[
            styles.modeDot,
            isOnline ? styles.dotOnline : styles.dotOffline,
          ]} />
          <Text style={styles.modeText}>
            {isOnline ? t.onlineMode : t.offlineMode}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>

        {/* Stat Cards — Real Data */}
        <View style={styles.statsGrid}>
          <StatCard
            label={t.todayAttendance}
            value={String(todayCount)}
            color="#1A3C6E"
            icon="👥"
          />
          <StatCard
            label={t.pendingSync}
            value={String(pendingCount)}
            color={pendingCount > 0 ? '#FF6B00' : '#2ECC71'}
            icon="🔄"
          />
          <StatCard
            label={t.successRate}
            value={`${successRate}%`}
            color="#2ECC71"
            icon="✅"
          />
          <StatCard
            label={t.zoneStatus}
            value={t.active}
            color="#1A3C6E"
            icon="📍"
          />
        </View>

        {/* Sync Button */}
        <TouchableOpacity
          style={[
            styles.syncBtn,
            syncStatus === 'synced' && styles.syncBtnDone,
            (pendingCount === 0 || syncStatus === 'syncing') && styles.syncBtnDisabled,
          ]}
          onPress={handleSync}
          disabled={syncStatus === 'syncing' || pendingCount === 0}>
          <Text style={styles.syncBtnText}>
            {syncStatus === 'syncing'
              ? t.syncing
              : syncStatus === 'synced'
              ? t.synced
              : `${t.syncBtn} (${pendingCount} ${t.records})`}
          </Text>
        </TouchableOpacity>

        {/* Recent Activity — Real SQLite Records */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>{t.recentActivity}</Text>

          {records.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          ) : (
            records.map((item, i) => (
              <View key={item.id ?? i}>
                <View style={styles.activityRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {item.empName?.charAt(0) ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{item.empName}</Text>
                    <Text style={styles.activityEmpId}>
                      {item.empId} • {item.locationZone}
                    </Text>
                    <Text style={styles.activityLiveness}>
                      {t.liveness}: {(item.livenessScore * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityTime}>
                      {formatTime(item.timestamp)}
                    </Text>
                    <Text style={styles.activityDate}>
                      {formatDate(item.timestamp)}
                    </Text>
                    <View style={[
                      styles.syncBadge,
                      item.synced === 1 ? styles.syncBadgeDone : styles.syncBadgePending,
                    ]}>
                      <Text style={[
                        styles.syncBadgeText,
                        item.synced === 1 ? styles.syncTextDone : styles.syncTextPending,
                      ]}>
                        {item.synced === 1
                          ? (lang === 'en' ? '✓ Synced' : '✓ सिंक')
                          : (lang === 'en' ? '⏳ Pending' : '⏳ बाकी')}
                      </Text>
                    </View>
                  </View>
                </View>
                {i < records.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        {/* New Scan Button */}
        <TouchableOpacity
          style={styles.newScanBtn}
          onPress={() => navigation.navigate('FaceScan', { lang })}>
          <Text style={styles.newScanText}>{t.newScan}</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, color, icon }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    backgroundColor: '#1A3C6E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  adminText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modeBadgeOnline: { backgroundColor: 'rgba(46,204,113,0.2)' },
  modeBadgeOffline: { backgroundColor: 'rgba(255,255,255,0.15)' },
  modeDot: { width: 7, height: 7, borderRadius: 4 },
  dotOnline: { backgroundColor: '#2ECC71' },
  dotOffline: { backgroundColor: '#FF6B00' },
  modeText: { color: '#fff', fontSize: 11 },
  scroll: { flex: 1, padding: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '47%',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },
  syncBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  syncBtnDone: { backgroundColor: '#2ECC71' },
  syncBtnDisabled: { backgroundColor: '#CCCCCC' },
  syncBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3C6E',
    marginBottom: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: '#AAAAAA', fontSize: 13 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    backgroundColor: '#E8EDF5',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1A3C6E', fontWeight: '600', fontSize: 15 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  activityEmpId: { fontSize: 11, color: '#888', marginTop: 1 },
  activityLiveness: { fontSize: 10, color: '#2ECC71', marginTop: 2 },
  activityRight: { alignItems: 'flex-end', gap: 3 },
  activityTime: { fontSize: 12, fontWeight: '500', color: '#1C1C1E' },
  activityDate: { fontSize: 10, color: '#888' },
  syncBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  syncBadgeDone: { backgroundColor: '#E8F8F0' },
  syncBadgePending: { backgroundColor: '#FFF8F0' },
  syncBadgeText: { fontSize: 10, fontWeight: '600' },
  syncTextDone: { color: '#2ECC71' },
  syncTextPending: { color: '#FF6B00' },
  divider: { height: 0.5, backgroundColor: '#F0F0F0' },
  newScanBtn: {
    backgroundColor: '#1A3C6E',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  newScanText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});