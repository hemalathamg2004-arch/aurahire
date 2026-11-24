'use client';

// face-api.js must be loaded dynamically in browser only
let faceapi;

export async function loadModels() {
  if (typeof window === 'undefined') return;
  
  if (!faceapi) {
    faceapi = await import('face-api.js');
  }

  const MODEL_URL = '/models';
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    console.log("AuraHire face models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading face models:", error);
    return false;
  }
}

export async function detectEmotions(videoElement) {
  if (typeof window === 'undefined' || !faceapi || !videoElement) return null;

  const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
  
  const detections = await faceapi
    .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  if (!detections) return null;

  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  const expr = resizedDetections.expressions;
  
  // --- Eye Contact Score ---
  // Uses nose tip position (landmark 30) relative to frame center
  const landmarks = resizedDetections.landmarks.positions;
  const noseTip = landmarks[30];
  const centerX = displaySize.width / 2;
  const centerY = displaySize.height / 2;
  const offsetX = Math.abs(noseTip.x - centerX);
  const offsetY = Math.abs(noseTip.y - centerY);
  const eyeContactScore = Math.max(0, Math.min(100, Math.round(100 - (offsetX * 0.4 + offsetY * 0.2))));

  // --- Dominant Emotion ---
  let dominant = 'neutral';
  let maxScore = 0;
  Object.entries(expr).forEach(([emotion, value]) => {
    if (value > maxScore) { maxScore = value; dominant = emotion; }
  });

  // -------------------------------------------------------------------
  // INTERVIEW-CALIBRATED SCORING MODEL
  //
  // In a professional interview, a person looks CALM and COMPOSED.
  // Their dominant expression will mostly be "neutral" with occasional
  // smiles ("happy"). Raw "happy" alone was causing 0% confidence for
  // well-performing candidates.
  //
  // New model:
  //   Confidence  = calm composure score (neutral + happy + subtle surprised, minus angry/sad/fearful)
  //   Engagement  = attentiveness proxy (high neutral + happy signals active listening)
  //   Stress      = negative affect indicator (fearful + angry + sad, capped at 100)
  // -------------------------------------------------------------------

  const positiveAffect = (expr.happy * 0.5) + (expr.neutral * 0.35) + (expr.surprised * 0.15);
  const negativeAffect = expr.fearful + expr.angry + expr.sad;

  // Confidence: high when candidate is calm/positive, penalized by negative affect
  const rawConfidence = (positiveAffect - negativeAffect * 0.5);
  // Remap from [0,1] range to a realistic interview range [55, 96]
  const confidence = Math.round(Math.min(96, Math.max(55, rawConfidence * 80 + 55)));

  // Engagement: primarily neutral+happy = attentive and present
  const rawEngagement = (expr.neutral * 0.60) + (expr.happy * 0.30) + (expr.surprised * 0.10);
  const engagement = Math.round(Math.min(95, Math.max(55, rawEngagement * 75 + 58)));

  // Stress: negative emotions only, scaled so normal interview nerves = ~20-30
  const stress = Math.round(Math.min(80, Math.max(5, negativeAffect * 100)));

  return {
    confidence,
    stress,
    engagement,
    angry: Math.round(expr.angry * 100),
    sad: Math.round(expr.sad * 100),
    dominant,
    eyeContact: eyeContactScore,
    box: resizedDetections.detection.box,
    raw: expr
  };
}
