/**
 * Civic Aegis - Google Gemini API Bridge
 * Features:
 *  - Real-time Hybrid AI reasoning (gemini-3.7-flash + Offline Rule Engine)
 *  - Fail-safe timeout wrapper (3.5s timeout with zero-latency local fallback)
 *  - EXPO_PUBLIC_GEMINI_API_KEY support
 *  - Structured Attorney Hand-Off Defense Brief generator (gemini-3.7-flash)
 */

import {
  LEGAL_DISCLAIMER,
  JURISDICTION_STATE_DATABASE,
} from '../constants/legalSafety';

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
 * Fallback Offline Keyword Classifier
 * Executes synchronously in < 1ms with 0 network dependency.
 */
export function generateLocalFallbackAnalysis(
  transcript: string,
  jurisdictionState: string = 'General U.S.'
): GeminiLiveAnalysis {
  const text = transcript.toLowerCase();
  const stateCode = jurisdictionState.length === 2 ? jurisdictionState : 'CA';
  const stateData = JURISDICTION_STATE_DATABASE[stateCode] || JURISDICTION_STATE_DATABASE['CA'];

  // HIGH RISK: Search requests, opening trunk/glove box, odor probing, weapon queries
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
      suggestedResponse:
        'Officer, I do not consent to any searches of my vehicle, my belongings, or my person.',
      constitutionalBasis: '4th Amendment (Protection Against Unreasonable Searches)',
      riskLevel: 'HIGH',
      actionInstruction: 'Keep both hands visible on steering wheel. Do not physically resist if searched.',
      intent: 'Search Inquiry / Vehicle Inspection Probe',
      reasoning:
        'The officer is requesting or probing for voluntary consent to search. Explicit verbal refusal protects your 4th Amendment rights for the court record.',
      timestamp: Date.now(),
    };
  }

  // HIGH RISK: Compulsory vehicle exit orders (Pennsylvania v. Mimms / Maryland v. Wilson)
  if (
    text.includes('step out') ||
    text.includes('get out of the car') ||
    text.includes('exit the vehicle') ||
    text.includes('get out') ||
    text.includes('out of the car')
  ) {
    return {
      suggestedResponse:
        'I am complying with your order to exit the vehicle, but I do not consent to any searches.',
      constitutionalBasis: 'Pennsylvania v. Mimms (1977) & Maryland v. Wilson (1997)',
      riskLevel: 'HIGH',
      actionInstruction: 'Comply smoothly. Keep hands empty and visible. Close car door behind you.',
      intent: 'Compulsory Vehicle Exit Order',
      reasoning:
        'Under Pennsylvania v. Mimms, police may lawfully order occupants out during a traffic stop. Non-compliance can lead to arrest for obstruction.',
      timestamp: Date.now(),
    };
  }

  // MODERATE RISK: Field sobriety probing / Questions about alcohol or destination
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
      suggestedResponse:
        'Officer, with all respect, I am choosing to exercise my Fifth Amendment right to remain silent.',
      constitutionalBasis: '5th Amendment (Salinas v. Texas & Miranda v. Arizona)',
      riskLevel: 'MODERATE',
      actionInstruction: 'Provide required documentation, but politely decline exploratory questions.',
      intent: 'Exploratory Interrogation / Sobriety Probe',
      reasoning:
        'Investigatory questions seek voluntary admissions of guilt. In most states, roadside physical field sobriety tests are voluntary.',
      timestamp: Date.now(),
    };
  }

  // MODERATE RISK: Speeding citations / Tickets
  if (
    text.includes('ticket') ||
    text.includes('citation') ||
    text.includes('sign here') ||
    text.includes('court date')
  ) {
    return {
      suggestedResponse:
        'Understood, Officer. I am signing this as a receipt and promise to appear, not an admission of guilt.',
      constitutionalBasis: `${stateData.stateName} Vehicle Code § Statutory Citation Procedures`,
      riskLevel: 'MODERATE',
      actionInstruction: 'Sign the ticket calmly. Signing is merely a promise to appear.',
      intent: 'Citation Issuance',
      reasoning:
        'Refusing to sign a traffic citation is an arrestable misdemeanor in most jurisdictions. Contest the citation in court, not roadside.',
      timestamp: Date.now(),
    };
  }

  // ROUTINE: Mandatory identification / registration checks
  if (
    text.includes('license') ||
    text.includes('registration') ||
    text.includes('insurance') ||
    text.includes('pulled you over') ||
    text.includes('tail light')
  ) {
    return {
      suggestedResponse:
        'Officer, my documents are in the glove compartment. I am reaching for them now with your permission.',
      constitutionalBasis: `${stateData.stateName} Mandatory Driver Identification Statute`,
      riskLevel: 'ROUTINE',
      actionInstruction: 'Verbally narrate your hand movements before reaching into any compartment.',
      intent: 'Mandatory Driver Verification',
      reasoning: `In ${stateData.stateName}, operating drivers are legally obligated to display driver's license, registration, and proof of insurance upon lawful demand.`,
      timestamp: Date.now(),
    };
  }

  // Default Routine State
  return {
    suggestedResponse: 'Good day, Officer. How can I help you today?',
    constitutionalBasis: 'General De-escalation & Constitutional Awareness',
    riskLevel: 'ROUTINE',
    actionInstruction: 'Keep hands on steering wheel at 10 and 2. Roll window halfway down.',
    intent: 'Standard Traffic Inquiry',
    reasoning: 'Interaction is currently routine. Maintain professional, calm posture.',
    timestamp: Date.now(),
  };
}

/**
 * Call Google Gemini gemini-3.7-flash API for real-time speech categorization
 * with automatic 3.5s timeout and seamless offline fallback.
 */
export async function analyzeWithGemini(
  transcript: string,
  jurisdictionState: string = 'General U.S.',
  customApiKey?: string
): Promise<GeminiLiveAnalysis> {
  const fallback = generateLocalFallbackAnalysis(transcript, jurisdictionState);
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
    const prompt = `You are Civic Aegis, an autonomous real-time civil rights and de-escalation engine for traffic stops.
Analyze the live roadside conversation transcript in the context of ${jurisdictionState} law:

LIVE TRANSCRIPT:
"""
${transcript}
"""

SAFETY DIRECTIVES:
1. NEVER instruct physical resistance or aggression.
2. Emphasize calm, polite assertion of constitutional rights (4th, 5th, 6th Amendments).
3. Return STRICT JSON adhering to this schema:
{
  "suggestedResponse": "string (concise 1-2 sentence polite phrase for the driver to say aloud)",
  "constitutionalBasis": "string (e.g. '4th Amendment', 'Pennsylvania v. Mimms', or State Code)",
  "riskLevel": "ROUTINE" | "MODERATE" | "HIGH",
  "actionInstruction": "string (physical safety reminder like 'Keep hands on wheel')",
  "intent": "string (officer intent category)",
  "reasoning": "string (1-2 sentences on legal reasoning)"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: controller?.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return fallback;

    const parsed = JSON.parse(rawText);
    return {
      suggestedResponse: parsed.suggestedResponse || fallback.suggestedResponse,
      constitutionalBasis: parsed.constitutionalBasis || fallback.constitutionalBasis,
      riskLevel:
        parsed.riskLevel === 'HIGH' || parsed.riskLevel === 'MODERATE'
          ? parsed.riskLevel
          : 'ROUTINE',
      actionInstruction: parsed.actionInstruction || fallback.actionInstruction,
      intent: parsed.intent || fallback.intent,
      reasoning: parsed.reasoning || fallback.reasoning,
      timestamp: Date.now(),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return fallback;
  }
}

/**
 * Generate Structured Attorney Hand-Off Defense Brief using gemini-3.7-flash
 * with zero-latency local fallback.
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
      const prompt = `You are Civic Aegis, synthesizing an attorney defense hand-off brief following a police traffic stop in ${jurisdictionState}.

INTERACTION TRANSCRIPT:
"""
${transcript}
"""

Synthesize legal findings and generate a defense assessment. Return STRICT JSON with the following schema:
{
  "shouldContactLawyer": boolean,
  "lawyerType": "Traffic Infraction Defense" | "Civil Rights Counsel" | "Criminal Defense Attorney",
  "urgency": "High" | "Medium" | "Low",
  "riskLevel": "ROUTINE" | "MODERATE" | "HIGH",
  "keyFindings": ["string", "string"],
  "recommendedDefenseSteps": ["string", "string"]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
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
      // Seamlessly fall back to pre-baked local synthesis
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
