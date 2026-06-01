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

const TRANSLATIONS = {
  en: {
    title: 'Employee Login',
    subtitle: 'Enter your credentials to continue',
    empIdLabel: 'Employee ID',
    empIdPlaceholder: 'e.g. DL-2024-0042',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Ramesh Kumar',
    deptLabel: 'Department',
    deptPlaceholder: 'e.g. Field Operations',
    loginBtn: 'Proceed to Face Scan',
    validating: 'Validating...',
    errorTitle: 'Invalid Details',
    errorMsg: 'Please fill all fields correctly.',
    empIdError: 'Employee ID must start with DL-',
    nameError: 'Name must be at least 3 characters.',
    offline: 'Offline Mode Active',
    secureNote: 'Your data is encrypted and stored securely offline.',
  },
  hi: {
    title: 'कर्मचारी लॉगिन',
    subtitle: 'जारी रखने के लिए अपनी जानकारी दर्ज करें',
    empIdLabel: 'कर्मचारी आईडी',
    empIdPlaceholder: 'जैसे DL-2024-0042',
    nameLabel: 'पूरा नाम',
    namePlaceholder: 'जैसे रमेश कुमार',
    deptLabel: 'विभाग',
    deptPlaceholder: 'जैसे फील्ड ऑपरेशंस',
    loginBtn: 'फेस स्कैन पर जाएं',
    validating: 'सत्यापित हो रहा है...',
    errorTitle: 'अमान्य जानकारी',
    errorMsg: 'कृपया सभी फ़ील्ड सही से भरें।',
    empIdError: 'कर्मचारी आईडी DL- से शुरू होनी चाहिए।',
    nameError: 'नाम कम से कम 3 अक्षर का होना चाहिए।',
    offline: 'ऑफलाइन मोड सक्रिय',
    secureNote: 'आपका डेटा एन्क्रिप्टेड और सुरक्षित रूप से सहेजा जाता है।',
  },
};

const DEPARTMENTS = {
  en: [
    'Field Operations',
    'Site Management',
    'Survey Team',
    'Quality Control',
    'Administration',
  ],
  hi: [
    'फील्ड ऑपरेशंस',
    'साइट प्रबंधन',
    'सर्वे टीम',
    'गुणवत्ता नियंत्रण',
    'प्रशासन',
  ],
};

export default function LoginScreen({ navigation, route }: any) {
  const lang = route?.params?.lang || 'en';
  const t = TRANSLATIONS[lang];

  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [department, setDepartment] = useState('');
  const [validating, setValidating] = useState(false);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);

  // ─── Validate Fields ───
  function validate(): boolean {
    if (!empId.startsWith('DL-') || empId.length < 8) {
      Alert.alert(t.errorTitle, t.empIdError);
      return false;
    }
    if (empName.trim().length < 3) {
      Alert.alert(t.errorTitle, t.nameError);
      return false;
    }
    if (!department) {
      Alert.alert(t.errorTitle, t.errorMsg);
      return false;
    }
    return true;
  }

  // ─── Handle Login ───
  async function handleLogin() {
    if (!validate()) return;
    setValidating(true);

    // Simulate validation delay
    await new Promise(res => setTimeout(res, 800));
    setValidating(false);

    // Navigate to FaceScan with employee details
    navigation.navigate('FaceScan', {
      lang,
      empId: empId.trim().toUpperCase(),
      empName: empName.trim(),
      department,
    });
  }

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Offline Badge */}
          <View style={styles.offlineBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.offlineText}>{t.offline}</Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>

            {/* Employee ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.empIdLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.empIdPlaceholder}
                placeholderTextColor="#AAAAAA"
                value={empId}
                onChangeText={text => setEmpId(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={15}
              />
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.nameLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.namePlaceholder}
                placeholderTextColor="#AAAAAA"
                value={empName}
                onChangeText={setEmpName}
                autoCapitalize="words"
                maxLength={50}
              />
            </View>

            {/* Department */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.deptLabel}</Text>
              <View style={styles.deptGrid}>
                {DEPARTMENTS[lang].map((dept, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.deptChip,
                      selectedDept === i && styles.deptChipActive,
                    ]}
                    onPress={() => {
                      setSelectedDept(i);
                      setDepartment(DEPARTMENTS['en'][i]);
                    }}>
                    <Text style={[
                      styles.deptChipText,
                      selectedDept === i && styles.deptChipTextActive,
                    ]}>
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>

          {/* Secure Note */}
          <View style={styles.secureNote}>
            <Text style={styles.secureIcon}>🔐</Text>
            <Text style={styles.secureText}>{t.secureNote}</Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, validating && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={validating}>
            {validating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loginBtnText}>{t.validating}</Text>
              </View>
            ) : (
              <Text style={styles.loginBtnText}>{t.loginBtn} →</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { padding: 20, gap: 16 },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'center',
  },
  greenDot: { width: 8, height: 8, backgroundColor: '#2ECC71', borderRadius: 4 },
  offlineText: { color: '#1a7a4a', fontSize: 12, fontWeight: '500' },
  avatarContainer: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#E8EDF5',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A3C6E',
  },
  avatarIcon: { fontSize: 36 },
  subtitle: { fontSize: 13, color: '#6E6E73', textAlign: 'center' },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#1A3C6E' },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1C1E',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  deptChipActive: {
    backgroundColor: '#1A3C6E',
    borderColor: '#1A3C6E',
  },
  deptChipText: { fontSize: 12, color: '#6E6E73', fontWeight: '500' },
  deptChipTextActive: { color: '#fff' },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8F0',
    padding: 12,
    borderRadius: 10,
  },
  secureIcon: { fontSize: 16 },
  secureText: { fontSize: 11, color: '#854F0B', flex: 1 },
  loginBtn: {
    backgroundColor: '#1A3C6E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnDisabled: { backgroundColor: '#AAAAAA' },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});