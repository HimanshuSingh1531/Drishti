import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { validateGeoFence, GeoResult } from '../utils/geoFence';
import { saveAttendance, initDB } from '../utils/storage';
import { checkTimeWindow, TimeCheckResult, formatShiftTime, formatMinutesLeft } from '../utils/timeWindow';
import { checkLockStatus, recordFailedAttempt, resetAttempts, LockStatus } from '../utils/appLock';
import FaceFrame from '../components/FaceFrame';

const TRANSLATIONS = {
  en: {
    title: 'Face Authentication',
    locationChecking: 'Checking location...',
    locationAllowed: 'Zone OK',
    locationDenied: 'Out of Zone — Attendance Blocked',
    retryLocation: 'Retry Location',
    accuracy: 'GPS Accuracy',
    distance: 'Distance from Zone',
    livenessTitle: 'Liveness Check',
    savingRecord: 'Saving attendance...',
    stepLabel: 'Step',
    of: 'of',
    currentShift: 'Current Shift',
    nextShift: 'Next Shift in',
    shiftBlocked: 'Outside Shift Hours',
    shiftBlockedMsg: 'Attendance can only be marked during shift hours.',
    lockedTitle: 'Account Locked!',
    lockedMsg: 'Too many failed attempts.',
    minutesLeft: 'minutes remaining',
    attemptsLeft: 'attempts remaining',
    failedAttempt: 'Liveness check failed!',
  },
  hi: {
    title: 'चेहरा प्रमाणीकरण',
    locationChecking: 'स्थान जांच रहे हैं...',
    locationAllowed: 'क्षेत्र ठीक',
    locationDenied: 'क्षेत्र से बाहर — उपस्थिति अवरुद्ध',
    retryLocation: 'पुनः जांचें',
    accuracy: 'GPS सटीकता',
    distance: 'क्षेत्र से दूरी',
    livenessTitle: 'जीवंतता जांच',
    savingRecord: 'उपस्थिति सहेज रहे हैं...',
    stepLabel: 'चरण',
    of: 'में से',
    currentShift: 'वर्तमान शिफ्ट',
    nextShift: 'अगली शिफ्ट',
    shiftBlocked: 'शिफ्ट समय के बाहर',
    shiftBlockedMsg: 'उपस्थिति केवल शिफ्ट समय में दर्ज की जा सकती है।',
    lockedTitle: 'खाता लॉक!',
    lockedMsg: 'बहुत अधिक विफल प्रयास।',
    minutesLeft: 'मिनट शेष',
    attemptsLeft: 'प्रयास शेष',
    failedAttempt: 'जीवंतता जांच विफल!',
  },
};

const LIVENESS_STEPS = {
  en: ['Blink your eyes', 'Smile please', 'Turn head slightly'],
  hi: ['आंखें झपकाएं', 'मुस्कुराएं', 'सिर थोड़ा घुमाएं'],
};

export default function FaceScanScreen({ navigation, route }: any) {
  if (!navigation) return null;

  const lang = route?.params?.lang || 'en';
  const empId = route?.params?.empId || 'DL-2024-0042';
  const empName = route?.params?.empName || 'Field Employee';
  const department = route?.params?.department || 'Field Operations';

  const t = TRANSLATIONS[lang];
  const steps = LIVENESS_STEPS[lang];

  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [timeCheck, setTimeCheck] = useState<TimeCheckResult | null>(null);
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepsDone, setStepsDone] = useState([false, false, false]);
  const [livenessScores, setLivenessScores] = useState<number[]>([]);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [failedSteps, setFailedSteps] = useState(0);

  useEffect(() => {
    initDB();
    checkLocation();
    setTimeCheck(checkTimeWindow());
    checkLock();
    const interval = setInterval(() => {
      setTimeCheck(checkTimeWindow());
      checkLock();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkLock() {
    const lock = await checkLockStatus();
    setLockStatus(lock);
  }

  async function checkLocation() {
    setLocationStatus('checking');
    try {
      const result = await validateGeoFence();
      setGeoResult(result);
      setLocationStatus(result.allowed ? 'allowed' : 'denied');
    } catch {
      setLocationStatus('denied');
    }
  }

  const canScan =
    locationStatus === 'allowed' &&
    timeCheck?.allowed === true &&
    !saving &&
    lockStatus?.isLocked !== true;

  // ─── Handle liveness step complete ───
  async function handleLivenessComplete(score: number, photoPath: string) {
    const newScores = [...livenessScores, score];
    const newPhotos = [...photoPaths, photoPath];
    const newStepsDone = [...stepsDone];
    newStepsDone[currentStep] = true;

    setLivenessScores(newScores);
    setPhotoPaths(newPhotos);
    setStepsDone(newStepsDone);
    setFailedSteps(0); // Reset failed count on success

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps done — reset attempts and save
      await resetAttempts();
      await saveRecord(newScores, newPhotos);
    }
  }

  // ─── Handle liveness failure ───
  async function handleLivenessError(error: string) {
    const newFailed = failedSteps + 1;
    setFailedSteps(newFailed);

    // Record failed attempt
    const newLockStatus = await recordFailedAttempt();
    setLockStatus(newLockStatus);

    if (newLockStatus.isLocked) {
      Alert.alert(
        t.lockedTitle,
        `${t.lockedMsg}\n${newLockStatus.minutesLeft} ${t.minutesLeft}`,
      );
    } else {
      Alert.alert(
        t.failedAttempt,
        `${newLockStatus.attemptsLeft} ${t.attemptsLeft}`,
      );
    }
  }

  async function saveRecord(scores: number[], photos: string[]) {
    if (!geoResult) return;
    setSaving(true);
    try {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      await saveAttendance({
        empId,
        empName,
        timestamp: new Date().toISOString(),
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
        locationZone: geoResult.zoneName,
        livenessScore: parseFloat(avgScore.toFixed(4)),
        photoPath: photos[0] || '',
        synced: 0,
        shiftId: timeCheck?.currentShift?.id || 'DEFAULT',
      });
      navigation.navigate('Success', {
        lang,
        empId,
        empName,
        department,
        locationZone: geoResult.zoneName,
        distanceMeters: geoResult.distanceMeters,
      });
    } catch {
      Alert.alert(
        lang === 'en' ? 'Save Failed' : 'सहेजना विफल',
        lang === 'en' ? 'Could not save. Please try again.' : 'पुनः प्रयास करें।',
      );
    } finally {
      setSaving(false);
    }
  }

  const progress = (stepsDone.filter(Boolean).length / 3) * 100;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Employee Info */}
        <View style={styles.empCard}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarText}>{empName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{empName}</Text>
            <Text style={styles.empId}>{empId} • {department}</Text>
          </View>
        </View>

        {/* 🔒 App Lock UI */}
        {lockStatus?.isLocked && (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>{t.lockedTitle}</Text>
            <Text style={styles.lockedMsg}>{t.lockedMsg}</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>
                ⏱️ {lockStatus.minutesLeft} {t.minutesLeft}
              </Text>
            </View>
          </View>
        )}

        {/* Attempts Warning */}
        {!lockStatus?.isLocked && lockStatus && lockStatus.attemptsLeft < 3 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ {lockStatus.attemptsLeft} {t.attemptsLeft}
            </Text>
          </View>
        )}

        {/* Time Window Badge */}
        {timeCheck && !lockStatus?.isLocked && (
          <View style={[
            styles.timeBadge,
            timeCheck.allowed ? styles.badgeGreen : styles.badgeRed,
          ]}>
            <Text style={styles.timeIcon}>🕐</Text>
            <View style={{ flex: 1 }}>
              {timeCheck.allowed && timeCheck.currentShift ? (
                <>
                  <Text style={[styles.timeBadgeTitle, { color: '#1a7a4a' }]}>
                    {t.currentShift}: {lang === 'en'
                      ? timeCheck.currentShift.name
                      : timeCheck.currentShift.nameHi}
                  </Text>
                  <Text style={styles.timeBadgeSub}>
                    {formatShiftTime(timeCheck.currentShift.startHour, timeCheck.currentShift.startMinute)}
                    {' — '}
                    {formatShiftTime(timeCheck.currentShift.endHour, timeCheck.currentShift.endMinute)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.timeBadgeTitle, { color: '#a32d2d' }]}>
                    {t.shiftBlocked}
                  </Text>
                  {timeCheck.nextShift && timeCheck.minutesUntilNext && (
                    <Text style={styles.timeBadgeSub}>
                      {t.nextShift}: {formatMinutesLeft(timeCheck.minutesUntilNext)}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Location Badge */}
        {!lockStatus?.isLocked && (
          <View style={[
            styles.locationBadge,
            locationStatus === 'allowed' ? styles.badgeGreen :
            locationStatus === 'denied' ? styles.badgeRed :
            styles.badgeGray,
          ]}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[
              styles.locationText,
              locationStatus === 'allowed' ? styles.textGreen :
              locationStatus === 'denied' ? styles.textRed :
              styles.textGray,
            ]}>
              {locationStatus === 'checking'
                ? t.locationChecking
                : locationStatus === 'allowed'
                ? `${t.locationAllowed} • ${geoResult?.distanceMeters}m • ${geoResult?.zoneName}`
                : t.locationDenied}
            </Text>
            {locationStatus === 'denied' && (
              <TouchableOpacity onPress={checkLocation}>
                <Text style={styles.retryText}>{t.retryLocation}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* GPS Info */}
        {geoResult && !lockStatus?.isLocked && (
          <View style={styles.gpsRow}>
            <View style={styles.gpsChip}>
              <Text style={styles.gpsLabel}>{t.accuracy}</Text>
              <Text style={styles.gpsValue}>{geoResult.accuracy}m</Text>
            </View>
            <View style={styles.gpsChip}>
              <Text style={styles.gpsLabel}>{t.distance}</Text>
              <Text style={styles.gpsValue}>{geoResult.distanceMeters}m</Text>
            </View>
          </View>
        )}

        {/* Camera Face Frame */}
        {canScan && (
          <FaceFrame
            onLivenessComplete={handleLivenessComplete}
            onError={handleLivenessError}
            currentStep={currentStep}
            lang={lang}
          />
        )}

        {/* Saving */}
        {saving && (
          <View style={styles.savingBox}>
            <Text style={styles.savingText}>{t.savingRecord}</Text>
          </View>
        )}

        {/* Liveness Steps */}
        {!lockStatus?.isLocked && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>{t.livenessTitle}</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[
                  styles.stepCircle,
                  stepsDone[i] ? styles.stepDone :
                  i === currentStep && canScan ? styles.stepActive :
                  styles.stepPending,
                ]}>
                  <Text style={styles.stepCircleText}>
                    {stepsDone[i] ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.stepText,
                  stepsDone[i] ? styles.stepTextDone :
                  i === currentStep ? styles.stepTextActive :
                  styles.stepTextPending,
                ]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Progress Bar */}
        {!lockStatus?.isLocked && (
          <>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {t.stepLabel} {Math.min(currentStep + 1, 3)} {t.of} 3
            </Text>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    backgroundColor: '#1A3C6E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scroll: { padding: 16, gap: 12 },
  empCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  empAvatar: {
    width: 44,
    height: 44,
    backgroundColor: '#E8EDF5',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1A3C6E',
  },
  empAvatarText: { color: '#1A3C6E', fontWeight: '700', fontSize: 18 },
  empName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  empId: { fontSize: 11, color: '#888', marginTop: 2 },
  lockedBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E24B4A',
  },
  lockedIcon: { fontSize: 48 },
  lockedTitle: { fontSize: 18, fontWeight: '700', color: '#E24B4A' },
  lockedMsg: { fontSize: 13, color: '#888', textAlign: 'center' },
  timerBox: {
    backgroundColor: '#E24B4A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  timerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  warningBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  warningText: { color: '#FF6B00', fontSize: 13, fontWeight: '500' },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  timeIcon: { fontSize: 20 },
  timeBadgeTitle: { fontSize: 13, fontWeight: '600' },
  timeBadgeSub: { fontSize: 11, color: '#666', marginTop: 2 },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  badgeGreen: { backgroundColor: '#E8F8F0' },
  badgeRed: { backgroundColor: '#FFF0F0' },
  badgeGray: { backgroundColor: '#F0F0F0' },
  locationIcon: { fontSize: 14 },
  locationText: { fontSize: 12, fontWeight: '500', flex: 1 },
  textGreen: { color: '#2ECC71' },
  textRed: { color: '#E24B4A' },
  textGray: { color: '#888' },
  retryText: {
    color: '#1A3C6E',
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  gpsRow: { flexDirection: 'row', gap: 10 },
  gpsChip: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  gpsLabel: { fontSize: 10, color: '#888' },
  gpsValue: { fontSize: 14, fontWeight: '600', color: '#1A3C6E' },
  savingBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  savingText: { color: '#FF6B00', fontSize: 14, fontWeight: '500' },
  stepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  stepsTitle: { fontSize: 14, fontWeight: '600', color: '#1A3C6E', marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: { backgroundColor: '#2ECC71' },
  stepActive: { backgroundColor: '#1A3C6E' },
  stepPending: { backgroundColor: '#E0E0E0' },
  stepCircleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { fontSize: 14, flex: 1 },
  stepTextDone: { color: '#2ECC71', fontWeight: '500' },
  stepTextActive: { color: '#1A3C6E', fontWeight: '600' },
  stepTextPending: { color: '#AAAAAA' },
  progressBarBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#FF6B00', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#888', textAlign: 'center' },
});