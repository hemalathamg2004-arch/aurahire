/**
 * Client utility to connect Next.js frontend to the FastAPI + LangGraph backend.
 */

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

export async function uploadResumeToBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${FASTAPI_BASE_URL}/api/resumes/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to upload resume to FastAPI backend');
  }

  return await res.json();
}

export async function matchJobWithBackend(jobDescription, candidateId = 1) {
  const res = await fetch(`${FASTAPI_BASE_URL}/api/jobs/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_description: jobDescription,
      candidate_id: candidateId,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Job matching failed');
  }

  return await res.json();
}

export async function startAIInterview(jobTitle, totalQuestions = 3, candidateId = 1) {
  const res = await fetch(`${FASTAPI_BASE_URL}/api/interviews/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: candidateId,
      job_title: jobTitle,
      total_questions: totalQuestions,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to start AI interview');
  }

  return await res.json();
}

export async function submitAIInterviewAnswer(interviewId, questionIndex, userAnswer) {
  const res = await fetch(`${FASTAPI_BASE_URL}/api/interviews/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interview_id: interviewId,
      question_index: questionIndex,
      user_answer: userAnswer,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit answer');
  }

  return await res.json();
}

export async function getAIInterviewReport(interviewId) {
  const res = await fetch(`${FASTAPI_BASE_URL}/api/interviews/${interviewId}/report`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to retrieve interview report');
  }

  return await res.json();
}
