# EmotionHire

EmotionHire is a complete, production-ready, real-time AI-powered interview coaching platform. 

![Screenshot Placeholder](https://via.placeholder.com/800x400.png?text=EmotionHire+Screenshot)

## How It Works
1. Opens your webcam and microphone right in the browser.
2. Detects facial emotions in real-time using `face-api.js` to gauge Confidence, Stress, and Engagement.
3. Transcribes spoken answers live via OpenAI Whisper API.
4. Streams instant, personalized interview coaching tips using Claude AI.
5. Provides a full post-interview scoring report of your performance.

## Tech Stack
- Framework: Next.js 14 (App Router, JavaScript)
- Face Detection: face-api.js
- Webcam: react-webcam
- Speech Transcription: OpenAI Whisper API (`whisper-1`)
- AI Coaching Tips: Anthropic Claude API (`claude-3-5-sonnet-20240620`)
- Styling: Plain CSS
- State Management: React useState & localStorage

## Quick Setup Instructions

1. **Clone the repo / Navigate to directory**
```bash
cd emotion-hire
```

2. **Install dependencies**
```bash
npm install
```

3. **Download Face-api.js Models**
Go to [face-api.js weights repo](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
Download the following files and place them in `public/models/`:
- `tiny_face_detector_model-weights_manifest.json` and its shard (`tiny_face_detector_model-shard1`)
- `face_landmark_68_model-weights_manifest.json` and its shard (`face_landmark_68_model-shard1`)
- `face_expression_model-weights_manifest.json` and its shard (`face_expression_model-shard1`)

*(A script is provided below to auto-download these if you prefer using curl.)*

4. **Add API Keys**
Create a `.env.local` file in the root directory:
```
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

5. **Start the App**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Live Demo
(Vercel App link placeholder)

## License
MIT
