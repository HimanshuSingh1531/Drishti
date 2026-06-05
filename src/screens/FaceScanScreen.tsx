import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { validateGeoFence, GeoResult } from '../utils/geoFence';
import { saveAttendance, initDB } from '../utils/storage';
import { checkTimeWindow, TimeCheckResult, formatShiftTime, formatMinutesLeft } from '../utils/timeWindow';
import { checkLockStatus, recordFailedAttempt, resetAttempts, LockStatus } from '../utils/appLock';
import { generateFaceEmbedding, areFacesMatching } from '../ml/faceDetector';
import FaceDetection from '@react-native-ml-kit/face-detection';
import FaceFrame from '../components/FaceFrame';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Timer,
  AlertTriangle,
  Loader2,
  ScanFace,
  User,
  Navigation,
  Gauge,
  RotateCcw,
} from 'lucide-react-native';

const NAVY        = '#1A3C6E';
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
    title: 'Face Authentication',
    locationChecking: 'Checking location…',
    locationAllowed: 'Zone OK',
    locationDenied: 'Out of Zone — Attendance Blocked',
    retryLocation: 'Retry',
    accuracy: 'GPS Accuracy',
    distance: 'Distance',
    livenessTitle: 'Liveness Check',
    savingRecord: 'Saving attendance…',
    stepLabel: 'Step',
    of: 'of',
    currentShift: 'Current Shift',
    nextShift: 'Next Shift in',
    shiftBlocked: 'Outside Shift Hours',
    shiftBlockedMsg: 'Attendance can only be marked during shift hours.',
    lockedTitle: 'Account Locked',
    lockedMsg: 'Too many failed attempts. Please wait.',
    minutesLeft: 'min remaining',
    attemptsLeft: 'attempts left',
    failedAttempt: 'Verification Failed',
    faceMatchFailed: 'Face Not Matched',
    faceMatchFailedMsg: 'Your face does not match the registered face. Attendance denied.',
    verifyingFace: 'Verifying face identity…',
    faceMatched: 'Face Matched',
    tryAgain: 'Try Again',
  },
  hi: {
    title: 'चेहरा प्रमाणीकरण',
    locationChecking: 'स्थान जांच रहे हैं…',
    locationAllowed: 'क्षेत्र ठीक',
    locationDenied: 'क्षेत्र से बाहर — उपस्थिति अवरुद्ध',
    retryLocation: 'पुनः जांचें',
    accuracy: 'GPS सटीकता',
    distance: 'दूरी',
    livenessTitle: 'जीवंतता जांच',
    savingRecord: 'उपस्थिति सहेज रहे हैं…',
    stepLabel: 'चरण',
    of: 'में से',
    currentShift: 'वर्तमान शिफ्ट',
    nextShift: 'अगली शिफ्ट',
    shiftBlocked: 'शिफ्ट समय के बाहर',
    shiftBlockedMsg: 'उपस्थिति केवल शिफ्ट समय में दर्ज की जा सकती है।',
    lockedTitle: 'खाता लॉक',
    lockedMsg: 'बहुत अधिक विफल प्रयास।',
    minutesLeft: 'मिनट शेष',
    attemptsLeft: 'प्रयास शेष',
    failedAttempt: 'सत्यापन विफल',
    faceMatchFailed: 'चेहरा मेल नहीं खाया',
    faceMatchFailedMsg: 'आपका चेहरा पंजीकृत चेहरे से मेल नहीं खाता।',
    verifyingFace: 'चेहरा पहचान सत्यापित हो रहा है…',
    faceMatched: 'चेहरा मिला',
    tryAgain: 'पुनः प्रयास करें',
  },
};

const LIVENESS_STEPS = {
  en: ['Blink your eyes', 'Smile please', 'Turn head slightly'],
  hi: ['आंखें झपकाएं', 'मुस्कुराएं', 'सिर थोड़ा घुमाएं'],
};

export default function FaceScanScreen({ navigation, route }: any) {
  if (!navigation) return null;

  const lang         = route?.params?.lang       || 'en';
  const empId        = route?.params?.empId      || 'DL-2024-0042';
  const empName      = route?.params?.empName    || 'Field Employee';
  const department   = route?.params?.department || 'Field Operations';
  const storedEmbedding = route?.params?.storedEmbedding || [];

  const t     = TRANSLATIONS[lang] ?? TRANSLATIONS['en'];
  const steps = LIVENESS_STEPS[lang] ?? LIVENESS_STEPS['en'];

  const [geoResult,       setGeoResult]       = useState<GeoResult | null>(null);
  const [locationStatus,  setLocationStatus]  = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [timeCheck,       setTimeCheck]       = useState<TimeCheckResult | null>(null);
  const [lockStatus,      setLockStatus]      = useState<LockStatus | null>(null);
  const [currentStep,     setCurrentStep]     = useState(0);
  const [stepsDone,       setStepsDone]       = useState([false, false, false]);
  const [livenessScores,  setLivenessScores]  = useState<number[]>([]);
  const [photoPaths,      setPhotoPaths]      = useState<string[]>([]);
  const [saving,          setSaving]          = useState(false);
  const [failedSteps,     setFailedSteps]     = useState(0);
  const [verifyingFace,   setVerifyingFace]   = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] = useState<'pending' | 'matched' | 'failed'>('pending');

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initDB();
    checkLocation();
    setTimeCheck(checkTimeWindow());
    checkLock();
    const interval = setInterval(() => {
      setTimeCheck(checkTimeWindow());
      checkLock();
    }, 30000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const progress = (stepsDone.filter(Boolean).length / 3) * 100;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
  });

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
    !saving && !verifyingFace &&
    lockStatus?.isLocked !== true &&
    faceMatchStatus !== 'failed';

  async function verifyFaceIdentity(lastPhotoPath: string): Promise<boolean> {
    setVerifyingFace(true);
    try {
      const faces = await FaceDetection.detect(`file://${lastPhotoPath}`, {
        performanceMode: 'accurate',
        landmarkMode: 'all',
        classificationMode: 'all',
      });
      if (!faces || faces.length === 0) return false;

      const currentEmbedding = await generateFaceEmbedding(lastPhotoPath);
      if (storedEmbedding && storedEmbedding.length > 0) {
        const matchResult = areFacesMatching(currentEmbedding.embedding, storedEmbedding);
        return matchResult.match;
      }
      return true;
    } catch {
      return false;
    } finally {
      setVerifyingFace(false);
    }
  }

  async function handleLivenessComplete(score: number, photoPath: string) {
    const newScores    = [...livenessScores, score];
    const newPhotos    = [...photoPaths, photoPath];
    const newStepsDone = [...stepsDone];
    newStepsDone[currentStep] = true;

    setLivenessScores(newScores);
    setPhotoPaths(newPhotos);
    setStepsDone(newStepsDone);
    setFailedSteps(0);

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      const isMatch = await verifyFaceIdentity(photoPath);
      if (!isMatch) {
        setFaceMatchStatus('failed');
        const newLockStatus = await recordFailedAttempt();
        setLockStatus(newLockStatus);
        Alert.alert(t.faceMatchFailed, t.faceMatchFailedMsg, [{ text: 'OK', style: 'destructive' }]);
        return;
      }
      setFaceMatchStatus('matched');
      await resetAttempts();
      await saveRecord(newScores, newPhotos);
    }
  }

  async function handleLivenessError(error: string) {
    setFailedSteps(f => f + 1);
    const newLockStatus = await recordFailedAttempt();
    setLockStatus(newLockStatus);
    if (newLockStatus.isLocked) {
      Alert.alert(t.lockedTitle, `${t.lockedMsg}\n${newLockStatus.minutesLeft} ${t.minutesLeft}`);
    } else {
      Alert.alert(t.failedAttempt, `${newLockStatus.attemptsLeft} ${t.attemptsLeft}`);
    }
  }

  async function saveRecord(scores: number[], photos: string[]) {
    if (!geoResult) return;
    setSaving(true);
    try {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      await saveAttendance({
        empId, empName,
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
        lang, empId, empName, department,
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

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={WHITE} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerBadge}>
          <ScanFace size={16} color={WHITE} strokeWidth={2} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Employee Card ── */}
        <View style={styles.empCard}>
          <View style={styles.empAvatarWrap}>
            <View style={styles.empAvatar}>
              <Text style={styles.empAvatarText}>{empName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{empName}</Text>
            <View style={styles.empMetaRow}>
              <User size={11} color={MUTED} strokeWidth={2} />
              <Text style={styles.empMeta}>{empId}</Text>
              <View style={styles.empDot} />
              <Text style={styles.empMeta}>{department}</Text>
            </View>
          </View>
          {faceMatchStatus === 'matched' && (
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={13} color={GREEN} strokeWidth={2.5} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* ── LOCKED STATE ── */}
        {lockStatus?.isLocked && (
          <View style={styles.alertCard}>
            <View style={[styles.alertIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Lock size={28} color={RED} strokeWidth={1.8} />
            </View>
            <Text style={styles.alertTitle}>{t.lockedTitle}</Text>
            <Text style={styles.alertMsg}>{t.lockedMsg}</Text>
            <View style={styles.timerPill}>
              <Timer size={14} color={WHITE} strokeWidth={2} />
              <Text style={styles.timerText}>{lockStatus.minutesLeft} {t.minutesLeft}</Text>
            </View>
          </View>
        )}

        {/* ── FACE MATCH FAILED STATE ── */}
        {faceMatchStatus === 'failed' && (
          <View style={styles.alertCard}>
            <View style={[styles.alertIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <ShieldX size={28} color={RED} strokeWidth={1.8} />
            </View>
            <Text style={styles.alertTitle}>{t.faceMatchFailed}</Text>
            <Text style={styles.alertMsg}>{t.faceMatchFailedMsg}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setFaceMatchStatus('pending');
                setCurrentStep(0);
                setStepsDone([false, false, false]);
                setLivenessScores([]);
                setPhotoPaths([]);
              }}
              activeOpacity={0.85}
            >
              <RotateCcw size={15} color={WHITE} strokeWidth={2.5} style={{ marginRight: 7 }} />
              <Text style={styles.retryBtnText}>{t.tryAgain}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── VERIFYING STATE ── */}
        {verifyingFace && (
          <View style={styles.verifyingCard}>
            <ActivityIndicator size="large" color={NAVY} />
            <Text style={styles.verifyingTitle}>{t.verifyingFace}</Text>
            <View style={styles.verifyingDotsRow}>
              {[0,1,2].map(i => (
                <Animated.View key={i} style={[styles.verifyingDot, { transform: [{ scale: pulseAnim }], opacity: i === 1 ? pulseAnim : 1 }]} />
              ))}
            </View>
          </View>
        )}

        {/* ── ATTEMPTS WARNING ── */}
        {!lockStatus?.isLocked && lockStatus && lockStatus.attemptsLeft < 3 && (
          <View style={styles.warningCard}>
            <AlertTriangle size={16} color={ORANGE} strokeWidth={2} style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>{lockStatus.attemptsLeft} {t.attemptsLeft}</Text>
          </View>
        )}

        {/* ── TIME WINDOW ── */}
        {timeCheck && !lockStatus?.isLocked && faceMatchStatus !== 'failed' && (
          <View style={[styles.statusCard, timeCheck.allowed ? styles.statusCardGreen : styles.statusCardRed]}>
            <View style={[styles.statusIconWrap, timeCheck.allowed ? styles.iconWrapGreen : styles.iconWrapRed]}>
              <Clock size={18} color={timeCheck.allowed ? GREEN : RED} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              {timeCheck.allowed && timeCheck.currentShift ? (
                <>
                  <Text style={[styles.statusTitle, { color: '#166534' }]}>
                    {t.currentShift}: {lang === 'en' ? timeCheck.currentShift.name : timeCheck.currentShift.nameHi}
                  </Text>
                  <Text style={styles.statusSub}>
                    {formatShiftTime(timeCheck.currentShift.startHour, timeCheck.currentShift.startMinute)}
                    {' — '}
                    {formatShiftTime(timeCheck.currentShift.endHour, timeCheck.currentShift.endMinute)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.statusTitle, { color: '#991B1B' }]}>{t.shiftBlocked}</Text>
                  {timeCheck.nextShift && timeCheck.minutesUntilNext && (
                    <Text style={styles.statusSub}>{t.nextShift}: {formatMinutesLeft(timeCheck.minutesUntilNext)}</Text>
                  )}
                </>
              )}
            </View>
            {timeCheck.allowed
              ? <CheckCircle2 size={18} color={GREEN} strokeWidth={2} />
              : <XCircle size={18} color={RED} strokeWidth={2} />
            }
          </View>
        )}

        {/* ── LOCATION ── */}
        {!lockStatus?.isLocked && faceMatchStatus !== 'failed' && (
          <View style={[
            styles.statusCard,
            locationStatus === 'allowed' ? styles.statusCardGreen :
            locationStatus === 'denied'  ? styles.statusCardRed   : styles.statusCardGray,
          ]}>
            <View style={[
              styles.statusIconWrap,
              locationStatus === 'allowed' ? styles.iconWrapGreen :
              locationStatus === 'denied'  ? styles.iconWrapRed   : styles.iconWrapGray,
            ]}>
              <MapPin size={18}
                color={locationStatus === 'allowed' ? GREEN : locationStatus === 'denied' ? RED : MUTED}
                strokeWidth={2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[
                styles.statusTitle,
                locationStatus === 'allowed' ? { color: '#166534' } :
                locationStatus === 'denied'  ? { color: '#991B1B' } : { color: MUTED },
              ]}>
                {locationStatus === 'checking' ? t.locationChecking :
                 locationStatus === 'allowed'  ? t.locationAllowed  : t.locationDenied}
              </Text>
              {locationStatus === 'allowed' && geoResult && (
  <Text style={styles.statusSub}>
    📍 {geoResult.zoneName} | Lat: {geoResult.latitude.toFixed(4)} | Lon: {geoResult.longitude.toFixed(4)}
  </Text>
)}
            </View>
            {locationStatus === 'checking' && <ActivityIndicator size="small" color={MUTED} />}
            {locationStatus === 'allowed'  && <CheckCircle2 size={18} color={GREEN} strokeWidth={2} />}
            {locationStatus === 'denied'   && (
              <TouchableOpacity style={styles.retryIconBtn} onPress={checkLocation} activeOpacity={0.7}>
                <RefreshCw size={14} color={NAVY} strokeWidth={2.5} />
                <Text style={styles.retryIconText}>{t.retryLocation}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── GPS CHIPS ── */}
        {geoResult && !lockStatus?.isLocked && faceMatchStatus !== 'failed' && (
          <View style={styles.gpsRow}>
            <View style={styles.gpsChip}>
              <Gauge size={14} color={NAVY} strokeWidth={2} />
              <View>
                <Text style={styles.gpsLabel}>{t.accuracy}</Text>
                <Text style={styles.gpsValue}>{geoResult.accuracy}m</Text>
              </View>
            </View>
            <View style={styles.gpsChip}>
              <Navigation size={14} color={ORANGE} strokeWidth={2} />
              <View>
                <Text style={styles.gpsLabel}>{t.distance}</Text>
                <Text style={styles.gpsValue}>{geoResult.distanceMeters}m</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── FACE FRAME ── */}
        {canScan && faceMatchStatus !== 'failed' && (
          <FaceFrame
            onLivenessComplete={handleLivenessComplete}
            onError={handleLivenessError}
            currentStep={currentStep}
            lang={lang}
          />
        )}

        {/* ── SAVING ── */}
        {saving && (
          <View style={styles.savingCard}>
            <ActivityIndicator size="small" color={ORANGE} />
            <Text style={styles.savingText}>{t.savingRecord}</Text>
          </View>
        )}

        {/* ── LIVENESS STEPS ── */}
        {!lockStatus?.isLocked && faceMatchStatus !== 'failed' && (
          <View style={styles.stepsCard}>
            <View style={styles.stepsHeader}>
              <ShieldCheck size={16} color={NAVY} strokeWidth={2} style={{ marginRight: 8 }} />
              <Text style={styles.stepsTitle}>{t.livenessTitle}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.stepsCount}>
                {t.stepLabel} {Math.min(currentStep + 1, 3)} {t.of} 3
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            {/* Steps */}
            <View style={styles.stepsList}>
              {steps.map((step, i) => {
                const isDone   = stepsDone[i];
                const isActive = i === currentStep && canScan;
                return (
                  <View key={i} style={[styles.stepRow, i < steps.length - 1 && styles.stepRowBorder]}>
                    <View style={[
                      styles.stepCircle,
                      isDone   ? styles.stepDone   :
                      isActive ? styles.stepActive : styles.stepPending,
                    ]}>
                      {isDone
                        ? <CheckCircle2 size={14} color={WHITE} strokeWidth={2.5} />
                        : <Text style={styles.stepNum}>{i + 1}</Text>
                      }
                    </View>
                    <Text style={[
                      styles.stepText,
                      isDone   ? styles.stepTextDone   :
                      isActive ? styles.stepTextActive : styles.stepTextPending,
                    ]}>
                      {step}
                    </Text>
                    {isActive && !isDone && (
                      <View style={styles.activeTag}>
                        <Text style={styles.activeTagText}>Now</Text>
                      </View>
                    )}
                    {isDone && (
                      <View style={styles.doneTag}>
                        <Text style={styles.doneTagText}>Done</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 4,
    shadowColor: NAVY, shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  headerBadge: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,107,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { padding: 16, gap: 12 },

  // Employee card
  empCard: {
    backgroundColor: WHITE,
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  empAvatarWrap: {
    padding: 2,
    borderRadius: 26,
    borderWidth: 2, borderColor: '#C8D9F0',
  },
  empAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LIGHT_NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  empAvatarText: { color: NAVY, fontWeight: '800', fontSize: 18 },
  empName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  empMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  empMeta: { fontSize: 11, color: MUTED, fontWeight: '500' },
  empDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: MUTED },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LIGHT_GREEN,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#B6EDD0',
  },
  verifiedText: { fontSize: 11, color: '#166534', fontWeight: '700' },

  // Alert card (locked / face failed)
  alertCard: {
    backgroundColor: LIGHT_RED,
    borderRadius: 18, padding: 24,
    alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#FECACA',
  },
  alertIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { fontSize: 17, fontWeight: '700', color: RED, textAlign: 'center' },
  alertMsg:   { fontSize: 13, color: '#7F1D1D', textAlign: 'center', lineHeight: 20 },
  timerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: RED,
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, marginTop: 6,
  },
  timerText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: NAVY,
    paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 22, marginTop: 8,
    elevation: 3,
    shadowColor: NAVY, shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
  },
  retryBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  // Verifying
  verifyingCard: {
    backgroundColor: LIGHT_NAVY,
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#C8D9F0',
  },
  verifyingTitle: { fontSize: 14, color: NAVY, fontWeight: '600' },
  verifyingDotsRow: { flexDirection: 'row', gap: 6 },
  verifyingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: NAVY },

  // Warning
  warningCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: LIGHT_ORANGE,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FFD5B0',
  },
  warningText: { color: ORANGE, fontSize: 13, fontWeight: '600' },

  // Status cards
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 13,
    borderWidth: 1,
  },
  statusCardGreen: { backgroundColor: LIGHT_GREEN, borderColor: '#B6EDD0' },
  statusCardRed:   { backgroundColor: LIGHT_RED,   borderColor: '#FECACA' },
  statusCardGray:  { backgroundColor: '#F3F4F6',   borderColor: BORDER   },
  statusIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapGreen: { backgroundColor: WHITE, borderWidth: 1, borderColor: '#B6EDD0' },
  iconWrapRed:   { backgroundColor: WHITE, borderWidth: 1, borderColor: '#FECACA' },
  iconWrapGray:  { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER    },
  statusTitle: { fontSize: 13, fontWeight: '700' },
  statusSub:   { fontSize: 11, color: MUTED, marginTop: 2 },
  retryIconBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LIGHT_NAVY,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10,
  },
  retryIconText: { color: NAVY, fontSize: 11, fontWeight: '700' },

  // GPS chips
  gpsRow: { flexDirection: 'row', gap: 10 },
  gpsChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: WHITE,
    borderRadius: 13, padding: 12,
    borderWidth: 1, borderColor: BORDER,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  gpsLabel: { fontSize: 10, color: MUTED, fontWeight: '500' },
  gpsValue: { fontSize: 15, fontWeight: '700', color: NAVY },

  // Saving
  savingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: LIGHT_ORANGE,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FFD5B0',
    justifyContent: 'center',
  },
  savingText: { color: ORANGE, fontSize: 13, fontWeight: '600' },

  // Steps card
  stepsCard: {
    backgroundColor: WHITE,
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    gap: 12,
  },
  stepsHeader: { flexDirection: 'row', alignItems: 'center' },
  stepsTitle:  { fontSize: 14, fontWeight: '700', color: NAVY },
  stepsCount:  { fontSize: 12, color: MUTED, fontWeight: '600' },
  progressBg: {
    height: 6, backgroundColor: '#E8ECF4',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: 6, backgroundColor: ORANGE, borderRadius: 3,
  },
  stepsList: { gap: 0 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  stepRowBorder: {
    borderBottomWidth: 1, borderBottomColor: '#F0F3FA',
  },
  stepCircle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone:    { backgroundColor: GREEN },
  stepActive:  { backgroundColor: NAVY },
  stepPending: { backgroundColor: '#E8ECF4' },
  stepNum:     { color: WHITE, fontWeight: '700', fontSize: 13 },
  stepText:    { flex: 1, fontSize: 14 },
  stepTextDone:    { color: GREEN,  fontWeight: '600' },
  stepTextActive:  { color: NAVY,   fontWeight: '700' },
  stepTextPending: { color: '#B0B8C8', fontWeight: '500' },
  activeTag: {
    backgroundColor: LIGHT_NAVY,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 10,
  },
  activeTagText: { color: NAVY, fontSize: 10, fontWeight: '700' },
  doneTag: {
    backgroundColor: LIGHT_GREEN,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 10,
  },
  doneTagText: { color: '#166534', fontSize: 10, fontWeight: '700' },
});