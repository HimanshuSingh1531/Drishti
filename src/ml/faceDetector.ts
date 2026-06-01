import { MODEL_CONFIG, PREPROCESS_CONFIG, LIGHTING_CONDITIONS } from './modelConfig';

// ─── Types ───
export interface FaceDetectionResult {
  faceDetected: boolean;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  landmarks: FaceLandmarks | null;
  lightingCondition: 'harshSunlight' | 'lowLight' | 'normal';
  processingTimeMs: number;
}

export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  leftMouth: { x: number; y: number };
  rightMouth: { x: number; y: number };
}

export interface LivenessResult {
  isLive: boolean;
  score: number;
  step: 'blink' | 'smile' | 'turn';
  stepCompleted: boolean;
  spoofDetected: boolean;
  processingTimeMs: number;
}

export interface FaceEmbedding {
  embedding: number[];
  normalized: number[];
  quality: number;
}

// ─── Detect Lighting Condition from pixel brightness ───
export function detectLightingCondition(
  avgBrightness: number,
): 'harshSunlight' | 'lowLight' | 'normal' {
  if (avgBrightness > 200) return 'harshSunlight';
  if (avgBrightness < 60) return 'lowLight';
  return 'normal';
}

// ─── Apply lighting correction ───
export function applyLightingCorrection(
  brightness: number,
  condition: 'harshSunlight' | 'lowLight' | 'normal',
): number {
  const config = LIGHTING_CONDITIONS[condition];
  return Math.min(255, Math.max(0, brightness + config.brightnessBoost * 255));
}

// ─── Normalize face embedding ───
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}

// ─── Cosine similarity between two embeddings ───
export function cosineSimilarity(emb1: number[], emb2: number[]): number {
  if (emb1.length !== emb2.length) return 0;
  const dotProduct = emb1.reduce((sum, val, i) => sum + val * emb2[i], 0);
  const mag1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

// ─── Check if two faces match ───
export function areFacesMatching(
  embedding1: number[],
  embedding2: number[],
): { match: boolean; similarity: number } {
  const similarity = cosineSimilarity(
    normalizeEmbedding(embedding1),
    normalizeEmbedding(embedding2),
  );
  return {
    match: similarity >= MODEL_CONFIG.faceRecognition.similarityThreshold,
    similarity: parseFloat(similarity.toFixed(4)),
  };
}

// ─── Simulate Face Detection ───
// Production: replace with actual TFLite inference via react-native-fast-tflite
export async function detectFace(
  imagePath: string,
): Promise<FaceDetectionResult> {
  const startTime = Date.now();

  // Simulate model inference
  await new Promise(res => setTimeout(res, 150));

  const confidence = 0.92 + Math.random() * 0.07;
  const avgBrightness = 100 + Math.random() * 100;
  const lightingCondition = detectLightingCondition(avgBrightness);

  const processingTimeMs = Date.now() - startTime;

  return {
    faceDetected: confidence > MODEL_CONFIG.faceDetection.scoreThreshold,
    confidence: parseFloat(confidence.toFixed(4)),
    boundingBox: {
      x: 20 + Math.random() * 10,
      y: 15 + Math.random() * 10,
      width: 80 + Math.random() * 20,
      height: 90 + Math.random() * 20,
    },
    landmarks: {
      leftEye: { x: 35, y: 40 },
      rightEye: { x: 65, y: 40 },
      nose: { x: 50, y: 55 },
      leftMouth: { x: 35, y: 70 },
      rightMouth: { x: 65, y: 70 },
    },
    lightingCondition,
    processingTimeMs,
  };
}

// ─── Simulate Liveness Detection ───
// Production: replace with TFLite liveness model
export async function detectLiveness(
  imagePath: string,
  step: 'blink' | 'smile' | 'turn',
): Promise<LivenessResult> {
  const startTime = Date.now();

  // Simulate model inference
  await new Promise(res => setTimeout(res, 200));

  const score = 0.88 + Math.random() * 0.11;
  const spoofScore = Math.random() * 0.3;
  const processingTimeMs = Date.now() - startTime;

  return {
    isLive: score >= MODEL_CONFIG.livenessDetection.livenessThreshold,
    score: parseFloat(score.toFixed(4)),
    step,
    stepCompleted: score >= MODEL_CONFIG.livenessDetection.livenessThreshold,
    spoofDetected: spoofScore > MODEL_CONFIG.livenessDetection.spoofThreshold,
    processingTimeMs,
  };
}

// ─── Generate Face Embedding ───
// Production: replace with MobileFaceNet TFLite inference
export async function generateFaceEmbedding(
  imagePath: string,
): Promise<FaceEmbedding> {
  // Simulate embedding generation
  await new Promise(res => setTimeout(res, 300));

  // 128-dimensional embedding (MobileFaceNet output size)
  const embedding = Array.from(
    { length: MODEL_CONFIG.faceRecognition.embeddingSize },
    () => (Math.random() - 0.5) * 2,
  );

  const normalized = normalizeEmbedding(embedding);
  const quality = 0.90 + Math.random() * 0.09;

  return {
    embedding,
    normalized,
    quality: parseFloat(quality.toFixed(4)),
  };
}

// ─── Full Pipeline: Detect + Liveness + Embedding ───
export async function runFullFacePipeline(
  imagePath: string,
  livenessStep: 'blink' | 'smile' | 'turn',
): Promise<{
  detection: FaceDetectionResult;
  liveness: LivenessResult;
  embedding: FaceEmbedding;
  totalTimeMs: number;
}> {
  const pipelineStart = Date.now();

  const [detection, liveness, embedding] = await Promise.all([
    detectFace(imagePath),
    detectLiveness(imagePath, livenessStep),
    generateFaceEmbedding(imagePath),
  ]);

  const totalTimeMs = Date.now() - pipelineStart;

  return {
    detection,
    liveness,
    embedding,
    totalTimeMs,
  };
}