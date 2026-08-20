/**
 * Civic Aegis - Real-Time Vocal Coaching & Speech Synthesis Service
 * Provides instant spoken legal instructions and scripts via the Web Speech API.
 */

import { Platform } from 'react-native';

class VocalCoachService {
  private isSpeakingActive: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded: boolean = false;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      this.initVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      // Find a crisp, clear English voice (e.g. Samantha, Karen, Google US English, or default)
      const englishVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Karen') ||
              v.name.includes('Natural'))
        ) || voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        this.selectedVoice = englishVoice;
      }
      this.voicesLoaded = true;
    }
  }

  /**
   * Speak an actionable civil rights script or coaching instruction aloud.
   * Cancels prior utterances immediately to prevent lag.
   */
  public speak(
    text: string,
    options: {
      enabled?: boolean;
      lang?: 'en' | 'es';
      prefixCoaching?: boolean;
      rate?: number;
      pitch?: number;
    } = {}
  ): void {
    const {
      enabled = true,
      lang = 'en',
      prefixCoaching = false,
      rate = 1.0,
      pitch = 1.0,
    } = options;

    if (!enabled || !text || text.trim().length === 0) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        // Cancel any pending speech queue immediately
        window.speechSynthesis.cancel();

        const phraseToSpeak = prefixCoaching
          ? `State clearly to the officer: ${text}`
          : text;

        const utterance = new SpeechSynthesisUtterance(phraseToSpeak);
        utterance.lang = lang === 'es' ? 'es-ES' : 'en-US';
        utterance.rate = rate; // calm, authoritative cadence
        utterance.pitch = pitch;

        if (this.selectedVoice && lang === 'en') {
          utterance.voice = this.selectedVoice;
        }

        utterance.onstart = () => {
          this.isSpeakingActive = true;
        };

        utterance.onend = () => {
          this.isSpeakingActive = false;
        };

        utterance.onerror = (e) => {
          console.warn('Vocal coach speech synthesis notice:', e);
          this.isSpeakingActive = false;
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Vocal coach TTS unavailable:', err);
      }
    }
  }

  /**
   * Stop any active vocal coach announcements immediately.
   */
  public stop(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      this.isSpeakingActive = false;
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive;
  }
}

export const vocalCoach = new VocalCoachService();
