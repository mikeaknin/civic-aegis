/**
 * CivicAegis - AI Service Bridge
 * Hardened Gemini 3.7 Flash engine & fallback classifier adapter.
 */

import {
  analyzeWithGemini,
  evaluateAmbientSpeechWithGemini,
  generateLocalFallbackAnalysis,
  generateDeterministicHardenedResponse,
  generateStructuredLegalReport,
  GeminiLiveAnalysis,
  StructuredLegalBrief,
  CivicAegisHardenedAssessment,
  ThreatLevel,
  DEFAULT_CIVIC_AEGIS_RESPONSE,
  CIVIC_AEGIS_RESPONSE_SCHEMA,
} from './gemini';

export type { ThreatLevel, CivicAegisHardenedAssessment };
export {
  evaluateAmbientSpeechWithGemini,
  generateDeterministicHardenedResponse,
  DEFAULT_CIVIC_AEGIS_RESPONSE,
  CIVIC_AEGIS_RESPONSE_SCHEMA,
};

export interface LawyerRecommendationPayload {
  shouldContactLawyer: boolean;
  lawyerType: 'Traffic Infraction Defense' | 'Civil Rights Counsel' | 'Criminal Defense Attorney';
  urgency: 'High' | 'Medium' | 'Low';
  riskLevel: 'High' | 'Moderate' | 'Low';
  keyFindings: string[];
  recommendedNextSteps: string[];
  suggestedResponse: string;
  legalDisclaimer: string;
}

export interface LiveStopAnalysis {
  riskLevel: 'High' | 'Moderate' | 'Low';
  officerIntent: string;
  constitutionalRelevance: string;
  suggestedResponse: string;
  reasoning: string;
  actionGuidance: string;
  timestamp: number;
}

export function generateFallbackLegalAnalysis(
  transcript: string,
  stateCode: string = 'CA'
): LiveStopAnalysis {
  const res = generateLocalFallbackAnalysis(transcript, stateCode);
  const normalizedRisk: 'High' | 'Moderate' | 'Low' =
    res.riskLevel === 'HIGH' ? 'High' : res.riskLevel === 'MODERATE' ? 'Moderate' : 'Low';

  return {
    riskLevel: normalizedRisk,
    officerIntent: res.intent,
    constitutionalRelevance: res.constitutionalBasis,
    suggestedResponse: res.suggestedResponse,
    reasoning: res.reasoning,
    actionGuidance: res.actionInstruction,
    timestamp: res.timestamp,
  };
}

export async function analyzeLiveTranscript(
  transcript: string,
  stateCode: string = 'General U.S.',
  apiKey?: string
): Promise<LiveStopAnalysis> {
  const res: GeminiLiveAnalysis = await analyzeWithGemini(transcript, stateCode, apiKey);
  const normalizedRisk: 'High' | 'Moderate' | 'Low' =
    res.riskLevel === 'HIGH' ? 'High' : res.riskLevel === 'MODERATE' ? 'Moderate' : 'Low';

  return {
    riskLevel: normalizedRisk,
    officerIntent: res.intent,
    constitutionalRelevance: res.constitutionalBasis,
    suggestedResponse: res.suggestedResponse,
    reasoning: res.reasoning,
    actionGuidance: res.actionInstruction,
    timestamp: res.timestamp,
  };
}

export async function generateComprehensiveIncidentReport(
  transcript: string,
  entries: any[] = [],
  stateCode: string = 'General U.S.',
  apiKey?: string
): Promise<LawyerRecommendationPayload> {
  const res: StructuredLegalBrief = await generateStructuredLegalReport(
    transcript,
    entries,
    stateCode,
    apiKey
  );

  const normalizedRisk: 'High' | 'Moderate' | 'Low' =
    res.riskLevel === 'HIGH' ? 'High' : res.riskLevel === 'MODERATE' ? 'Moderate' : 'Low';

  return {
    shouldContactLawyer: res.shouldContactLawyer,
    lawyerType: res.lawyerType,
    urgency: res.urgency,
    riskLevel: normalizedRisk,
    keyFindings: res.keyFindings,
    recommendedNextSteps: res.recommendedDefenseSteps,
    suggestedResponse: res.suggestedResponse,
    legalDisclaimer: res.legalDisclaimer,
  };
}
