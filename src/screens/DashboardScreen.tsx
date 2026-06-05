import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import {
  getAllRecords,
  getUnsyncedRecords,
  getTodayCount,
  AttendanceRecord,
} from '../utils/storage';
import { syncToAWS, isInternetAvailable, autoSyncIfOnline } from '../utils/syncService';
import { checkTimeWindow, TimeCheckResult, formatShiftTime } from '../utils/timeWindow';
import {
  Users,
  CloudUpload,
  TrendingUp,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  ScanFace,
  RefreshCw,
  ClipboardList,
  ChevronRight,
  Activity,
  Shield,
  BadgeCheck,
  Timer,
  ArrowUpRight,
} from 'lucide-react-native';

const NAVY        = '#1A3C6E';
const NAVY_DARK   = '#112A50';
const ORANGE      = '#FF6B00';
const BG          = '#F5F6FA';
const WHITE       = '#FFFFFF';
const BORDER      = '#DDE3EE';
const MUTED       = '#6B7280';
const LIGHT_NAVY  = '#EAF0FA';
const LIGHT_ORANGE= '#FFF3EA';
const GREEN       = '#22C55E';
const RED         = '#EF4444';
const LIGHT_GREEN = '#EDFBF3';
const LIGHT_RED   = '#FEF2F2';

const TRANSLATIONS = {
  en: {
    welcome: 'Welcome back',
    admin: 'Admin Dashboard',
    todayAttendance: "Today's",
    pendingSync: 'Pending',
    successRate: 'Success',
    zoneStatus: 'Zone',
    recentActivity: 'Recent Activity',
    syncBtn: 'Sync Now',
    newScan: 'New Face Scan',
    records: 'records',
    active: 'Active',
    syncing: 'Syncing…',
    synced: 'All Synced!',
    offlineMode: 'Offline',
    onlineMode: 'Online',
    noRecords: 'No attendance records yet',
    syncSuccess: 'Sync Complete',
    syncFailed: 'Sync Failed',
    liveness: 'Liveness',
    shiftActive: 'Shift Active',
    outsideShift: 'Outside Shift',
    nextShift: 'Next',
    noMoreShifts: 'No more shifts today',
    viewAll: 'View All',
    attendance: 'Attendance',
    sync: 'Sync',
    rate: 'Rate',
  },
  hi: {
    welcome: 'वापस स्वागत है',
    admin: 'एडमिन डैशबोर्ड',
    todayAttendance: 'आज',
    pendingSync: 'बाकी',
    successRate: 'सफलता',
    zoneStatus: 'क्षेत्र',
    recentActivity: 'हालिया गतिविधि',
    syncBtn: 'अभी सिंक करें',
    newScan: 'नया फेस स्कैन',
    records: 'रिकॉर्ड',
    active: 'सक्रिय',
    syncing: 'सिंक हो रहा है…',
    synced: 'सब सिंक हो गया!',
    offlineMode: 'ऑफलाइन',
    onlineMode: 'ऑनलाइन',
    noRecords: 'अभी कोई रिकॉर्ड नहीं',
    syncSuccess: 'सिंक पूर्ण',
    syncFailed: 'सिंक विफल',
    liveness: 'जीवंतता',
    shiftActive: 'शिफ्ट सक्रिय',
    outsideShift: 'शिफ्ट के बाहर',
    nextShift: 'अगली',
    noMoreShifts: 'आज कोई शिफ्ट नहीं',
    viewAll: 'सब देखें',
    attendance: 'उपस्थिति',
    sync: 'सिंक',
    rate: 'दर',
  },
};

export default function DashboardScreen({ navigation, route }: any) {
  const lang = route?.params?.lang || 'en';
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS['en'];

  const [records,      setRecords]      = useState<AttendanceRecord[]>([]);
  const [todayCount,   setTodayCount]   = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline,     setIsOnline]     = useState(false);
  const [syncStatus,   setSyncStatus]   = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [refreshing,   setRefreshing]   = useState(false);
  const [timeCheck,    setTimeCheck]    = useState<TimeCheckResult | null>(null);
  const [showAll,      setShowAll]      = useState(false);

  // Animated values for stat cards
  const countAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const syncRotate= useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (syncStatus === 'syncing') {
      Animated.loop(
        Animated.timing(syncRotate, { toValue: 1, duration: 900, useNativeDriver: true })
      ).start();
    } else {
      syncRotate.setValue(0);
    }
  }, [syncStatus]);

  const syncSpin = syncRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
    setTimeCheck(checkTimeWindow());
    const interval = setInterval(() => setTimeCheck(checkTimeWindow()), 30000);
    return () => clearInterval(interval);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setTimeCheck(checkTimeWindow());
    setRefreshing(false);
  }

  async function handleSync() {
    if (pendingCount === 0) return;
    setSyncStatus('syncing');
    try {
      const result = await syncToAWS();
      setSyncStatus(result.success ? 'synced' : 'idle');
      await loadData();
      Alert.alert(result.success ? t.syncSuccess : t.syncFailed, result.message);
    } catch {
      setSyncStatus('idle');
      Alert.alert(t.syncFailed, lang === 'en' ? 'Please try again.' : 'पुनः प्रयास करें।');
    }
  }

  function formatTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }
  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }
    catch { return ''; }
  }

  const successRate = records.length > 0
    ? ((records.length / (records.length + 1)) * 100).toFixed(1)
    : '0.0';

  const displayRecords = showAll ? records : records.slice(0, 5);

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>{t.welcome}</Text>
          <Text style={styles.adminText}>{t.admin}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.modeBadge, isOnline ? styles.modeBadgeOnline : styles.modeBadgeOffline]}>
            {isOnline
              ? <Wifi    size={12} color={GREEN}  strokeWidth={2.5} />
              : <WifiOff size={12} color={ORANGE} strokeWidth={2.5} />
            }
            <Text style={[styles.modeText, { color: isOnline ? GREEN : ORANGE }]}>
              {isOnline ? t.onlineMode : t.offlineMode}
            </Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
      >

        {/* ── Live Clock Card ── */}
        <View style={styles.clockCard}>
          <View style={styles.clockLeft}>
            <View style={styles.clockIconWrap}>
              <Clock size={20} color={WHITE} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.clockTime}>{timeStr}</Text>
              <Text style={styles.clockDate}>{dateStr}</Text>
            </View>
          </View>
          {timeCheck && (
            <View style={[styles.shiftTag, timeCheck.allowed ? styles.shiftTagGreen : styles.shiftTagRed]}>
              <View style={[styles.shiftDot, { backgroundColor: timeCheck.allowed ? GREEN : RED }]} />
              <Text style={[styles.shiftTagText, { color: timeCheck.allowed ? '#166534' : '#991B1B' }]}>
                {timeCheck.allowed ? t.shiftActive : t.outsideShift}
              </Text>
            </View>
          )}
        </View>

        {/* ── Shift Info ── */}
        {timeCheck && (
          <View style={[styles.shiftCard, timeCheck.allowed ? styles.shiftCardGreen : styles.shiftCardRed]}>
            <View style={[styles.shiftIconWrap, timeCheck.allowed ? styles.iconWrapGreen : styles.iconWrapRed]}>
              <Timer size={18} color={timeCheck.allowed ? GREEN : RED} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.shiftTitle, { color: timeCheck.allowed ? '#166534' : '#991B1B' }]}>
                {timeCheck.allowed && timeCheck.currentShift
                  ? `${lang === 'en' ? timeCheck.currentShift.name : timeCheck.currentShift.nameHi}`
                  : timeCheck.nextShift
                  ? `${t.nextShift}: ${lang === 'en' ? timeCheck.nextShift.name : timeCheck.nextShift.nameHi}`
                  : t.noMoreShifts}
              </Text>
              {timeCheck.allowed && timeCheck.currentShift && (
                <Text style={styles.shiftSub}>
                  {formatShiftTime(timeCheck.currentShift.startHour, timeCheck.currentShift.startMinute)}
                  {' — '}
                  {formatShiftTime(timeCheck.currentShift.endHour, timeCheck.currentShift.endMinute)}
                </Text>
              )}
            </View>
            {timeCheck.allowed
              ? <CheckCircle2 size={18} color={GREEN} strokeWidth={2} />
              : <XCircle      size={18} color={RED}   strokeWidth={2} />
            }
          </View>
        )}

        {/* ── Stat Cards ── */}
        <View style={styles.statsGrid}>
          <StatCard icon={<Users       size={20} color={NAVY}   strokeWidth={2} />} label={t.attendance} value={String(todayCount)} accent={NAVY}   bg={LIGHT_NAVY}   />
          <StatCard icon={<CloudUpload size={20} color={pendingCount > 0 ? ORANGE : GREEN} strokeWidth={2} />} label={t.sync} value={String(pendingCount)} accent={pendingCount > 0 ? ORANGE : GREEN} bg={pendingCount > 0 ? LIGHT_ORANGE : LIGHT_GREEN} />
          <StatCard icon={<TrendingUp  size={20} color={GREEN}  strokeWidth={2} />} label={t.rate}       value={`${successRate}%`} accent={GREEN}  bg={LIGHT_GREEN}  />
          <StatCard icon={<Shield      size={20} color={NAVY}   strokeWidth={2} />} label={t.zoneStatus} value={t.active}          accent={NAVY}   bg={LIGHT_NAVY}   />
        </View>

        {/* ── Sync Button ── */}
        <TouchableOpacity
          style={[
            styles.syncBtn,
            syncStatus === 'synced'  && styles.syncBtnDone,
            (pendingCount === 0 || syncStatus === 'syncing') && styles.syncBtnDisabled,
          ]}
          onPress={handleSync}
          disabled={syncStatus === 'syncing' || pendingCount === 0}
          activeOpacity={0.85}
        >
          <View style={styles.syncBtnInner}>
            <View style={styles.syncBtnIconWrap}>
              {syncStatus === 'syncing' ? (
                <Animated.View style={{ transform: [{ rotate: syncSpin }] }}>
                  <RefreshCw size={18} color={WHITE} strokeWidth={2.5} />
                </Animated.View>
              ) : syncStatus === 'synced' ? (
                <CheckCircle2 size={18} color={WHITE} strokeWidth={2.5} />
              ) : (
                <CloudUpload size={18} color={WHITE} strokeWidth={2.5} />
              )}
            </View>
            <Text style={styles.syncBtnText}>
              {syncStatus === 'syncing'
                ? t.syncing
                : syncStatus === 'synced'
                ? t.synced
                : `${t.syncBtn} (${pendingCount} ${t.records})`}
            </Text>
          </View>
          {syncStatus === 'idle' && pendingCount > 0 && (
            <View style={styles.syncCountBadge}>
              <Text style={styles.syncCountText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Recent Activity ── */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.activityHeaderLeft}>
              <ClipboardList size={16} color={NAVY} strokeWidth={2} style={{ marginRight: 8 }} />
              <Text style={styles.activityTitle}>{t.recentActivity}</Text>
            </View>
            {records.length > 5 && (
              <TouchableOpacity onPress={() => setShowAll(v => !v)} style={styles.viewAllBtn} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>{showAll ? 'Less' : t.viewAll}</Text>
                <ChevronRight size={13} color={NAVY} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {records.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Activity size={32} color="#C0CAD8" strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          ) : (
            displayRecords.map((item, i) => (
              <View key={item.id ?? i}>
                <View style={styles.activityRow}>
                  {/* Avatar */}
                  <View style={styles.activityAvatarWrap}>
                    <View style={styles.activityAvatar}>
                      <Text style={styles.activityAvatarText}>{item.empName?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{item.empName}</Text>
                    <View style={styles.activityMetaRow}>
                      <BadgeCheck size={11} color={MUTED} strokeWidth={2} />
                      <Text style={styles.activityMeta}>{item.empId}</Text>
                    </View>
                    <View style={styles.activityMetaRow}>
                      <MapPin size={11} color={MUTED} strokeWidth={2} />
                      <Text style={styles.activityMeta}>{item.locationZone}</Text>
                    </View>
                    {/* Liveness bar */}
                    <View style={styles.livenessRow}>
                      <View style={styles.livenessBg}>
                        <View style={[styles.livenessFill, { width: `${Math.min(item.livenessScore * 100, 100)}%` as any }]} />
                      </View>
                      <Text style={styles.livenessScore}>{(item.livenessScore * 100).toFixed(0)}%</Text>
                    </View>
                  </View>

                  {/* Right */}
                  <View style={styles.activityRight}>
                    <Text style={styles.activityTime}>{formatTime(item.timestamp)}</Text>
                    <Text style={styles.activityDate}>{formatDate(item.timestamp)}</Text>
                    <View style={[styles.syncPill, item.synced === 1 ? styles.syncPillDone : styles.syncPillPending]}>
                      {item.synced === 1
                        ? <CheckCircle2 size={10} color={GREEN}  strokeWidth={2.5} />
                        : <Timer        size={10} color={ORANGE} strokeWidth={2.5} />
                      }
                      <Text style={[styles.syncPillText, item.synced === 1 ? styles.syncTextDone : styles.syncTextPending]}>
                        {item.synced === 1 ? 'Synced' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
                {i < displayRecords.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))
          )}
        </View>

        {/* ── New Scan Button ── */}
        <TouchableOpacity
          style={styles.newScanBtn}
          onPress={() => navigation.navigate('FaceScan', { lang })}
          activeOpacity={0.85}
        >
          <View style={styles.newScanLeft}>
            <View style={styles.newScanIconWrap}>
              <ScanFace size={22} color={ORANGE} strokeWidth={2} />
            </View>
            <Text style={styles.newScanText}>{t.newScan}</Text>
          </View>
          <View style={styles.newScanArrow}>
            <ArrowUpRight size={16} color={WHITE} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, accent, bg }: { icon: React.ReactNode; label: string; value: string; accent: string; bg: string }) {
  return (
    <View style={[styles.statCard, { borderColor: accent + '30' }]}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>{icon}</View>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 4,
    shadowColor: NAVY, shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
  },
  headerLeft:  {},
  headerRight: {},
  welcomeText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '500' },
  adminText:   { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
  },
  modeBadgeOnline:  { backgroundColor: 'rgba(34,197,94,0.15)',  borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)'  },
  modeBadgeOffline: { backgroundColor: 'rgba(255,107,0,0.15)',  borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)'  },
  modeText: { fontSize: 11, fontWeight: '700' },

  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

  // Clock card
  clockCard: {
    backgroundColor: NAVY,
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
    elevation: 3,
    shadowColor: NAVY, shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
  },
  clockLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clockIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  clockTime: { color: WHITE, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  clockDate: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', marginTop: 2 },
  shiftTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  shiftTagGreen: { backgroundColor: LIGHT_GREEN, borderWidth: 1, borderColor: '#B6EDD0' },
  shiftTagRed:   { backgroundColor: LIGHT_RED,   borderWidth: 1, borderColor: '#FECACA' },
  shiftDot: { width: 6, height: 6, borderRadius: 3 },
  shiftTagText: { fontSize: 10, fontWeight: '700' },

  // Shift card
  shiftCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 13, marginBottom: 14,
    borderWidth: 1,
  },
  shiftCardGreen: { backgroundColor: LIGHT_GREEN, borderColor: '#B6EDD0' },
  shiftCardRed:   { backgroundColor: LIGHT_RED,   borderColor: '#FECACA' },
  shiftIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapGreen: { backgroundColor: WHITE, borderWidth: 1, borderColor: '#B6EDD0' },
  iconWrapRed:   { backgroundColor: WHITE, borderWidth: 1, borderColor: '#FECACA' },
  shiftTitle: { fontSize: 13, fontWeight: '700' },
  shiftSub:   { fontSize: 11, color: MUTED, marginTop: 2 },

  // Stat grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14,
  },
  statCard: {
    backgroundColor: WHITE,
    borderRadius: 16, padding: 14,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    gap: 6,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: MUTED, fontWeight: '600', textAlign: 'center' },

  // Sync button
  syncBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
    elevation: 4,
    shadowColor: ORANGE, shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
  },
  syncBtnDone:     { backgroundColor: GREEN, shadowColor: GREEN },
  syncBtnDisabled: { backgroundColor: '#C0CAD8', elevation: 0, shadowOpacity: 0 },
  syncBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncBtnIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  syncBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },
  syncCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  syncCountText: { color: WHITE, fontSize: 12, fontWeight: '800' },

  // Activity card
  activityCard: {
    backgroundColor: WHITE,
    borderRadius: 18, padding: 16,
    marginBottom: 14,
    borderWidth: 1, borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  activityHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  activityHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  activityTitle: { fontSize: 14, fontWeight: '700', color: NAVY },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, color: NAVY, fontWeight: '600' },

  emptyBox: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F0F3FA',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { color: MUTED, fontSize: 13, fontWeight: '500' },

  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, gap: 10,
  },
  activityAvatarWrap: {
    padding: 2, borderRadius: 22,
    borderWidth: 1.5, borderColor: '#C8D9F0',
  },
  activityAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LIGHT_NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  activityAvatarText: { color: NAVY, fontWeight: '800', fontSize: 15 },
  activityInfo: { flex: 1, gap: 3 },
  activityName: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  activityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityMeta: { fontSize: 11, color: MUTED },

  // Liveness bar
  livenessRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  livenessBg: {
    flex: 1, height: 4, backgroundColor: '#E8ECF4',
    borderRadius: 2, overflow: 'hidden',
  },
  livenessFill: { height: 4, backgroundColor: GREEN, borderRadius: 2 },
  livenessScore: { fontSize: 10, color: GREEN, fontWeight: '700', minWidth: 28 },

  activityRight: { alignItems: 'flex-end', gap: 4 },
  activityTime: { fontSize: 12, fontWeight: '700', color: NAVY },
  activityDate: { fontSize: 10, color: MUTED },
  syncPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  syncPillDone:    { backgroundColor: LIGHT_GREEN },
  syncPillPending: { backgroundColor: LIGHT_ORANGE },
  syncPillText:    { fontSize: 9, fontWeight: '700' },
  syncTextDone:    { color: GREEN  },
  syncTextPending: { color: ORANGE },

  rowDivider: { height: 1, backgroundColor: '#F0F3FA' },

  // New scan button
  newScanBtn: {
    backgroundColor: NAVY,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 4,
    shadowColor: NAVY, shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  newScanLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  newScanIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,107,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  newScanText: { color: WHITE, fontSize: 15, fontWeight: '700' },
  newScanArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
});