# Civic Aegis 🛡️
> **Autonomous, Hands-Free Civil Rights Assistant & Roadside De-escalation Copilot**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-civic--aegis.vercel.app-EF4444?style=for-the-badge&logo=vercel)](https://civic-aegis.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![Google Gemini 3.7 Flash](https://img.shields.io/badge/Google%20Gemini-3.7%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![React Native / Expo Web](https://img.shields.io/badge/Expo-v57.0-black?style=for-the-badge&logo=expo)](https://expo.dev/)

**Live Production Deployment:** [https://civic-aegis.vercel.app/](https://civic-aegis.vercel.app/)

---

## 📌 Overview

**Civic Aegis** is an offline-first, real-time civil rights and legal defense copilot designed for drivers during police traffic stops. Powered by **Google Gemini 3.7 Flash** and hands-free ambient audio streaming, Civic Aegis continuously evaluates roadside dialogue against active state statutes, coaches drivers on exact constitutional phrases to say aloud, and generates structured legal defense packages with synchronized audio recordings for post-incident attorney hand-off.

---

## ⚡ Key Capabilities

- **Real-Time Rights Coaching & Speech Prompter**: Continuously streams dialogue through the browser's Web Speech API and prompts concise, de-escalating constitutional responses (4th, 5th, and 6th Amendments) with real-time vocal audio readout.
- **Gemini 3.7 Flash Hardened Structured Outputs**: Uses strict `responseSchema` with explicit `propertyOrdering` and low temperature (`0.2`) to prevent model decoding loops and guarantee deterministically formatted legal assessments.
- **Offline-First Legal Evidence Exporter**: Bundles post-stop attorney briefs, audio recordings (base64-encoded `audio/webm`), and statutory violations into self-contained `CIVIC_AEGIS_EVIDENCE_[sessionId].json` packages persisted via client-side **IndexedDB**.
- **Continuous Speech Listener & Reconnection Loop**: Dual-engine compatibility (`SpeechRecognition` / `webkitSpeechRecognition`) with automated `onend` reconnection and non-fatal error recovery for uninterrupted ambient listening.
- **State-Specific Jurisdiction Engine**: Calibrated for statutory differences across California, Texas, Florida, New York, Georgia, Illinois, Washington, and General U.S. Federal law (including *Pennsylvania v. Mimms*, *Salinas v. Texas*, and *Terry v. Ohio*).
- **Absolute Non-Resistance & Safety Protocol**: Enforces hands-on-wheel safety cues and strictly non-escalatory, peaceful assertion of constitutional rights.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **AI Reasoning Engine** | **Google Gemini 3.7 Flash** | Real-time legal analysis, threat evaluation & structured defense briefs |
| **Structured Output** | **Google Cloud `responseSchema`** | Strict JSON schema enforcement with `propertyOrdering` |
| **Frontend Framework** | **React Native (Expo v57) / Expo Web** | Cross-platform ergonomic HUD with responsive dark aesthetic |
| **Speech Recognition** | **Web Speech API** | Hands-free continuous ambient audio transcription with live streaming |
| **Audio Capture** | **MediaRecorder & Expo AV** | High-fidelity microphone capture with in-app audio playback |
| **Offline Storage** | **IndexedDB & AsyncStorage** | Zero-latency local storage for incident checkpoints & evidence artifacts |
| **Vocal TTS Coaching** | **SpeechSynthesis API** | In-cabin audible rights readout and de-escalation coaching |

---

## 🤖 Google Gemini 3.7 Flash Integration

Civic Aegis integrates **Gemini 3.7 Flash** with strict JSON schema definitions to protect against decoding loops and token exhaustion:

```typescript
export const CIVIC_AEGIS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    threatLevel: {
      type: 'STRING',
      enum: ['LOW', 'ELEVATED', 'CRITICAL'],
    },
    activeRights: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    vocalScript: {
      type: 'STRING',
      description: 'Immediate non-escalatory statement for driver (Max 20 words)',
    },
    jurisdictionStatute: {
      type: 'STRING',
      description: 'State/federal statute or case law reference',
    },
    triggerEmergencyDispatch: {
      type: 'BOOLEAN',
    },
  },
  required: [
    'threatLevel',
    'activeRights',
    'vocalScript',
    'jurisdictionStatute',
    'triggerEmergencyDispatch',
  ],
  propertyOrdering: [
    'threatLevel',
    'activeRights',
    'vocalScript',
    'jurisdictionStatute',
    'triggerEmergencyDispatch',
  ],
};
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/mikeaknin/civic-aegis.git
cd civic-aegis
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Key (Optional)
Civic Aegis includes a zero-latency local fallback rule engine for offline operation. To activate cloud Gemini 3.7 Flash synthesis:
```bash
cp .env.example .env.local
# Add your Gemini API key:
# EXPO_PUBLIC_GEMINI_API_KEY="your_api_key_here"
```

### 4. Run the Application
```bash
# Start Web Development Server
npm run web

# Or with Expo CLI
npx expo start --web
```

Open [http://localhost:8081](http://localhost:8081) in your browser.

---

## 📄 Open-Source License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright (c) 2026 **mikeaknin**
