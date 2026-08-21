# Civic Aegis — Product Requirement Document (PRD)

## Project Overview
Civic Aegis is an autonomous, hands-free civil rights assistant and roadside de-escalation platform for roadway traffic stops. It couples an ergonomic mobile HUD (Expo / React Native) with Google Gemini AI (`gemini-3.7-flash`) to process ambient interaction audio, provide live rights-aware suggested responses, speak coaching through device text-to-speech, record high-fidelity microphone audio, and generate structured legal artifacts for post-incident attorney hand-off.

## Tech Stack & Architecture
- **Core AI Engine:** Google Gemini (`gemini-3.7-flash`)
- **Speech Processing:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with interim streaming results
- **Audio Capture & Playback:** Universal `MediaRecorder` audio recording pipeline persisted in local storage with embedded playback
- **Vocal Coaching:** Real-time Text-to-Speech (`window.speechSynthesis`)
- **Frontend Framework:** Expo / React Native with Expo Router (Modern Dark Aesthetics)
- **Persistence:** Real-time `AsyncStorage` checkpoints surviving reloads and battery loss

## Mandatory Legal Safety & Non-Resistance Policy
- **LEGAL DISCLAIMER:** Civic Aegis provides general legal information, not formal legal advice.
- **ABSOLUTE NON-RESISTANCE:** The agent must NEVER instruct or encourage users to physically resist law enforcement, obstruct officers, disobey physical orders, or argue aggressively.
- **DE-ESCALATION FOCUS:** All suggested responses emphasize calm, polite, verbal assertions of constitutional rights (e.g., remaining silent, refusing optional searches, keeping hands visible on the steering wheel).
- **JURISDICTIONAL NOTICE:** Explicitly informs users of state-specific statutes (Stop & Identify, Audio Recording Consent, Vehicle Search Mandates).

## Architecture & Workflows
- **Mobile Telemetry HUD (Expo/React Native):** Zero-touch interface with Shield Mode ("I'm Being Pulled Over"), live transcript box, risk badge, de-escalation suggested response, one-tap scenario injections, and session history logs.
- **Live Rights Coach:** Background pipeline evaluating officer intent (routine stop, search request, order to exit vehicle, citation issuance) with immediate fallback classification.
- **Post-Incident Defense Synthesizer:** Generates comprehensive attorney defense briefs with key legal findings, urgency classification, and exportable markdown summaries.

## Data Schema: Lawyer Recommendation & Incident Payload
```json
{
  "shouldContactLawyer": boolean,
  "lawyerType": "Traffic Infraction Defense" | "Civil Rights Counsel" | "Criminal Defense Attorney",
  "urgency": "High" | "Medium" | "Low",
  "riskLevel": "High" | "Moderate" | "Low",
  "keyFindings": string[],
  "recommendedNextSteps": string[],
  "suggestedResponse": string,
  "legalDisclaimer": string
}
```
