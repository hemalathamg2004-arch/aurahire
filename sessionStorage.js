/**
 * Session storage manager for AuraHire
 * Stores up to 10 last sessions in localStorage
 * Each session has an ID and timestamp
 */

import { supabase } from './supabaseClient';

const KEY = 'aurahire-sessions';
const MAX_SESSIONS = 10;

export function saveSession(data) {
  if (typeof window === 'undefined') return;

  try {
    const sessions = getSessions();
    
    // Calculate holistic auraScore combining visual signals and speech quality:
    let auraScore = 0;
    
    // 1. Visual metrics (if available)
    const hasVisual = (data.avgConfidence > 0 || data.avgEngagement > 0 || data.avgEyeContact > 0);
    const visualScore = hasVisual 
      ? ((data.avgConfidence || 75) * 0.35) + ((data.avgEngagement || 80) * 0.35) + (((100 - (data.avgStress || 20))) * 0.15) + ((data.avgEyeContact || 85) * 0.15)
      : 82; // Baseline professional visual score if camera was in audio-only mode

    // 2. Speech & Content metrics (Pacing + Transcript depth)
    const wpm = data.avgWPM || 0;
    // Ideal WPM is between 110 and 150
    const paceScore = wpm === 0 ? 0 : (wpm >= 100 && wpm <= 160) ? 90 : (wpm > 60 ? 78 : 45);
    const transcriptLen = (data.transcript && data.transcript.length) || 0;
    const wordCount = (data.transcript && data.transcript.split(/\s+/).filter(Boolean).length) || 0;
    
    // Strict content scoring based on word count
    const contentScore = wordCount > 80 ? 92 : (wordCount > 30 ? 75 : (wordCount > 10 ? 45 : 15));

    // 3. Final weighted score
    if (hasVisual && transcriptLen > 30) {
      auraScore = Math.round((visualScore * 0.50) + (paceScore * 0.25) + (contentScore * 0.25));
    } else if (hasVisual) {
      // Heavily penalize having visual but barely any speech
      auraScore = Math.round((visualScore * 0.70) + (contentScore * 0.30));
    } else if (transcriptLen > 10) {
      auraScore = Math.round((paceScore * 0.50) + (contentScore * 0.50));
    } else {
      // True fallback for literally empty sessions (no camera + very few words)
      auraScore = 15;
    }

    // Clamp score realistically - no artificial high floor
    auraScore = Math.min(Math.max(auraScore, 10), 98);

    const newSession = {
      ...data,
      id: Date.now(),
      date: new Date().toISOString(),
      auraScore
    };

    sessions.unshift(newSession);
    const trimmedSessions = sessions.slice(0, MAX_SESSIONS);
    
    localStorage.setItem(KEY, JSON.stringify(trimmedSessions));
    console.log("AuraHire session saved securely to local cache:", newSession.id);

    // Sync session to Python/FastAPI SQLite Backend
    try {
      const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';
      const userStr = localStorage.getItem('aurahire-user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const candidateId = userObj?.user_id || 1;

      fetch(`${backendUrl}/api/interviews/save_session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': userObj?.token ? `Bearer ${userObj.token}` : ''
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          job_title: "Demo Frontend Role",
          auraScore: newSession.auraScore || 0,
          avgConfidence: newSession.avgConfidence || 0,
          avgEngagement: newSession.avgEngagement || 0,
          avgStress: newSession.avgStress || 0,
          avgEyeContact: newSession.avgEyeContact || 0,
          avgWPM: newSession.avgWPM || 0,
          transcript: newSession.transcript || ""
        })
      }).then(res => res.json())
        .then(data => console.log("AuraHire session securely synced to FastAPI SQLite DB:", data))
        .catch(err => console.error("FastAPI Backend Sync Failed:", err));
    } catch (e) {
      console.error("Failed to call backend", e);
    }

    return newSession;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn("localStorage full. Clearing oldest session.");
      const sessions = getSessions();
      sessions.pop();
      localStorage.setItem(KEY, JSON.stringify(sessions));
      return saveSession(data);
    }
    console.error("Error saving session:", error);
    return null;
  }
}

export function getSessions() {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading sessions:", error);
    return [];
  }
}

export function getLastSession() {
  const sessions = getSessions();
  return sessions.length > 0 ? sessions[0] : null;
}

export function clearSessions() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
