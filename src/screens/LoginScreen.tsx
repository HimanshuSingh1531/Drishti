import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { getEmployeeByEmpId } from '../utils/storage';
import {
  ArrowLeft,
  BadgeCheck,
  User,
  ShieldCheck,
  ScanFace,
  Wifi,
  ChevronRight,
  UserPlus,
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

const TRANSLATIONS = {
  en: {
    title: 'Employee Login',
    subtitle: 'Enter your registered credentials to continue',
    empIdLabel: 'Employee ID',
    empIdPlaceholder: 'e.g. DL-2024-0042',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Ramesh Kumar',
    loginBtn: 'Proceed to Face Scan',
    validating: 'Verifying...',
    notRegistered: 'Not Registered!',
    notRegisteredMsg: 'This Employee ID is not registered. Please register first.',
    nameMismatch: 'Name Mismatch!',
    nameMismatchMsg: 'The name does not match our records for this Employee ID.',
    offline: 'Offline Mode Active',
    secureNote: 'Face verification will confirm your identity.',
    registerLink: 'Not registered yet? Register here',
  },
  hi: {
    title: 'कर्मचारी लॉगिन',
    subtitle: 'अपनी पंजीकृत जानकारी दर्ज करें',
    empIdLabel: 'कर्मचारी आईडी',
    empIdPlaceholder: 'जैसे DL-2024-0042',
    nameLabel: 'पूरा नाम',
    namePlaceholder: 'जैसे रमेश कुमार',
    loginBtn: 'फेस स्कैन पर जाएं',
    validating: 'सत्यापित हो रहा है...',
    notRegistered: 'पंजीकृत नहीं!',
    notRegisteredMsg: 'यह कर्मचारी आईडी पंजीकृत नहीं है। कृपया पहले रजिस्टर करें।',
    nameMismatch: 'नाम मेल नहीं खाता!',
    nameMismatchMsg: 'नाम हमारे रिकॉर्ड से मेल नहीं खाता।',
    offline: 'ऑफलाइन मोड सक्रिय',
    secureNote: 'फेस वेरिफिकेशन आपकी पहचान की पुष्टि करेगा।',
    registerLink: 'अभी पंजीकृत नहीं? यहाँ रजिस्टर करें',
  },
};

export default function LoginScreen({ navigation, route }: any) {
  const lang = route?.params?.lang || 'en';
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS['en'];

  const [empId,      setEmpId]      = useState('');
  const [empName,    setEmpName]    = useState('');
  const [validating, setValidating] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleLogin() {
    if (!empId.trim()) {
      Alert.alert('Error', 'Please enter Employee ID');
      return;
    }
    if (!empName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setValidating(true);
    try {
      const employee = await getEmployeeByEmpId(empId.trim().toUpperCase());

      if (!employee) {
        Alert.alert(t.notRegistered, t.notRegisteredMsg, [
          { text: 'Register Now', onPress: () => navigation.navigate('Register', { lang }) },
          { text: 'OK', style: 'cancel' },
        ]);
        setValidating(false);
        return;
      }

      const registeredName = employee.empName.toLowerCase().trim();
      const enteredName    = empName.trim().toLowerCase();

      if (!registeredName.includes(enteredName) && !enteredName.includes(registeredName)) {
        Alert.alert(t.nameMismatch, t.nameMismatchMsg);
        setValidating(false);
        return;
      }

      navigation.navigate('FaceScan', {
        lang,
        empId:          employee.empId,
        empName:        employee.empName,
        department:     employee.department,
        storedEmbedding: employee.faceEmbedding,
      });
    } catch (err) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setValidating(false);
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
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Offline Badge */}
          <View style={styles.offlineBadge}>
            <View style={styles.greenDot} />
            <Wifi size={13} color="#1a7a4a" strokeWidth={2.5} />
            <Text style={styles.offlineText}>{t.offline}</Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <User size={38} color={NAVY} strokeWidth={1.5} />
              </View>
            </View>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>

            {/* Employee ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.empIdLabel}</Text>
              <View style={[styles.inputRow, focusedField === 'id' && styles.inputRowFocused]}>
                <BadgeCheck size={18} color={focusedField === 'id' ? NAVY : MUTED} strokeWidth={2} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputText}
                  placeholder={t.empIdPlaceholder}
                  placeholderTextColor="#B0B8C8"
                  value={empId}
                  onChangeText={text => setEmpId(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={15}
                  onFocus={() => setFocusedField('id')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.nameLabel}</Text>
              <View style={[styles.inputRow, focusedField === 'name' && styles.inputRowFocused]}>
                <User size={18} color={focusedField === 'name' ? NAVY : MUTED} strokeWidth={2} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputText}
                  placeholder={t.namePlaceholder}
                  placeholderTextColor="#B0B8C8"
                  value={empName}
                  onChangeText={setEmpName}
                  autoCapitalize="words"
                  maxLength={50}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

          </View>

          {/* Secure Note */}
          <View style={styles.secureNote}>
            <View style={styles.secureIconWrap}>
              <ShieldCheck size={16} color={ORANGE} strokeWidth={2} />
            </View>
            <Text style={styles.secureText}>{t.secureNote}</Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, validating && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={validating}
            activeOpacity={0.85}
          >
            {validating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={WHITE} size="small" />
                <Text style={styles.primaryBtnText}>{t.validating}</Text>
              </View>
            ) : (
              <>
                <ScanFace size={20} color={WHITE} strokeWidth={2} style={{ marginRight: 10 }} />
                <Text style={styles.primaryBtnText}>{t.loginBtn}</Text>
                <ChevronRight size={18} color={WHITE} strokeWidth={2.5} style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLinkRow}
            onPress={() => navigation.navigate('Register', { lang })}
            activeOpacity={0.7}
          >
            <UserPlus size={15} color={NAVY} strokeWidth={2} style={{ marginRight: 6 }} />
            <Text style={styles.registerLinkText}>{t.registerLink}</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: WHITE, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  scroll: { padding: 20, gap: 18, paddingBottom: 40 },

  // Offline badge
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F9EF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#B6EDD0',
  },
  greenDot: { width: 7, height: 7, backgroundColor: GREEN, borderRadius: 4 },
  offlineText: { color: '#1a7a4a', fontSize: 12, fontWeight: '600' },

  // Avatar
  avatarSection: { alignItems: 'center', gap: 12 },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: LIGHT_NAVY,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#C8D9F0',
    elevation: 3,
    shadowColor: NAVY,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: BORDER,
  },
  subtitle: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20 },

  // Form card
  formCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: NAVY, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  inputRowFocused: { borderColor: NAVY, backgroundColor: LIGHT_NAVY },
  inputText: { flex: 1, fontSize: 14, color: '#1C1C1E', fontWeight: '500' },

  // Secure note
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: LIGHT_ORANGE,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FFD5B0',
  },
  secureIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    elevation: 1,
  },
  secureText: { fontSize: 12, color: '#854F0B', flex: 1, lineHeight: 18 },

  // Primary button
  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  primaryBtnDisabled: { backgroundColor: '#B0B8C8', elevation: 0, shadowOpacity: 0 },
  primaryBtnText: { color: WHITE, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Register link
  registerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  registerLinkText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});