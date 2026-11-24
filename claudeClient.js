// This file helps call the local Next.js API route that wraps the Claude backend,
// rather than directly calling Anthropic from the client.

export async function analyseWithClaude(transcript, emotions) {
  try {
    const response = await fetch('/api/analyse-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcript, emotions })
    });

    if (!response.ok) {
      throw new Error(`Error calling Claude: ${response.statusText}`);
    }

    return response.body; // Returns a ReadableStream
  } catch (error) {
    console.error('Failed to analyze with Claude', error);
    return null;
  }
}
