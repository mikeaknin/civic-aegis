# CivicAegis — Product Requirement Document (PRD)

## Project Overview
CivicAegis is a hands-free, real-time civil rights assistant and de-escalation platform for traffic stops. It couples a zero-touch mobile HUD (Expo / React Native) with autonomous backend agents (Google Cloud Agent Builder, Gemini 3.5, and Model Context Protocol) to process ambient interaction audio, provide live rights-aware suggested responses, and generate structured legal artifacts for post-incident attorney hand-off.

## Target Hackathon & Tech Stack Constraints
- **Hackathon:** All Things Agentic Hackathon (Devpost / Google Cloud)
- **Core AI Engine:** Gemini 3.5 & Google Cloud Agent Builder
- **Developer Tooling & Orchestration:** Google Antigravity 2.0 (Desktop Agent Manager, IDE Surface, Python SDK)
- **Integration Standard:** Model Context Protocol (MCP) for jurisdictional state legal code retrieval
- **Frontend Framework:** Expo / React Native with Expo Router (Dark Theme: #0F172A)

## Mandatory Legal Safety & Non-Resistance Policy
- **LEGAL DISCLAIMER:** CivicAegis provides general legal information, not formal legal advice.
- **ABSOLUTE NON-RESISTANCE:** The agent must NEVER instruct or encourage users to physically resist law enforcement, obstruct officers, disobey physical orders, or argue aggressively.
- **DE-ESCALATION FOCUS:** All suggested responses must emphasize calm, polite, verbal assertions of constitutional rights (e.g., remaining silent, refusing optional searches, keeping hands visible on the steering wheel).
- **JURISDICTIONAL NOTICE:** Explicitly notify users that traffic regulations and police procedures vary by state and municipality.

## Architecture & Agentic Workflow
- **Mobile Telemetry HUD (Expo/React Native):** Zero-touch interface running Shield Mode ('I'm Being Pulled Over'), live transcript box, risk badge, de-escalation suggested response, quick demo test triggers, and session history logs.
- **Ambient Audio Agent:** Asynchronous background worker analyzing live transcript chunks to evaluate officer intent (standard stop, search request, order to exit vehicle, citation issuance).
- **Legal MCP Agent:** Connects to Model Context Protocol (MCP) servers to fetch state-specific vehicle codes based on user location.
- **Post-Incident Defense Synthesizer:** Generates visual Antigravity Artifacts (Structured Incident Reports, Risk Breakdown Matrix, and Lawyer Briefs).

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
