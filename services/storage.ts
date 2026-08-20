/**
 * CivicAegis - Storage Service
 * Persists traffic stop sessions, active recording drafts, emergency contacts, and app preferences.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranscriptEntry } from '../hooks/useSpeechToText';
import { LiveStopAnalysis, LawyerRecommendationPayload } from './aiService';

const STORAGE_KEY_SESSIONS = '@civicaegis_sessions_v2';
const STORAGE_KEY_SETTINGS = '@civicaegis_settings_v2';
const STORAGE_KEY_CONTACTS = '@civicaegis_contacts_v2';
const STORAGE_KEY_ACTIVE_DRAFT = '@civicaegis_active_draft_v2';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isAttorney: boolean;
  autoNotify: boolean;
}

export interface StopSession {
  id: string;
  startTime: number;
  endTime: number;
  transcript: string;
  transcriptEntries: TranscriptEntry[];
  jurisdictionState: string;
  maxRiskLevel: 'High' | 'Moderate' | 'Low';
  latestAnalysis?: LiveStopAnalysis;
  finalReport?: LawyerRecommendationPayload;
  locationLabel?: string;
}

export interface UserSettings {
  jurisdictionState: string;
  geminiApiKey: string;
  voiceReadout: boolean;
  language: 'en' | 'es';
  hapticFeedback: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  jurisdictionState: 'General U.S.',
  geminiApiKey: '',
  voiceReadout: true,
  language: 'en',
  hapticFeedback: true,
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
};

export const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact_1',
    name: 'Family Emergency Contact',
    phone: '+1 (555) 234-5678',
    relationship: 'Family',
    isAttorney: false,
    autoNotify: true,
  },
  {
    id: 'contact_2',
    name: 'Legal Defense Hotline',
    phone: '+1 (800) 555-0199',
    relationship: 'Civil Rights Counsel',
    isAttorney: true,
    autoNotify: true,
  },
];

/**
 * Real-time Active Session Checkpoint Persistence
 * Writes immediately on every speech event so active stops survive phone reboots or refreshes.
 */
export async function saveActiveSessionCheckpoint(draft: StopSession): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.error('Error auto-saving active draft checkpoint:', err);
  }
}

export async function getActiveSessionCheckpoint(): Promise<StopSession | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_DRAFT);
    if (!json) return null;
    return JSON.parse(json) as StopSession;
  } catch (err) {
    return null;
  }
}

export async function clearActiveSessionCheckpoint(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_DRAFT);
  } catch (err) {
    console.error('Error clearing active checkpoint:', err);
  }
}

export async function saveStopSession(session: StopSession): Promise<void> {
  try {
    const existing = await getAllStopSessions();
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    await AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
    await clearActiveSessionCheckpoint();
  } catch (error) {
    console.error('Error saving stop session:', error);
  }
}

export async function getAllStopSessions(): Promise<StopSession[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!json) return [];
    return JSON.parse(json) as StopSession[];
  } catch (error) {
    console.error('Error loading stop sessions:', error);
    return [];
  }
}

export async function getStopSessionById(id: string): Promise<StopSession | null> {
  try {
    const sessions = await getAllStopSessions();
    return sessions.find((s) => s.id === id) || null;
  } catch (error) {
    console.error('Error fetching stop session by ID:', error);
    return null;
  }
}

export async function deleteStopSession(id: string): Promise<void> {
  try {
    const existing = await getAllStopSessions();
    const filtered = existing.filter((s) => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting stop session:', error);
  }
}

export async function clearAllStopSessions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_SESSIONS);
    await clearActiveSessionCheckpoint();
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const current = await getUserSettings();
    const merged = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_CONTACTS);
    if (!json) {
      await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(DEFAULT_CONTACTS));
      return DEFAULT_CONTACTS;
    }
    return JSON.parse(json) as EmergencyContact[];
  } catch (error) {
    return DEFAULT_CONTACTS;
  }
}

export async function saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving emergency contacts:', error);
  }
}
