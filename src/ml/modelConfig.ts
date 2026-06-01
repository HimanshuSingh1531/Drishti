// ─── TFLite Model Configuration for DRISHTI ───

export const MODEL_CONFIG = {
  // Face Detection Model
  faceDetection: {
    modelFile: 'face_detection_short.tflite',
    inputSize: 128,
    inputChannels: 3,
    scoreThreshold: 0.75,
    iouThreshold: 0.3,
    maxDetections: 1,
  },

  // Face Recognition Model (MobileFaceNet — ~2MB)
  faceRecognition: {
    modelFile: 'mobilefacenet.tflite',
    inputSize: 112,
    inputChannels: 3,
    embeddingSize: 128,
    similarityThreshold: 0.65,
  },

  // Liveness Detection Model
  livenessDetection: {
    modelFile: 'liveness_detector.tflite',
    inputSize: 64,
    inputChannels: 3,
    livenessThreshold: 0.85,
    spoofThreshold: 0.40,
  },
};

// ─── Model Size Targets (Hackathon requirement: <20MB total) ───
export const MODEL_SIZES = {
  faceDetection: '1.2 MB',
  faceRecognition: '2.0 MB',
  livenessDetection: '1.8 MB',
  total: '5.0 MB',
};

// ─── Preprocessing Config ───
export const PREPROCESS_CONFIG = {
  // Normalize pixel values to [-1, 1]
  mean: [127.5, 127.5, 127.5],
  std: [127.5, 127.5, 127.5],

  // Image augmentation for Indian lighting conditions
  brightnessRange: [-0.3, 0.3],
  contrastRange: [0.7, 1.3],
  flipHorizontal: true,
};

// ─── Performance Targets ───
export const PERFORMANCE_TARGETS = {
  maxInferenceTimeMs: 800,    // <1 sec total
  minAccuracy: 0.95,          // >95% accuracy
  minRAMmb: 3072,             // 3GB RAM minimum
  supportedAndroid: 8.0,
  supportedIOS: 12.0,
};

// ─── Supported Lighting Conditions ───
export const LIGHTING_CONDITIONS = {
  harshSunlight: {
    brightnessBoost: -0.2,
    contrastAdjust: 0.8,
  },
  lowLight: {
    brightnessBoost: 0.3,
    contrastAdjust: 1.3,
  },
  normal: {
    brightnessBoost: 0,
    contrastAdjust: 1.0,
  },
};

// ─── Indian Demographics Config ───
export const DEMOGRAPHICS_CONFIG = {
  skinToneRange: ['light', 'wheatish', 'medium', 'dark', 'very_dark'],
  ageRange: [18, 65],
  genderBalance: true,
  regionalVariance: true,
};