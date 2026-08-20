import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'officer' | 'user' | 'ambient';
}

export interface UseSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  transcriptEntries: TranscriptEntry[];
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  clearTranscript: () => void;
  injectTestPhrase: (phrase: string, speaker?: 'officer' | 'user' | 'ambient') => void;
  error: string | null;
  isWebSpeechSupported: boolean;
}

export function useSpeechToText(
  onNewPhraseDetected?: (phrase: string, allEntries: TranscriptEntry[]) => void
): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isWebSpeechSupported, setIsWebSpeechSupported] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaStreamRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const entriesRef = useRef<TranscriptEntry[]>([]);
  const restartTimeoutRef = useRef<any>(null);

  // Keep ref synchronized
  entriesRef.current = transcriptEntries;

  // Detect Web Speech API support
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsWebSpeechSupported(true);
      }
    }
  }, []);

  const addEntry = useCallback(
    (text: string, speaker: 'officer' | 'user' | 'ambient' = 'officer') => {
      const cleanText = text.trim();
      if (!cleanText) return;

      const newEntry: TranscriptEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: cleanText,
        timestamp: Date.now(),
        speaker,
      };

      setTranscriptEntries((prev) => {
        const updated = [...prev, newEntry];
        if (onNewPhraseDetected) {
          onNewPhraseDetected(cleanText, updated);
        }
        return updated;
      });

      setTranscript((prev) => (prev ? `${prev}\n${cleanText}` : cleanText));
      setInterimTranscript('');
    },
    [onNewPhraseDetected]
  );

  const injectTestPhrase = useCallback(
    (phrase: string, speaker: 'officer' | 'user' | 'ambient' = 'officer') => {
      addEntry(phrase, speaker);
    },
    [addEntry]
  );

  const startListening = useCallback(async () => {
    try {
      setError(null);
      isListeningRef.current = true;
      setIsListening(true);

      // Web Browser Speech Recognition & Audio Stream
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // First, request microphone media permission cleanly
        if (navigator?.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
          } catch (micErr: any) {
            console.warn('Microphone permission warning:', micErr);
          }
        }

        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort();
            } catch (e) {}
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 1;

          recognition.onstart = () => {
            if (isListeningRef.current) {
              setIsListening(true);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition status/error:', event.error);
            // Non-fatal errors: auto-continue
            if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'aborted') {
              // Ignore and allow onend to restart if still active
              return;
            }
            if (event.error === 'not-allowed') {
              setError('Microphone access denied. Please allow microphone permissions in Safari/browser settings.');
            } else {
              setError(`Speech API notice: ${event.error}`);
            }
          };

          recognition.onend = () => {
            // Auto-restart if user still has shield session active (handles mobile Safari silence timeouts)
            if (isListeningRef.current) {
              if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
              restartTimeoutRef.current = setTimeout(() => {
                if (isListeningRef.current && recognitionRef.current) {
                  try {
                    recognition.start();
                  } catch (e) {
                    // Retry once more if needed
                  }
                }
              }, 300);
            } else {
              setIsListening(false);
            }
          };

          recognition.onresult = (event: any) => {
            let finalSentence = '';
            let interimSentence = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res.isFinal) {
                finalSentence += res[0].transcript;
              } else {
                interimSentence += res[0].transcript;
              }
            }

            if (interimSentence.trim()) {
              setInterimTranscript(interimSentence.trim());
            }

            if (finalSentence.trim()) {
              addEntry(finalSentence.trim(), 'officer');
            }
          };

          try {
            recognition.start();
            recognitionRef.current = recognition;
            return;
          } catch (startErr) {
            console.warn('Initial recognition.start error:', startErr);
          }
        }
      }

      // Native / Expo Audio Recording Fallback
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Microphone permission not granted. Scenario simulations remain active.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (err: any) {
      console.error('Failed to start audio recording:', err);
      setError(err?.message || 'Failed to start audio listening');
    }
  }, [addEntry]);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setTranscriptEntries([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
        } catch (e) {}
      }
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    transcriptEntries,
    startListening,
    stopListening,
    clearTranscript,
    injectTestPhrase,
    error,
    isWebSpeechSupported,
  };
}
