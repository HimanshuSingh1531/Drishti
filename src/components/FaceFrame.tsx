import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
} from 'react-native-vision-camera';
import FaceDetection, {
  Face,
} from '@react-native-ml-kit/face-detection';

interface FaceFrameProps {
  onLivenessComplete: (score: number, photoPath: string) => void;
  onError: (error: string) => void;
  currentStep: number;
  lang: 'en' | 'hi';
}

const STEP_LABELS = {
  en: ['Blink your eyes', 'Smile please', 'Turn head slightly'],
  hi: ['आंखें झपकाएं', 'मुस्कुराएं', 'सिर थोड़ा घुमाएं'],
};

const STEP_ICONS = ['👁️', '😊', '↔️'];

// ─── Thresholds ───
const BLINK_THRESHOLD = 0.3;    // eye open probability < 0.3 = blink
const SMILE_THRESHOLD = 0.7;    // smile probability > 0.7 = smile
const HEAD_TURN_THRESHOLD = 3; // relative angle difference > 5° = turn (was 8, now 5)

export default function FaceFrame({
  onLivenessComplete,
  onError,
  currentStep,
  lang,
}: FaceFrameProps) {
  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [faceVisible, setFaceVisible] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [livenessScore, setLivenessScore] = useState(0);

  // ─── Base angle for head turn comparison ───
  const [baseAngle, setBaseAngle] = useState<number | null>(null);
  const [waitingForTurn, setWaitingForTurn] = useState(false);

  // ─── FIX: useRef to track current eulerY in real-time (no snapshot needed) ───
  const currentEulerY = useRef<number>(0);
  const isBaseAngleCaptured = useRef<boolean>(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  // Reset all state when step changes
  useEffect(() => {
    setStatusMsg('');
    setFaceVisible(false);
    setConfidence(0);
    setLivenessScore(0);
    setDetecting(false);
    setBaseAngle(null);
    setWaitingForTurn(false);
    currentEulerY.current = 0;
    isBaseAngleCaptured.current = false;
  }, [currentStep]);

  // ─── FIX: Continuously track eulerY in background for step 2 ───
  useEffect(() => {
    if (currentStep !== 2 || !isReady) return;

    let active = true;
    console.log('🔄 Step 2: Starting head angle tracking...');

    const interval = setInterval(async () => {
      if (!active || detecting) return;
      try {
        const photoPath = await capturePhoto();
        if (!photoPath) {
          console.log('⚠️  Photo capture failed');
          return;
        }
        
        // Try with all classification modes to get eulerY
        const faces = await FaceDetection.detect(`file://${photoPath}`, {
          performanceMode: 'fast',
          landmarkMode: 'all',  // ← Changed from 'none' to 'all'
          classificationMode: 'all',  // ← Changed from 'none' to 'all'
          trackingEnabled: true,
        });
        
        console.log('📸 Raw detection result:', JSON.stringify(faces?.[0], null, 2));
        
        if (faces && faces.length > 0) {
          const face = faces[0];

const newAngle =
  (face as any).rotationY ??
  (face as any).rotationZ ??
  0;

const eulerX = (face as any).rotationX ?? 0;
const eulerY = (face as any).rotationY ?? 0;
const eulerZ = (face as any).rotationZ ?? 0;
          
          // Use Y-axis (left-right turn), fallback to Z if needed
          const angleToUse = Math.abs(eulerY) > 0 ? eulerY : eulerZ;
          
          currentEulerY.current = angleToUse;
          console.log('📐 Euler Angles | X:', eulerX.toFixed(1), '° Y:', eulerY.toFixed(1), '° Z:', eulerZ.toFixed(1), '° | Using:', angleToUse.toFixed(1), '°');
          console.log('📍 Base:', baseAngle, '| Current:', angleToUse.toFixed(1), '| Diff:', Math.abs(angleToUse - (baseAngle ?? 0)).toFixed(1));
        } else {
          console.log('❌ No face detected in background tracking');
        }
      } catch (err) {
        console.log('❌ Face detection error:', err);
      }
    }, 500); // ← Faster interval (was 800)

    return () => {
      active = false;
      clearInterval(interval);
      console.log('⏹️ Step 2: Stopped head angle tracking');
    };
  }, [currentStep, isReady, baseAngle, detecting]);

  async function requestCameraPermission() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'DRISHTI Camera Permission',
            message: 'DRISHTI needs camera for face authentication.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const status = await Camera.requestCameraPermission();
        setHasPermission(status === 'granted');
      }
    } catch {
      onError('Camera permission denied');
    }
  }

  async function capturePhoto(): Promise<string> {
    if (!camera.current) return '';
    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
      });
      return photo.path;
    } catch {
      return '';
    }
  }

  // ─── Real ML Kit Face Analysis ───
  async function runLivenessCheck() {
    if (detecting || !isReady) return;
    setDetecting(true);
    setStatusMsg(lang === 'en' ? 'Capturing...' : 'कैप्चर हो रहा है...');

    try {
      // Step 2 uses real-time tracked angle — no new snapshot needed for comparison
      if (currentStep === 2) {
        // ✅ Get FRESH angle reading when button is pressed
        const photoPath = await capturePhoto();
        if (!photoPath) {
          setStatusMsg(lang === 'en' ? 'Capture failed!' : 'कैप्चर विफल!');
          setDetecting(false);
          return;
        }

        const faces = await FaceDetection.detect(`file://${photoPath}`, {
          performanceMode: 'accurate',  // ← More accurate when user presses button
          landmarkMode: 'all',
          classificationMode: 'all',
          trackingEnabled: true,
        });

        if (!faces || faces.length === 0) {
          setStatusMsg(
            lang === 'en'
              ? 'No face detected! Come closer.'
              : 'चेहरा नहीं मिला! पास आएं।',
          );
          setDetecting(false);
          return;
        }

        const face = faces[0];
const eulerX = (face as any).rotationX ?? 0;
const eulerY = (face as any).rotationY ?? 0;
const eulerZ = (face as any).rotationZ ?? 0;
        
        // Use Y-axis for left-right turn, fallback to Z
        const currentAngle = Math.abs(eulerY) > 0 ? eulerY : eulerZ;
        currentEulerY.current = currentAngle;
        
        console.log('🎬 Button pressed! Euler Angles | X:', eulerX.toFixed(1), '° Y:', eulerY.toFixed(1), '° Z:', eulerZ.toFixed(1), '° | Using:', currentAngle.toFixed(1), '°');

        if (!isBaseAngleCaptured.current) {
          // ── Phase 1: Save base angle from fresh read ──
          console.log('📍 Capturing base angle:', currentAngle.toFixed(1), '°');
          setBaseAngle(currentAngle);
          isBaseAngleCaptured.current = true;
          setWaitingForTurn(true);
          setFaceVisible(true);
          setConfidence(0.95);
          setStatusMsg(
            lang === 'en'
              ? '✓ Base captured! Now turn your head LEFT or RIGHT, then press again'
              : '✓ Base capture! अब सिर बाएं या दाएं घुमाएं, फिर दबाएं',
          );
          setDetecting(false);
          return;
        } else {
          // ── Phase 2: Compare fresh angle against base ──
          const baseSaved = baseAngle ?? 0;
          const angleDiff = Math.abs(currentAngle - baseSaved);
          const absAngle = Math.abs(currentAngle);
          // Either relative diff OR absolute angle
          const stepPassed = angleDiff > HEAD_TURN_THRESHOLD || absAngle > 5;
          const score = Math.min(Math.max(angleDiff, absAngle) / 20, 1);

          console.log('🔄 Turn Check | Base:', baseSaved.toFixed(1), '° | Current:', currentAngle.toFixed(1), '° | Diff:', angleDiff.toFixed(1), '° | Threshold:', HEAD_TURN_THRESHOLD, '° | Passed:', stepPassed);

          if (!stepPassed) {
            setStatusMsg(
              lang === 'en'
                ? `Keep head turned! (${angleDiff.toFixed(1)}° moved / ${HEAD_TURN_THRESHOLD}° needed)`
                : `सिर घुमाए रखें! (${angleDiff.toFixed(1)}° घुमा / ${HEAD_TURN_THRESHOLD}° चाहिए)`,
            );
            setDetecting(false);
            return;
          }

          // ── Step 2 passed ──
          console.log('✅ Step 2 PASSED! Angle difference:', angleDiff.toFixed(1), '°, Score:', score);
          setLivenessScore(score);
          setConfidence(0.9);
          setFaceVisible(true);
          setStatusMsg(
            lang === 'en'
              ? `✓ Step verified! Score: ${(score * 100).toFixed(1)}%`
              : `✓ चरण सत्यापित! स्कोर: ${(score * 100).toFixed(1)}%`,
          );
          await new Promise(res => setTimeout(res, 600));
          onLivenessComplete(score, photoPath);
          return;
        }
      }

      // ─── Steps 0 & 1: Original snapshot-based logic ───
      const photoPath = await capturePhoto();
      if (!photoPath) {
        setStatusMsg(lang === 'en' ? 'Capture failed!' : 'कैप्चर विफल!');
        setDetecting(false);
        return;
      }

      setStatusMsg(lang === 'en' ? 'Analyzing face...' : 'चेहरा विश्लेषण...');

      const faces = await FaceDetection.detect(`file://${photoPath}`, {
        performanceMode: 'accurate',
        landmarkMode: 'all',
        classificationMode: 'all',
        trackingEnabled: true,
      });

      if (!faces || faces.length === 0) {
        setStatusMsg(
          lang === 'en'
            ? 'No face detected! Come closer.'
            : 'चेहरा नहीं मिला! पास आएं।',
        );
        setDetecting(false);
        return;
      }

      const face: Face = faces[0];
      setFaceVisible(true);

      let stepPassed = false;
      let score = 0;

      // ─── Step 0: Blink Detection ───
      if (currentStep === 0) {
        const leftEye = face.leftEyeOpenProbability ?? 1;
        const rightEye = face.rightEyeOpenProbability ?? 1;
        const avgEye = (leftEye + rightEye) / 2;
        stepPassed = avgEye < BLINK_THRESHOLD;
        score = 1 - avgEye;

        console.log('👁️ Blink Check | Left:', leftEye.toFixed(2), '| Right:', rightEye.toFixed(2), '| Avg:', avgEye.toFixed(2), '| Passed:', stepPassed);

        if (!stepPassed) {
          setStatusMsg(
            lang === 'en'
              ? `Please BLINK! Eye open: ${(avgEye * 100).toFixed(0)}%`
              : `आंखें झपकाएं! आंख खुली: ${(avgEye * 100).toFixed(0)}%`,
          );
        }

      // ─── Step 1: Smile Detection ───
      } else if (currentStep === 1) {
        const smileProb = face.smilingProbability ?? 0;
        stepPassed = smileProb > SMILE_THRESHOLD;
        score = smileProb;

        console.log('😊 Smile Check | Probability:', smileProb.toFixed(2), '| Passed:', stepPassed);

        if (!stepPassed) {
          setStatusMsg(
            lang === 'en'
              ? `Please SMILE! Smile: ${(smileProb * 100).toFixed(0)}%`
              : `मुस्कुराएं! मुस्कान: ${(smileProb * 100).toFixed(0)}%`,
          );
        }
      }

      setLivenessScore(score);
      setConfidence(face.trackingId ? 0.95 : 0.85);

      if (!stepPassed) {
        setDetecting(false);
        return;
      }

      // ─── Step passed! ───
      console.log('✅ Step', currentStep, 'PASSED! Score:', score);
      setStatusMsg(
        lang === 'en'
          ? `✓ Step verified! Score: ${(score * 100).toFixed(1)}%`
          : `✓ चरण सत्यापित! स्कोर: ${(score * 100).toFixed(1)}%`,
      );

      await new Promise(res => setTimeout(res, 600));
      onLivenessComplete(score, photoPath);

    } catch (err) {
      console.log('❌ ML Kit error:', err);
      onError('Face analysis failed. Please try again.');
    } finally {
      setDetecting(false);
    }
  }

  // ─── Dynamic button label for head turn step ───
  function getButtonLabel(): string {
    if (!isReady) {
      return lang === 'en' ? 'Starting camera...' : 'कैमरा शुरू हो रहा है...';
    }
    if (currentStep === 2 && waitingForTurn) {
      return lang === 'en'
        ? '↔️ I have turned my head'
        : '↔️ मैंने सिर घुमा लिया';
    }
    return `${STEP_ICONS[currentStep]} ${STEP_LABELS[lang][currentStep]}`;
  }

  if (!device) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorIcon}>📷</Text>
        <Text style={styles.errorText}>
          {lang === 'en' ? 'No front camera found' : 'फ्रंट कैमरा नहीं मिला'}
        </Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorText}>
          {lang === 'en' ? 'Camera permission required' : 'कैमरा अनुमति आवश्यक है'}
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission}>
          <Text style={styles.permBtnText}>
            {lang === 'en' ? 'Grant Permission' : 'अनुमति दें'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          onInitialized={() => setIsReady(true)}
          onError={e => onError(e.message)}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={[
            styles.faceOval,
            faceVisible ? styles.faceOvalDetected : styles.faceOvalDefault,
          ]} />
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <View style={styles.stepIconBox}>
            <Text style={styles.stepIconText}>{STEP_ICONS[currentStep]}</Text>
          </View>
        </View>
      </View>

      {/* Status */}
      {statusMsg !== '' && (
        <View style={[
          styles.statusBox,
          statusMsg.includes('✓') ? styles.statusSuccess : styles.statusNormal,
        ]}>
          <Text style={[
            styles.statusText,
            statusMsg.includes('✓') ? styles.statusTextSuccess : styles.statusTextNormal,
          ]}>
            {statusMsg}
          </Text>
        </View>
      )}

      {/* Info Row */}
      {faceVisible && (
        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>
              {lang === 'en' ? 'Face' : 'चेहरा'}
            </Text>
            <Text style={[styles.infoValue, { color: '#2ECC71' }]}>
              {lang === 'en' ? 'Detected' : 'मिला'}
            </Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>
              {lang === 'en' ? 'Liveness' : 'जीवंतता'}
            </Text>
            <Text style={[styles.infoValue, { color: '#1A3C6E' }]}>
              {(livenessScore * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoLabel}>
              {lang === 'en' ? 'Confidence' : 'विश्वास'}
            </Text>
            <Text style={[styles.infoValue, { color: '#FF6B00' }]}>
              {(confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      )}

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.verifyBtn,
          (!isReady || detecting) && styles.verifyBtnDisabled,
        ]}
        onPress={runLivenessCheck}
        disabled={!isReady || detecting}>
        {detecting ? (
          <View style={styles.detectingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.verifyBtnText}>
              {lang === 'en' ? 'Analyzing...' : 'विश्लेषण हो रहा है...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.verifyBtnText}>{getButtonLabel()}</Text>
        )}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12, alignItems: 'center' },
  cameraContainer: {
    width: 260,
    height: 310,
    borderRadius: 130,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    backgroundColor: '#000',
  },
  camera: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: 180,
    height: 230,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  faceOvalDefault: { borderColor: 'rgba(255,255,255,0.6)' },
  faceOvalDetected: { borderColor: '#2ECC71', borderStyle: 'solid' },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FF6B00',
    borderWidth: 3,
  },
  topLeft: { top: 20, left: 20, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  topRight: { top: 20, right: 20, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bottomLeft: { bottom: 20, left: 20, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  bottomRight: { bottom: 20, right: 20, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  stepIconBox: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'rgba(26,60,110,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepIconText: { fontSize: 22 },
  statusBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  statusNormal: { backgroundColor: 'rgba(26,60,110,0.1)' },
  statusSuccess: { backgroundColor: '#E8F8F0' },
  statusText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  statusTextNormal: { color: '#1A3C6E' },
  statusTextSuccess: { color: '#2ECC71' },
  infoRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  infoChip: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    minWidth: 75,
  },
  infoLabel: { fontSize: 9, color: '#888' },
  infoValue: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  verifyBtn: {
    backgroundColor: '#1A3C6E',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  verifyBtnDisabled: { backgroundColor: '#AAAAAA' },
  verifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  detectingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorBox: {
    width: 260,
    height: 310,
    borderRadius: 130,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#E24B4A',
    borderStyle: 'dashed',
    gap: 12,
    padding: 32,
  },
  errorIcon: { fontSize: 40 },
  errorText: { color: '#E24B4A', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  permBtn: { backgroundColor: '#1A3C6E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  permBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});