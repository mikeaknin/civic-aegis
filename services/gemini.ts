/**
 * Civic Aegis - Google Gemini API Integration Service
 * Hardened Structured Output & Regression Defense for Gemini 3.7 Flash
 * 
 * Features:
 *  - Target Model: gemini-3.7-flash with responseMimeType: "application/json"
 *  - Strict responseSchema with explicit propertyOrdering to prevent decoding loops & token exhaustion
 *  - Configured temperature: 0.2 and maxOutputTokens: 1024
 *  - System instruction enforcing the Civic Aegis Legal Agent role
 *  - Defensive try...catch handling 400, 429, timeouts, and JSON decode failures
 *  - Deterministic client-side fallbacks matching exact schema structure
 */

import {
  LEGAL_DISCLAIMER,
  JURISDICTION_STATE_DATABASE,
} from '../constants/legalSafety';

export type ThreatLevel = 'LOW' | 'ELEVATED' | 'CRITICAL';

export interface CivicAegisHardenedAssessment {
  threatLevel: ThreatLevel;
  activeRights: string[];
  vocalScript: string;
  jurisdictionStatute: string;
  triggerEmergencyDispatch: boolean;
}

export interface GeminiLiveAnalysis {
  suggestedResponse: string;
  constitutionalBasis: string;
  riskLevel: 'ROUTINE' | 'MODERATE' | 'HIGH';
  actionInstruction: string;
  intent: string;
  reasoning: string;
  timestamp: number;
}

export interface StructuredLegalBrief {
  shouldContactLawyer: boolean;
  lawyerType: 'Traffic Infraction Defense' | 'Civil Rights Counsel' | 'Criminal Defense Attorney';
  urgency: 'High' | 'Medium' | 'Low';
  riskLevel: 'ROUTINE' | 'MODERATE' | 'HIGH';
  keyFindings: string[];
  recommendedDefenseSteps: string[];
  suggestedResponse: string;
  markdownBrief: string;
  legalDisclaimer: string;
}

/**
 * Deterministic Safe Default Response Object
 * Enforces exact schema structure when API/JSON parsing fails.
 */
export const DEFAULT_CIVIC_AEGIS_RESPONSE: CivicAegisHardenedAssessment = {
  threatLevel: 'LOW',
  activeRights: ['4th Amendment', '5th Amendment'],
  vocalScript: 'Officer, I am complying calmly and exercising my right to remain silent.',
  jurisdictionStatute: 'U.S. Const. amend. IV, V; Terry v. Ohio, 392 U.S. 1 (1968)',
  triggerEmergencyDispatch: false,
};

/**
 * Strict JSON Schema with explicit propertyOrdering to avoid Gemini 3.7 Flash decoding loop regressions
 */
export const CIVIC_AEGIS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    threatLevel: {
      type: 'STRING',
      enum: ['LOW', 'ELEVATED', 'CRITICAL'],
      description: 'Calculated threat level for driver safety and legal vulnerability.',
    },
    activeRights: {
      type: 'ARRAY',
      items: {
        type: 'STRING',
      },
      description: 'Applicable constitutional rights (e.g., 4th Amendment, 5th Amendment).',
    },
    vocalScript: {
      type: 'STRING',
      description: 'Immediate non-escalatory statement for the driver to say aloud (Max 20 words).',
    },
    jurisdictionStatute: {
      type: 'STRING',
      description: 'State or federal statute or landmark case law reference.',
    },
    triggerEmergencyDispatch: {
      type: 'BOOLEAN',
      description: 'Whether critical conditions require triggering emergency dispatch alert.',
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

/**
 * System Instructions for Civic Aegis Legal Agent
 */
export const CIVIC_AEGIS_SYSTEM_INSTRUCTION = {
  parts: [
    {
      text: `You are the Civic Aegis Legal Agent.
Your role is to evaluate raw ambient speech fragments from roadside police encounters against active state and federal legal statutes.
Provide immediate, non-escalatory, constitutional defense guidance.
INSTRUCTIONS:
1. Always prioritize peaceful de-escalation and driver safety. Never advocate physical resistance.
2. Provide a concise vocal script of at most 20 words that the driver can read aloud calmly.
3. Forbid repeating numeric indices or redundant string keys in your response.
4. Output must strictly conform to the declared responseSchema.`,
    },
  ],
};

/**
 * Deterministic Local Fallback Engine
 * Generates an instant, zero-latency schema-compliant response based on keyword analysis.
 */
export function generateDeterministicHardenedResponse(
  transcript: string,
  jurisdictionState: string = 'General U.S.'
): CivicAegisHardenedAssessment {
  const text = transcript.toLowerCase();
  const stateCode = jurisdictionState.length === 2 ? jurisdictionState : 'CA';
  const stateData = JURISDICTION_STATE_DATABASE[stateCode] || JURISDICTION_STATE_DATABASE['CA'];

  // CRITICAL / SEARCH / PROBE: Search requests, opening trunk/glove box, odor, weapons
  if (
    text.includes('search') ||
    text.includes('look inside') ||
    text.includes('open your trunk') ||
    text.includes('open the trunk') ||
    text.includes('look in your glove') ||
    text.includes('mind if i look') ||
    text.includes('anything in the car') ||
    text.includes('smell marijuana') ||
    text.includes('smell alcohol') ||
    text.includes('weapons or drugs') ||
    text.includes('illegal')
  ) {
    return {
      threatLevel: 'CRITICAL',
      activeRights: ['4th Amendment', 'Article I Search Protections'],
      vocalScript: 'Officer, I do not consent to any searches of my vehicle, person, or belongings.',
      jurisdictionStatute: `${stateData.stateName} Search & Seizure Stat. / U.S. Const. amend. IV`,
      triggerEmergencyDispatch: false,
    };
  }

  // CRITICAL: Compulsory vehicle exit orders (Pennsylvania v. Mimms)
  if (
    text.includes('step out') ||
    text.includes('get out of the car') ||
    text.includes('exit the vehicle') ||
    text.includes('get out') ||
    text.includes('out of the car')
  ) {
    return {
      threatLevel: 'CRITICAL',
      activeRights: ['4th Amendment', 'Pennsylvania v. Mimms (1977)'],
      vocalScript: 'I am complying with your exit order, but I do not consent to any searches.',
      jurisdictionStatute: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
      triggerEmergencyDispatch: false,
    };
  }

  // ELEVATED: Field sobriety probing / Interrogation / Alcohol questions
  if (
    text.includes('field sobriety') ||
    text.includes('how much have you had') ||
    text.includes('been drinking') ||
    text.includes('where are you coming from') ||
    text.includes('where are you going') ||
    text.includes('why were you speeding') ||
    text.includes('do you know how fast')
  ) {
    return {
      threatLevel: 'ELEVATED',
      activeRights: ['5th Amendment', 'Right to Remain Silent'],
      vocalScript: 'Officer, with all respect, I am exercising my Fifth Amendment right to remain silent.',
      jurisdictionStatute: 'U.S. Const. amend. V / Salinas v. Texas, 570 U.S. 178 (2013)',
      triggerEmergencyDispatch: false,
    };
  }

  // ELEVATED: Speeding citation / Ticket signing
  if (
    text.includes('ticket') ||
    text.includes('citation') ||
    text.includes('sign here') ||
    text.includes('court date')
  ) {
    return {
      threatLevel: 'ELEVATED',
      activeRights: ['Due Process', 'Statutory Appearance Receipt'],
      vocalScript: 'Understood Officer. I am signing this only as a receipt and promise to appear.',
      jurisdictionStatute: `${stateData.stateName} Vehicle Code § Statutory Citation Procedures`,
      triggerEmergencyDispatch: false,
    };
  }

  // LOW: Mandatory ID / Registration check
  if (
    text.includes('license') ||
    text.includes('registration') ||
    text.includes('insurance') ||
    text.includes('pulled you over') ||
    text.includes('tail light')
  ) {
    return {
      threatLevel: 'LOW',
      activeRights: ['Mandatory Driver Verification'],
      vocalScript: 'Officer, my documents are in the vehicle. I am reaching for them now calmly.',
      jurisdictionStatute: `${stateData.stateName} Mandatory Driver Identification Statute`,
      triggerEmergencyDispatch: false,
    };
  }

  // DEFAULT / LOW
  return {
    threatLevel: 'LOW',
    activeRights: ['4th Amendment', '5th Amendment'],
    vocalScript: 'Good day Officer. How can I help you today?',
    jurisdictionStatute: 'U.S. Const. amend. IV, V; Terry v. Ohio, 392 U.S. 1 (1968)',
    triggerEmergencyDispatch: false,
  };
}

/**
 * Legacy Adapter for Local Fallback Analysis
 */
export function generateLocalFallbackAnalysis(
  transcript: string,
  jurisdictionState: string = 'General U.S.'
): GeminiLiveAnalysis {
  const hardened = generateDeterministicHardenedResponse(transcript, jurisdictionState);
  return mapHardenedToLegacyAnalysis(hardened);
}

/**
 * Hardened Gemini 3.7 Flash Evaluation Service
 * Evaluates raw ambient speech fragments against active state legal statutes
 * with full resilience against 400/429 and JSON decoding loop regressions.
 */
export async function evaluateAmbientSpeechWithGemini(
  transcript: string,
  jurisdictionState: string = 'General U.S.',
  customApiKey?: string
): Promise<CivicAegisHardenedAssessment> {
  const fallback = generateDeterministicHardenedResponse(transcript, jurisdictionState);

  const apiKey =
    customApiKey?.trim() ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY : '');

  if (!apiKey || apiKey.trim() === '' || transcript.trim().length === 0) {
    return fallback;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = setTimeout(() => controller?.abort(), 3500);

  try {
    const prompt = `Evaluate the following ambient traffic stop dialogue under ${jurisdictionState} statutory and constitutional law:

RAW AMBIENT TRANSCRIPT:
"""
${transcript}
"""

Evaluate threat level, active rights, concise vocal script (max 20 words), relevant jurisdiction statute, and whether emergency dispatch is warranted.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: CIVIC_AEGIS_SYSTEM_INSTRUCTION,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CIVIC_AEGIS_RESPONSE_SCHEMA,
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
        signal: controller?.signal,
      }
    );

    clearTimeout(timeoutId);

    // Gracefully handle HTTP 400, 429, or 500 status errors
    if (!response.ok) {
      console.warn(`[Gemini API] Request failed with HTTP status: ${response.status}`);
      return fallback;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || typeof rawText !== 'string') {
      return fallback;
    }

    // Defensive JSON parse
    const parsed = JSON.parse(rawText);

    // Validate and sanitize parsed schema properties
    const validThreatLevels: ThreatLevel[] = ['LOW', 'ELEVATED', 'CRITICAL'];
    const threatLevel: ThreatLevel = validThreatLevels.includes(parsed.threatLevel)
      ? parsed.threatLevel
      : fallback.threatLevel;

    const activeRights: string[] =
      Array.isArray(parsed.activeRights) && parsed.activeRights.length > 0
        ? parsed.activeRights.filter((r: unknown) => typeof r === 'string' && r.trim().length > 0)
        : fallback.activeRights;

    const vocalScript: string =
      typeof parsed.vocalScript === 'string' && parsed.vocalScript.trim().length > 0
        ? parsed.vocalScript.trim()
        : fallback.vocalScript;

    const jurisdictionStatute: string =
      typeof parsed.jurisdictionStatute === 'string' && parsed.jurisdictionStatute.trim().length > 0
        ? parsed.jurisdictionStatute.trim()
        : fallback.jurisdictionStatute;

    const triggerEmergencyDispatch: boolean =
      typeof parsed.triggerEmergencyDispatch === 'boolean'
        ? parsed.triggerEmergencyDispatch
        : fallback.triggerEmergencyDispatch;

    return {
      threatLevel,
      activeRights: activeRights.length > 0 ? activeRights : fallback.activeRights,
      vocalScript,
      jurisdictionStatute,
      triggerEmergencyDispatch,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[Gemini Service] Defensive catch triggered:', error);
    return fallback;
  }
}

/**
 * Maps CivicAegisHardenedAssessment into GeminiLiveAnalysis structure
 */
function mapHardenedToLegacyAnalysis(hardened: CivicAegisHardenedAssessment): GeminiLiveAnalysis {
  const legacyRisk: 'ROUTINE' | 'MODERATE' | 'HIGH' =
    hardened.threatLevel === 'CRITICAL'
      ? 'HIGH'
      : hardened.threatLevel === 'ELEVATED'
      ? 'MODERATE'
      : 'ROUTINE';

  const actionInstruction =
    hardened.threatLevel === 'CRITICAL'
      ? 'Keep both hands visible on steering wheel at 10 and 2. Do not physically resist.'
      : hardened.threatLevel === 'ELEVATED'
      ? 'Remain polite and composed. Provide required documents without answering investigatory questions.'
      : 'Maintain a calm and respectful posture. Roll window halfway down.';

  return {
    suggestedResponse: hardened.vocalScript,
    constitutionalBasis: `${hardened.activeRights.join(', ')} • ${hardened.jurisdictionStatute}`,
    riskLevel: legacyRisk,
    actionInstruction,
    intent: `${hardened.threatLevel} Priority Encounter Assessment`,
    reasoning: `Identified active rights: ${hardened.activeRights.join(', ')} under ${hardened.jurisdictionStatute}.`,
    timestamp: Date.now(),
  };
}

/**
 * Main Analysis Bridge for Real-time Speech Categorization
 */
export async function analyzeWithGemini(
  transcript: string,
  jurisdictionState: string = 'General U.S.',
  customApiKey?: string
): Promise<GeminiLiveAnalysis> {
  const hardened = await evaluateAmbientSpeechWithGemini(
    transcript,
    jurisdictionState,
    customApiKey
  );
  return mapHardenedToLegacyAnalysis(hardened);
}

/**
 * Structured Attorney Hand-Off Defense Brief Schema
 */
const ATTORNEY_BRIEF_SCHEMA = {
  type: 'OBJECT',
  properties: {
    shouldContactLawyer: {
      type: 'BOOLEAN',
      description: 'Whether post-stop legal counsel is recommended.',
    },
    lawyerType: {
      type: 'STRING',
      enum: ['Traffic Infraction Defense', 'Civil Rights Counsel', 'Criminal Defense Attorney'],
      description: 'Recommended legal specialty.',
    },
    urgency: {
      type: 'STRING',
      enum: ['High', 'Medium', 'Low'],
      description: 'Urgency level for attorney consultation.',
    },
    riskLevel: {
      type: 'STRING',
      enum: ['ROUTINE', 'MODERATE', 'HIGH'],
      description: 'Overall risk assessment of the stop.',
    },
    keyFindings: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Synthesized legal and procedural findings.',
    },
    recommendedDefenseSteps: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Actionable legal defense steps.',
    },
  },
  required: [
    'shouldContactLawyer',
    'lawyerType',
    'urgency',
    'riskLevel',
    'keyFindings',
    'recommendedDefenseSteps',
  ],
  propertyOrdering: [
    'shouldContactLawyer',
    'lawyerType',
    'urgency',
    'riskLevel',
    'keyFindings',
    'recommendedDefenseSteps',
  ],
};

/**
 * Generate Structured Attorney Hand-Off Defense Brief using gemini-3.7-flash
 * with zero-latency local fallback and defensive error handling.
 */
export async function generateStructuredLegalReport(
  transcript: string,
  entries: any[] = [],
  jurisdictionState: string = 'General U.S.',
  customApiKey?: string
): Promise<StructuredLegalBrief> {
  const text = transcript.toLowerCase();
  const hasSearch = text.includes('search') || text.includes('trunk') || text.includes('glove');
  const hasExit = text.includes('step out') || text.includes('get out') || text.includes('exit');
  const hasDUI = text.includes('drinking') || text.includes('sobriety') || text.includes('alcohol');
  const hasTicket = text.includes('ticket') || text.includes('citation') || text.includes('speeding');

  let defaultRiskLevel: 'ROUTINE' | 'MODERATE' | 'HIGH' = 'ROUTINE';
  let defaultUrgency: 'High' | 'Medium' | 'Low' = 'Low';
  let defaultShouldContactLawyer = false;
  let defaultLawyerType: 'Traffic Infraction Defense' | 'Civil Rights Counsel' | 'Criminal Defense Attorney' =
    'Traffic Infraction Defense';
  const defaultKeyFindings: string[] = [];
  const defaultRecommendedSteps: string[] = [];

  if (hasSearch || hasExit) {
    defaultRiskLevel = 'HIGH';
    defaultUrgency = 'High';
    defaultShouldContactLawyer = true;
    defaultLawyerType = hasSearch ? 'Civil Rights Counsel' : 'Criminal Defense Attorney';
    defaultKeyFindings.push('Potential 4th Amendment search inquiry or compulsory vehicle exit order initiated.');
    defaultKeyFindings.push(`Encounter evaluated under ${jurisdictionState} statutory procedures.`);
    defaultRecommendedSteps.push('Preserve all unedited audio, video, and Civic Aegis transcript logs.');
    defaultRecommendedSteps.push('Schedule an expedited consultation with defense / civil rights counsel.');
    defaultRecommendedSteps.push('Request body-worn camera (BWC) and dashcam footage during discovery.');
  } else if (hasDUI) {
    defaultRiskLevel = 'HIGH';
    defaultUrgency = 'High';
    defaultShouldContactLawyer = true;
    defaultLawyerType = 'Criminal Defense Attorney';
    defaultKeyFindings.push('Interaction involved DUI or field sobriety exploratory questioning.');
    defaultKeyFindings.push('Administrative license suspension timelines may apply.');
    defaultRecommendedSteps.push('Contact a DUI / criminal defense attorney immediately to protect license privileges.');
    defaultRecommendedSteps.push('Decline to provide voluntary follow-up statements without counsel.');
  } else if (hasTicket) {
    defaultRiskLevel = 'MODERATE';
    defaultUrgency = 'Medium';
    defaultShouldContactLawyer = true;
    defaultLawyerType = 'Traffic Infraction Defense';
    defaultKeyFindings.push(`Traffic citation issued under ${jurisdictionState} speed regulation laws.`);
    defaultKeyFindings.push('Signing citation is a promise to appear, not an admission of guilt.');
    defaultRecommendedSteps.push('Review the mandatory court appearance date on the physical ticket.');
    defaultRecommendedSteps.push('Consult a traffic attorney regarding traffic school or dismissal options.');
  } else {
    defaultRiskLevel = 'ROUTINE';
    defaultUrgency = 'Low';
    defaultShouldContactLawyer = false;
    defaultKeyFindings.push('Routine verification stop resolved without citation or compulsory search.');
    defaultRecommendedSteps.push('Archive this stop report in your personal records.');
  }

  let finalShouldContactLawyer = defaultShouldContactLawyer;
  let finalLawyerType = defaultLawyerType;
  let finalUrgency = defaultUrgency;
  let finalRiskLevel = defaultRiskLevel;
  let finalKeyFindings = defaultKeyFindings;
  let finalRecommendedSteps = defaultRecommendedSteps;

  const apiKey =
    customApiKey?.trim() ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY : '');

  // Attempt gemini-3.7-flash synthesis if API key is available
  if (apiKey && apiKey.trim() !== '' && transcript.trim().length > 0) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), 5000);

    try {
      const prompt = `You are the Civic Aegis Legal Agent synthesizing an attorney defense hand-off brief following a police traffic stop in ${jurisdictionState}.

INTERACTION TRANSCRIPT:
"""
${transcript}
"""

Synthesize legal findings and generate a defense assessment. Forbid repeating keys in JSON.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: CIVIC_AEGIS_SYSTEM_INSTRUCTION,
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: ATTORNEY_BRIEF_SCHEMA,
              temperature: 0.2,
              maxOutputTokens: 1024,
            },
          }),
          signal: controller?.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (typeof parsed.shouldContactLawyer === 'boolean') {
            finalShouldContactLawyer = parsed.shouldContactLawyer;
          }
          if (parsed.lawyerType) {
            finalLawyerType = parsed.lawyerType;
          }
          if (parsed.urgency) {
            finalUrgency = parsed.urgency;
          }
          if (parsed.riskLevel) {
            finalRiskLevel = parsed.riskLevel;
          }
          if (Array.isArray(parsed.keyFindings) && parsed.keyFindings.length > 0) {
            finalKeyFindings = parsed.keyFindings;
          }
          if (
            Array.isArray(parsed.recommendedDefenseSteps) &&
            parsed.recommendedDefenseSteps.length > 0
          ) {
            finalRecommendedSteps = parsed.recommendedDefenseSteps;
          }
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      // Seamlessly fall back to deterministic local synthesis
    }
  }

  const dateStr = new Date().toLocaleDateString();
  const timeStr = new Date().toLocaleTimeString();

  const markdownBrief = `# CIVIC AEGIS ROADWAY INCIDENT BRIEF
**Autonomously Generated Legal Hand-Off Brief**
- **Date & Time:** ${dateStr} at ${timeStr}
- **Jurisdiction:** ${jurisdictionState} Law
- **Risk Assessment:** ${finalRiskLevel}

## Attorney Consultation Recommendation
- **Counsel Advised:** ${finalShouldContactLawyer ? 'YES' : 'NO'}
- **Recommended Practice Specialty:** ${finalLawyerType}
- **Urgency Level:** ${finalUrgency}

### Synthesized Legal Findings:
${finalKeyFindings.map((f) => `- ${f}`).join('\n')}

### Recommended Defense Action Items:
${finalRecommendedSteps.map((s) => `- ${s}`).join('\n')}

## Complete Ambient Audio Transcript:
${transcript || 'No verbal audio recorded.'}

---
*Disclaimer: ${LEGAL_DISCLAIMER}*`;

  return {
    shouldContactLawyer: finalShouldContactLawyer,
    lawyerType: finalLawyerType,
    urgency: finalUrgency,
    riskLevel: finalRiskLevel,
    keyFindings: finalKeyFindings,
    recommendedDefenseSteps: finalRecommendedSteps,
    suggestedResponse:
      'Officer, I have provided my mandatory paperwork and am choosing to remain silent.',
    markdownBrief,
    legalDisclaimer: LEGAL_DISCLAIMER,
  };
}
