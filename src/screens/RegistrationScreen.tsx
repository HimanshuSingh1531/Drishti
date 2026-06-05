import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
  ScrollView, Platform, PermissionsAndroid, Animated,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { saveEmployee, getEmployeeByEmpId } from '../utils/storage';
import FaceDetection from '@react-native-ml-kit/face-detection';
import {
  ArrowLeft, User, BadgeCheck, Building2,
  Camera as CameraIcon, CheckCircle2, ChevronRight,
  Info, ScanFace, Briefcase, ShieldCheck,
} from 'lucide-react-native';

const NAVY   = '#1A3C6E';
const ORANGE = '#FF6B00';
const BG     = '#F5F6FA';
const WHITE  = '#FFFFFF';
const BORDER = '#DDE3EE';
const MUTED  = '#6B7280';
const LIGHT_ORANGE = '#FFF3EA';
const LIGHT_NAVY   = '#EAF0FA';

// ─── TRANSLATIONS ───
const TRANSLATIONS = {
  en: {
    headerForm:       'Employee Registration',
    headerCamera:     'Face Capture',
    headerResult:     'Authentication Result',
    infoBanner:       'Register once to enable face-based attendance. Your biometric data is stored securely on-device.',
    step1:            'Details',
    step2:            'Face Scan',
    step3:            'Done',
    fieldEmpId:       'Employee ID',
    fieldName:        'Full Name',
    fieldDept:        'Department',
    placeholderEmpId: 'e.g. DL-2024-0042',
    placeholderName:  'e.g. Ramesh Kumar',
    proceedBtn:       'Proceed to Face Capture',
    cameraHint:       'Position your face inside the oval. Look straight at the camera.',
    tip1: 'Good lighting', tip2: 'Face forward', tip3: 'Remove glasses',
    captureBtn:       'Capture & Register',
    cameraReady:      'Camera Ready',
    cameraStarting:   'Starting…',
    processingTitle:  'Processing…',
    procStep1:        'Analyzing biometrics',
    procStep2:        'Encrypting data',
    procStep3:        'Saving securely',
    doneTitle:        'Registration Complete!',
    doneInfo:         'Face data stored securely offline. Ready for face-based attendance.',
    goLogin:          'Go to Login',
    errInvalidId:     'Employee ID must start with DL-',
    errInvalidIdTitle:'Invalid ID',
    errName:          'Name must be at least 3 characters.',
    errNameTitle:     'Invalid Name',
    errDept:          'Please select a department.',
    errDeptTitle:     'Select Department',
    errAlreadyTitle:  'Already Registered',
    errAlreadyMsg:    (id: string, name: string) => `${id} is already registered as ${name}.`,
    errNoFaceTitle:   'No Face Detected',
    errNoFaceMsg:     'Please look straight at the camera and try again.',
    errRegTitle:      'Registration Error',
    cameraNA:         'Camera not available',
    capturing:        'Capturing face…',
    detecting:        'Detecting face…',
    saving:           'Saving employee…',
  },
  hi: {
    headerForm:       'कर्मचारी पंजीकरण',
    headerCamera:     'चेहरा कैप्चर',
    headerResult:     'प्रमाणीकरण परिणाम',
    infoBanner:       'चेहरे से उपस्थिति के लिए एक बार पंजीकरण करें। आपका बायोमेट्रिक डेटा डिवाइस पर सुरक्षित है।',
    step1:            'विवरण',
    step2:            'चेहरा स्कैन',
    step3:            'पूर्ण',
    fieldEmpId:       'कर्मचारी आईडी',
    fieldName:        'पूरा नाम',
    fieldDept:        'विभाग',
    placeholderEmpId: 'जैसे DL-2024-0042',
    placeholderName:  'जैसे रमेश कुमार',
    proceedBtn:       'चेहरा कैप्चर करें',
    cameraHint:       'अपना चेहरा अंडाकार के अंदर रखें। सीधे कैमरे में देखें।',
    tip1: 'अच्छी रोशनी', tip2: 'सीधे देखें', tip3: 'चश्मा हटाएं',
    captureBtn:       'कैप्चर करें और पंजीकरण करें',
    cameraReady:      'कैमरा तैयार है',
    cameraStarting:   'शुरू हो रहा है…',
    processingTitle:  'प्रक्रिया जारी है…',
    procStep1:        'बायोमेट्रिक विश्लेषण',
    procStep2:        'डेटा एन्क्रिप्शन',
    procStep3:        'सुरक्षित सहेजना',
    doneTitle:        'पंजीकरण पूर्ण!',
    doneInfo:         'चेहरे का डेटा ऑफलाइन सुरक्षित है। उपस्थिति के लिए तैयार।',
    goLogin:          'लॉगिन पर जाएं',
    errInvalidId:     'कर्मचारी आईडी DL- से शुरू होनी चाहिए',
    errInvalidIdTitle:'अमान्य आईडी',
    errName:          'नाम कम से कम 3 अक्षर का होना चाहिए।',
    errNameTitle:     'अमान्य नाम',
    errDept:          'कृपया एक विभाग चुनें।',
    errDeptTitle:     'विभाग चुनें',
    errAlreadyTitle:  'पहले से पंजीकृत',
    errAlreadyMsg:    (id: string, name: string) => `${id} पहले से ${name} के रूप में पंजीकृत है।`,
    errNoFaceTitle:   'चेहरा नहीं मिला',
    errNoFaceMsg:     'कृपया सीधे कैमरे में देखें और पुनः प्रयास करें।',
    errRegTitle:      'पंजीकरण त्रुटि',
    cameraNA:         'कैमरा उपलब्ध नहीं है',
    capturing:        'चेहरा कैप्चर हो रहा है…',
    detecting:        'चेहरा पहचाना जा रहा है…',
    saving:           'कर्मचारी सहेजा जा रहा है…',
  },
};

const DEPARTMENTS = {
  en: [
    { label: 'Field Operations', icon: Briefcase },
    { label: 'Site Management',  icon: Building2 },
    { label: 'Survey Team',      icon: ScanFace },
    { label: 'Quality Control',  icon: ShieldCheck },
    { label: 'Administration',   icon: BadgeCheck },
  ],
  hi: [
    { label: 'फील्ड ऑपरेशन',  icon: Briefcase },
    { label: 'साइट प्रबंधन',   icon: Building2 },
    { label: 'सर्वे टीम',      icon: ScanFace },
    { label: 'गुणवत्ता नियंत्रण', icon: ShieldCheck },
    { label: 'प्रशासन',        icon: BadgeCheck },
  ],
};

export default function RegistrationScreen({ navigation, route }: any) {
  const lang   = route?.params?.lang || 'en';
  const t      = TRANSLATIONS[lang as 'en' | 'hi'];
  const depts  = DEPARTMENTS[lang as 'en' | 'hi'];

  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);

  const [empId,        setEmpId]        = useState('');
  const [empName,      setEmpName]      = useState('');
  const [department,   setDepartment]   = useState('');
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [step,         setStep]         = useState<'form' | 'camera' | 'processing' | 'done'>('form');
  const [isReady,      setIsReady]      = useState(false);
  const [hasPermission,setHasPermission]= useState(false);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (step === 'camera') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [step]);

  async function requestCamera() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    }
  }

  async function handleFormSubmit() {
    if (!empId.startsWith('DL-') || empId.length < 6) {
      Alert.alert(t.errInvalidIdTitle, t.errInvalidId); return;
    }
    if (empName.trim().length < 3) {
      Alert.alert(t.errNameTitle, t.errName); return;
    }
    if (!department) {
      Alert.alert(t.errDeptTitle, t.errDept); return;
    }
    const existing = await getEmployeeByEmpId(empId.trim().toUpperCase());
    if (existing) {
      Alert.alert(t.errAlreadyTitle, t.errAlreadyMsg(empId, existing.empName)); return;
    }
    await requestCamera();
    setStep('camera');
  }

  async function captureAndRegister() {
    if (!camera.current || !isReady) return;
    setStatusMsg(t.capturing);
    try {
      const photo = await camera.current.takePhoto({ qualityPrioritization: 'accuracy', flash: 'off' });
      setStatusMsg(t.detecting);
      setStep('processing');

      const faces = await FaceDetection.detect(`file://${photo.path}`, {
        performanceMode: 'accurate',
        landmarkMode: 'all',
        classificationMode: 'all',
      });

      if (!faces || faces.length === 0) {
        Alert.alert(t.errNoFaceTitle, t.errNoFaceMsg);
        setStep('camera'); return;
      }

      setStatusMsg(t.saving);
      await saveEmployee(empId.trim().toUpperCase(), empName.trim(), department, 'Field Staff', []);
      setStep('done');
    } catch (err: any) {
      Alert.alert(t.errRegTitle, String(err?.message || JSON.stringify(err)));
      setStep('camera');
    }
  }

  // ─── Header ───
  const Header = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.7}>
        <ArrowLeft size={20} color={WHITE} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ─── Progress Bar ───
  const ProgressBar = ({ active }: { active: 1 | 2 | 3 }) => (
    <View style={styles.progressRow}>
      <View style={styles.progressStep}>
        <View style={[styles.progressDot, active > 1 ? styles.progressDotDone : active === 1 ? styles.progressDotActive : {}]}>
          {active > 1
            ? <CheckCircle2 size={12} color={WHITE} />
            : <Text style={[styles.progressDotText, active < 1 && { color: MUTED }]}>1</Text>}
        </View>
        <Text style={[styles.progressLabel, active >= 1 ? { color: NAVY, fontWeight: '600' } : { color: MUTED }]}>{t.step1}</Text>
      </View>
      <View style={[styles.progressLine, active > 1 && { backgroundColor: NAVY }]} />
      <View style={styles.progressStep}>
        <View style={[styles.progressDot, active > 2 ? styles.progressDotDone : active === 2 ? styles.progressDotActive : {}]}>
          {active > 2
            ? <CheckCircle2 size={12} color={WHITE} />
            : <Text style={[styles.progressDotText, active < 2 && { color: MUTED }]}>2</Text>}
        </View>
        <Text style={[styles.progressLabel, active >= 2 ? { color: NAVY, fontWeight: '600' } : { color: MUTED }]}>{t.step2}</Text>
      </View>
      <View style={[styles.progressLine, active > 2 && { backgroundColor: NAVY }]} />
      <View style={styles.progressStep}>
        <View style={[styles.progressDot, active === 3 ? styles.progressDotActive : {}]}>
          <Text style={[styles.progressDotText, active < 3 && { color: MUTED }]}>3</Text>
        </View>
        <Text style={[styles.progressLabel, active >= 3 ? { color: NAVY, fontWeight: '600' } : { color: MUTED }]}>{t.step3}</Text>
      </View>
    </View>
  );

  // ─── Form Step ───
  if (step === 'form') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t.headerForm} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrap}>
              <Info size={18} color={NAVY} strokeWidth={2} />
            </View>
            <Text style={styles.infoText}>{t.infoBanner}</Text>
          </View>

          <ProgressBar active={1} />

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.fieldEmpId}</Text>
              <View style={[styles.inputRow, focusedField === 'id' && styles.inputRowFocused]}>
                <BadgeCheck size={18} color={focusedField === 'id' ? NAVY : MUTED} strokeWidth={2} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputText}
                  placeholder={t.placeholderEmpId}
                  placeholderTextColor="#B0B8C8"
                  value={empId}
                  onChangeText={v => setEmpId(v.toUpperCase())}
                  autoCapitalize="characters"
                  onFocus={() => setFocusedField('id')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.fieldName}</Text>
              <View style={[styles.inputRow, focusedField === 'name' && styles.inputRowFocused]}>
                <User size={18} color={focusedField === 'name' ? NAVY : MUTED} strokeWidth={2} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputText}
                  placeholder={t.placeholderName}
                  placeholderTextColor="#B0B8C8"
                  value={empName}
                  onChangeText={setEmpName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.fieldDept}</Text>
              <View style={styles.deptGrid}>
                {depts.map((dept, i) => {
                  const Icon = dept.icon;
                  const active = selectedDept === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.deptChip, active && styles.deptChipActive]}
                      onPress={() => { setSelectedDept(i); setDepartment(dept.label); }}
                      activeOpacity={0.75}
                    >
                      <Icon size={14} color={active ? WHITE : NAVY} strokeWidth={2} style={{ marginRight: 5 }} />
                      <Text style={[styles.deptText, active && styles.deptTextActive]}>{dept.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleFormSubmit} activeOpacity={0.85}>
            <CameraIcon size={20} color={WHITE} strokeWidth={2.5} style={{ marginRight: 10 }} />
            <Text style={styles.primaryBtnText}>{t.proceedBtn}</Text>
            <ChevronRight size={18} color={WHITE} strokeWidth={2.5} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Camera Step ───
  if (step === 'camera') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t.headerCamera} onBack={() => setStep('form')} />
        <ProgressBar active={2} />

        <View style={styles.cameraSection}>
          <Text style={styles.cameraHint}>{t.cameraHint}</Text>

          {device && hasPermission ? (
            <Animated.View style={[styles.cameraOvalWrap, { transform: [{ scale: pulseAnim }] }]}>
              <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
                onInitialized={() => setIsReady(true)}
              />
              <View style={styles.ovalOverlay} pointerEvents="none">
                <View style={styles.ovalCutout} />
              </View>
              <View style={[styles.cornerGuide, styles.cornerTL]} />
              <View style={[styles.cornerGuide, styles.cornerTR]} />
              <View style={[styles.cornerGuide, styles.cornerBL]} />
              <View style={[styles.cornerGuide, styles.cornerBR]} />
              <View style={styles.cameraStatusBadge}>
                <View style={[styles.liveIndicator, isReady && styles.liveIndicatorActive]} />
                <Text style={styles.cameraStatusText}>{isReady ? t.cameraReady : t.cameraStarting}</Text>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.noCameraBox}>
              <CameraIcon size={40} color={MUTED} strokeWidth={1.5} />
              <Text style={styles.noCameraText}>{t.cameraNA}</Text>
            </View>
          )}

          <View style={styles.tipsRow}>
            {[t.tip1, t.tip2, t.tip3].map((tip, i) => (
              <View key={i} style={styles.tipChip}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !isReady && styles.primaryBtnDisabled]}
            onPress={captureAndRegister}
            disabled={!isReady}
            activeOpacity={0.85}
          >
            <ScanFace size={22} color={WHITE} strokeWidth={2} style={{ marginRight: 10 }} />
            <Text style={styles.primaryBtnText}>{t.captureBtn}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Processing Step ───
  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredBox}>
          <View style={styles.processingRing}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
          <Text style={styles.processingTitle}>{t.processingTitle}</Text>
          <Text style={styles.processingMsg}>{statusMsg}</Text>
          <View style={styles.processingSteps}>
            {[t.procStep1, t.procStep2, t.procStep3].map((s, i) => (
              <View key={i} style={styles.processingStepRow}>
                <View style={[styles.processingStepDot, i === 0 && styles.processingStepDotActive]} />
                <Text style={styles.processingStepText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Done Step ───
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centeredBox}>
        <View style={styles.successRing}>
          <CheckCircle2 size={52} color={WHITE} strokeWidth={1.8} />
        </View>
        <Text style={styles.doneTitle}>{t.doneTitle}</Text>
        <View style={styles.doneCard}>
          <View style={styles.doneRow}>
            <User size={16} color={NAVY} strokeWidth={2} />
            <Text style={styles.doneName}>{empName}</Text>
          </View>
          <View style={styles.doneDivider} />
          <View style={styles.doneRow}>
            <BadgeCheck size={16} color={ORANGE} strokeWidth={2} />
            <Text style={styles.doneId}>{empId}</Text>
          </View>
          <View style={styles.doneDivider} />
          <View style={styles.doneRow}>
            <Building2 size={16} color={NAVY} strokeWidth={2} />
            <Text style={styles.doneDept}>{department}</Text>
          </View>
        </View>
        <View style={styles.doneInfoBanner}>
          <ShieldCheck size={16} color={NAVY} strokeWidth={2} style={{ marginRight: 8 }} />
          <Text style={styles.doneInfoText}>{t.doneInfo}</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login', { lang })}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t.goLogin}</Text>
          <ChevronRight size={20} color={WHITE} strokeWidth={2.5} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 4, shadowColor: NAVY, shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 16,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  progressStep: { alignItems: 'center', gap: 4 },
  progressDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E5EAF3', alignItems: 'center', justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: NAVY },
  progressDotDone:   { backgroundColor: '#22C55E' },
  progressDotText:   { fontSize: 12, fontWeight: '700', color: WHITE },
  progressLine: { flex: 1, height: 2, backgroundColor: BORDER, marginHorizontal: 6, marginBottom: 16 },
  progressLabel: { fontSize: 11, fontWeight: '600', color: NAVY },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: LIGHT_NAVY, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderColor: '#C8D9F0',
  },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center', elevation: 1,
  },
  infoText: { flex: 1, fontSize: 13, color: NAVY, lineHeight: 20 },
  formCard: {
    backgroundColor: WHITE, borderRadius: 18, padding: 20, gap: 18,
    borderWidth: 1, borderColor: BORDER,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: NAVY, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: BORDER,
  },
  inputRowFocused: { borderColor: NAVY, backgroundColor: LIGHT_NAVY },
  inputText: { flex: 1, fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 22,
    backgroundColor: LIGHT_NAVY, borderWidth: 1.5, borderColor: '#C8D9F0',
  },
  deptChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  deptText:       { fontSize: 12, color: NAVY, fontWeight: '600' },
  deptTextActive: { color: WHITE },
  primaryBtn: {
    backgroundColor: NAVY, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: NAVY, shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  primaryBtnDisabled: { backgroundColor: '#B0B8C8', elevation: 0, shadowOpacity: 0 },
  primaryBtnText: { color: WHITE, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  cameraSection: {
    flex: 1, padding: 20, gap: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraHint: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  cameraOvalWrap: {
    width: 240, height: 300, borderRadius: 120,
    overflow: 'hidden', borderWidth: 3, borderColor: ORANGE,
    backgroundColor: '#111', elevation: 8,
    shadowColor: ORANGE, shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  ovalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  ovalCutout: {
    position: 'absolute', top: 20, left: 20, right: 20, bottom: 20,
    borderRadius: 100, borderWidth: 2,
    borderColor: 'rgba(255,107,0,0.7)', borderStyle: 'dashed',
  },
  cornerGuide: { position: 'absolute', width: 22, height: 22, borderColor: ORANGE },
  cornerTL: { top: 10, left: 10,  borderTopWidth: 3,    borderLeftWidth: 3,  borderTopLeftRadius: 6 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 3,    borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 10, left: 10,  borderBottomWidth: 3, borderLeftWidth: 3,  borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  cameraStatusBadge: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 6,
  },
  liveIndicator:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#888' },
  liveIndicatorActive: { backgroundColor: '#22C55E' },
  cameraStatusText: { color: WHITE, fontSize: 11, fontWeight: '600' },
  noCameraBox: {
    width: 240, height: 300, borderRadius: 120,
    backgroundColor: '#E5EAF3', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: 2, borderColor: BORDER,
  },
  noCameraText: { color: MUTED, fontSize: 13, fontWeight: '500' },
  tipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  tipChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: LIGHT_ORANGE, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, gap: 5, borderWidth: 1, borderColor: '#FFD5B0',
  },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
  tipText: { fontSize: 11, color: ORANGE, fontWeight: '600' },
  centeredBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  processingRing: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: LIGHT_ORANGE,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFD5B0',
  },
  processingTitle: { fontSize: 20, fontWeight: '700', color: NAVY },
  processingMsg:   { fontSize: 14, color: MUTED },
  processingSteps: { gap: 10, marginTop: 8, width: '100%', paddingHorizontal: 16 },
  processingStepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  processingStepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D5DB' },
  processingStepDotActive: { backgroundColor: ORANGE },
  processingStepText: { fontSize: 13, color: MUTED },
  successRing: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#22C55E', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  doneTitle: { fontSize: 24, fontWeight: '800', color: NAVY, textAlign: 'center' },
  doneCard: {
    backgroundColor: WHITE, borderRadius: 18, padding: 18, width: '100%',
    borderWidth: 1, borderColor: BORDER,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, gap: 0,
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  doneDivider: { height: 1, backgroundColor: BORDER },
  doneName: { fontSize: 16, fontWeight: '700', color: NAVY },
  doneId:   { fontSize: 14, fontWeight: '600', color: ORANGE },
  doneDept: { fontSize: 14, fontWeight: '600', color: NAVY },
  doneInfoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: LIGHT_NAVY, borderRadius: 12, padding: 12, width: '100%',
    borderWidth: 1, borderColor: '#C8D9F0',
  },
  doneInfoText: { flex: 1, fontSize: 12, color: NAVY, lineHeight: 18 },
});