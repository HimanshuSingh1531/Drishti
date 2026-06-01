export const LANGUAGES = {
  en: 'English',
  hi: 'हिंदी',
};

export type LangType = 'en' | 'hi';

export const T = {
  en: {
    // App General
    appName: 'DRISHTI',
    tagline: 'Authenticating India, Offline.',
    version: 'v1.0',
    offlineMode: 'Offline Mode Active',
    onlineMode: 'Online Mode',
    poweredBy: 'Powered by DRISHTI AI Engine',

    // Auth
    loginBtn: 'Login with Face ID',
    faceAuth: 'Face Authentication',
    authResult: 'Authentication Result',

    // Liveness
    livenessTitle: 'Liveness Check',
    step1: 'Blink your eyes',
    step2: 'Smile please',
    step3: 'Turn head slightly',
    stepLabel: 'Step',
    of: 'of',
    analyzing: 'Analyzing...',
    startCamera: 'Starting camera...',
    tapVerify: 'Tap to Verify',
    livenessFailed: 'Liveness Failed',
    livenessFailedMsg: 'Make sure your face is clearly visible and try again.',
    noCameraFound: 'No front camera found',
    cameraPermRequired: 'Camera permission required',

    // Location
    locationChecking: 'Checking location...',
    locationAllowed: 'Zone OK',
    locationDenied: 'Out of Zone — Attendance Blocked',
    retryLocation: 'Retry Location',
    accuracy: 'GPS Accuracy',
    distance: 'Distance from Zone',
    outOfZoneTitle: 'Out of Zone',
    outOfZoneMsg: 'You must be within the allowed zone to mark attendance.',

    // Time Window
    timeWindowTitle: 'Outside Shift Hours',
    timeWindowMsg: 'Attendance can only be marked during shift hours.',
    shiftTime: 'Shift Hours',

    // Success
    verified: 'Verified Successfully',
    name: 'Name',
    empId: 'Employee ID',
    time: 'Time',
    location: 'Location',
    status: 'Status',
    offline: 'Offline',
    markBtn: 'Mark Attendance',
    syncNote: 'Data will sync automatically when online',
    goToDashboard: 'Go to Dashboard',
    attendanceMarked: 'Attendance Marked!',

    // Dashboard
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
    noRecords: 'No attendance records yet',
    syncSuccess: 'Sync Complete',
    syncFailed: 'Sync Failed',
    liveness: 'Liveness',
    savingRecord: 'Saving attendance...',

    // Errors
    saveFailed: 'Save Failed',
    saveFailedMsg: 'Could not save attendance. Please try again.',
    tryAgain: 'Please try again.',
    error: 'Error',
  },

  hi: {
    // App General
    appName: 'दृष्टि',
    tagline: 'भारत को ऑफलाइन प्रमाणित करना।',
    version: 'v1.0',
    offlineMode: 'ऑफलाइन मोड सक्रिय',
    onlineMode: 'ऑनलाइन मोड',
    poweredBy: 'DRISHTI AI इंजन द्वारा संचालित',

    // Auth
    loginBtn: 'फेस आईडी से लॉगिन करें',
    faceAuth: 'चेहरा प्रमाणीकरण',
    authResult: 'प्रमाणीकरण परिणाम',

    // Liveness
    livenessTitle: 'जीवंतता जांच',
    step1: 'आंखें झपकाएं',
    step2: 'मुस्कुराएं',
    step3: 'सिर थोड़ा घुमाएं',
    stepLabel: 'चरण',
    of: 'में से',
    analyzing: 'विश्लेषण हो रहा है...',
    startCamera: 'कैमरा शुरू हो रहा है...',
    tapVerify: 'सत्यापित करें',
    livenessFailed: 'प्रमाणीकरण विफल',
    livenessFailedMsg: 'सुनिश्चित करें कि आपका चेहरा स्पष्ट दिख रहा है।',
    noCameraFound: 'फ्रंट कैमरा नहीं मिला',
    cameraPermRequired: 'कैमरा अनुमति आवश्यक है',

    // Location
    locationChecking: 'स्थान जांच रहे हैं...',
    locationAllowed: 'क्षेत्र ठीक',
    locationDenied: 'क्षेत्र से बाहर — उपस्थिति अवरुद्ध',
    retryLocation: 'पुनः जांचें',
    accuracy: 'GPS सटीकता',
    distance: 'क्षेत्र से दूरी',
    outOfZoneTitle: 'क्षेत्र से बाहर',
    outOfZoneMsg: 'उपस्थिति दर्ज करने के लिए अनुमत क्षेत्र में होना आवश्यक है।',

    // Time Window
    timeWindowTitle: 'शिफ्ट समय के बाहर',
    timeWindowMsg: 'उपस्थिति केवल शिफ्ट समय के दौरान दर्ज की जा सकती है।',
    shiftTime: 'शिफ्ट समय',

    // Success
    verified: 'सफलतापूर्वक सत्यापित',
    name: 'नाम',
    empId: 'कर्मचारी आईडी',
    time: 'समय',
    location: 'स्थान',
    status: 'स्थिति',
    offline: 'ऑफलाइन',
    markBtn: 'उपस्थिति दर्ज करें',
    syncNote: 'ऑनलाइन होने पर डेटा स्वतः सिंक होगा',
    goToDashboard: 'डैशबोर्ड पर जाएं',
    attendanceMarked: 'उपस्थिति दर्ज हो गई!',

    // Dashboard
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
    noRecords: 'अभी कोई रिकॉर्ड नहीं',
    syncSuccess: 'सिंक पूर्ण',
    syncFailed: 'सिंक विफल',
    liveness: 'जीवंतता',
    savingRecord: 'उपस्थिति सहेज रहे हैं...',

    // Errors
    saveFailed: 'सहेजना विफल',
    saveFailedMsg: 'उपस्थिति सहेजी नहीं जा सकी। पुनः प्रयास करें।',
    tryAgain: 'पुनः प्रयास करें।',
    error: 'त्रुटि',
  },
};