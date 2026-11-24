/**
 * AuraHire Subscription Manager
 * Manages Free vs Pro tier access via localStorage
 * 
 * FREE TIER:
 * - 3 interview sessions per month
 * - Basic emotion tracking
 * - Question Bank (generic only)
 * 
 * PRO TIER (₹499/month or ₹2999/year):
 * - Unlimited sessions
 * - AI Live Co-Pilot
 * - PDF Report Export
 * - JD-Based Custom Questions
 * - Company-Specific Prep
 * - 30-Day Challenge
 * - Priority AI tips
 * - Filler Word Heatmap
 * - Emotion Timeline Chart
 */

const PLAN_KEY = 'aurahire-plan';
const USAGE_KEY = 'aurahire-usage';
const FREE_SESSION_LIMIT = 3;

export const PLANS = {
  free: {
    name: 'Free',
    price: '₹0',
    badge: 'STARTER',
    color: 'var(--text-muted)',
    features: [
      '3 interview sessions / month',
      'Basic emotion tracking',
      'Question Bank (Generic)',
      'Session timer & WPM',
      'Basic transcript',
    ],
    locked: [
      'AI Live Co-Pilot',
      'PDF Report Export',
      'JD-Based Custom Questions',
      'Company Prep Mode',
      '30-Day Challenge',
      'Filler Word Heatmap',
      'Emotion Timeline Chart',
      'Posture Alerts',
    ]
  },
  pro_monthly: {
    name: 'Pro Monthly',
    price: '₹499',
    period: '/month',
    badge: 'PRO',
    color: 'var(--aura-purple)',
    features: [
      'Unlimited interview sessions',
      'AI Live Co-Pilot',
      'PDF Report Export',
      'JD-Based Custom Questions',
      'Company-Specific Prep',
      '30-Day Challenge',
      'Filler Word Heatmap',
      'Emotion Timeline Chart',
      'Posture Alerts',
      'Priority AI coaching',
      'Full analytics dashboard',
    ],
    locked: []
  },
  pro_yearly: {
    name: 'Pro Yearly',
    price: '₹2,999',
    period: '/year',
    badge: 'PRO',
    savings: 'Save ₹2,989',
    color: 'var(--hire-green)',
    features: [
      'Everything in Pro Monthly',
      '50% cheaper than monthly',
      'Early access to new features',
    ],
    locked: []
  }
};

// Features that require Pro
export const PRO_FEATURES = [
  'ai-copilot',
  'pdf-export',
  'jd-questions',
  'company-prep',
  '30-day-challenge',
  'filler-heatmap',
  'emotion-timeline',
  'posture-alerts',
  'unlimited-sessions',
];

export function getCurrentPlan() {
  if (typeof window === 'undefined') return 'free';
  const plan = localStorage.getItem(PLAN_KEY);
  
  if (!plan) return 'free';
  
  try {
    const parsed = JSON.parse(plan);
    // Check expiry
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      localStorage.removeItem(PLAN_KEY);
      return 'free';
    }
    return parsed.plan || 'free';
  } catch {
    return 'free';
  }
}

export function isPro() {
  // DEV OVERRIDE: Unlocking all features immediately as requested.
  // When you are ready to decide which features should be paid, we will restore the plan checks.
  return true;
  
  /* Original logic:
  const plan = getCurrentPlan();
  return plan === 'pro_monthly' || plan === 'pro_yearly';
  */
}

export function canAccessFeature(featureId) {
  if (isPro()) return true;
  return !PRO_FEATURES.includes(featureId);
}

export function getSessionsUsedThisMonth() {
  if (typeof window === 'undefined') return 0;
  
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-04"
    return usage[currentMonth] || 0;
  } catch {
    return 0;
  }
}

export function incrementSessionUsage() {
  if (typeof window === 'undefined') return;
  
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    const currentMonth = new Date().toISOString().slice(0, 7);
    usage[currentMonth] = (usage[currentMonth] || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch (e) {
    console.error('Usage tracking error:', e);
  }
}

export function canStartSession() {
  if (isPro()) return { allowed: true, remaining: Infinity };
  const used = getSessionsUsedThisMonth();
  const remaining = FREE_SESSION_LIMIT - used;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function activatePlan(planId) {
  if (typeof window === 'undefined') return false;
  
  const now = new Date();
  let expiresAt;
  
  if (planId === 'pro_monthly') {
    expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
  } else if (planId === 'pro_yearly') {
    expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
  } else {
    return false;
  }

  localStorage.setItem(PLAN_KEY, JSON.stringify({
    plan: planId,
    activatedAt: new Date().toISOString(),
    expiresAt
  }));

  return true;
}

export function deactivatePlan() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLAN_KEY);
}
