'use client';

/**
 * Audio Recording helper for AuraHire
 * Sends chunks every 5 seconds for transcription
 */

export async function startRecording(onChunkReady) {
  if (typeof window === 'undefined') return null;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
    // Check supported mime types
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
      ? 'audio/webm' 
      : 'audio/mp4';

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // Convert Blob to File for API consumption
        const file = new File([event.data], `aura-chunk-${Date.now()}.webm`, {
          type: mimeType,
        });
        onChunkReady(file);
      }
    };

    // Start recording with 5-second intervals
    recorder.start(5000);

    return { recorder, stream };
  } catch (error) {
    console.error("Microphone access denied or audio recording error:", error);
    return null;
  }
}

export function stopRecording(session) {
  if (!session) return;
  const { recorder, stream } = session;
  
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop();
  }
  
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
