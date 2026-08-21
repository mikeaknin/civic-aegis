/**
 * Civic Aegis - Web Speech API Continuous Listener & Reconnection Wrapper
 * 
 * Guarantees seamless ambient audio intake during long roadside stops,
 * eliminating browser listening dropouts during ambient silence or network shifts.
 * 
 * Features:
 *  - Full browser compatibility (window.SpeechRecognition & window.webkitSpeechRecognition)
 *  - Continuous ambient listening (continuous = true, interimResults = true)
 *  - Resilient onend auto-reconnection loop when user is actively monitoring
 *  - Non-fatal onerror handling for 'no-speech', 'network', 'aborted', and 'audio-capture'
 *  - Complete React lifecycle cleanup (recognition.stop(), recognition.abort()) on unmount
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

// Web Speech API interface definitions for TypeScript
interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface UseSpeechListenerOptions {
  lang?: string;
  onTranscriptChange?: (text: string, isFinal: boolean) => void;
  onInterimChange?: (interim: string) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechListenerReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
}

export function useSpeechListener(
  options: UseSpeechListenerOptions = {}
): UseSpeechListenerReturn {
  const {
    lang = 'en-US',
    onTranscriptChange,
    onInterimChange,
    onError: customOnError,
  } = options;

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // References to keep lifecycle state in sync across re-renders
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const restartTimerRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 10;

  // Detect SpeechRecognition / webkitSpeechRecognition
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const win = window as unknown as IWindowSpeechRecognition;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  /**
   * Initializes and starts the Web Speech Recognition instance
   */
  const initAndStartRecognition = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const win = window as unknown as IWindowSpeechRecognition;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError('Web Speech API is not supported in this browser.');
      return;
    }

    // Safely abort existing instance before creating a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort exception
      }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (isListeningRef.current) {
          setIsListening(true);
          setError(null);
          retryCountRef.current = 0;
        }
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalChunk += result[0].transcript;
          } else {
            interimChunk += result[0].transcript;
          }
        }

        if (interimChunk.trim()) {
          const cleanInterim = interimChunk.trim();
          setInterimTranscript(cleanInterim);
          if (onInterimChange) {
            onInterimChange(cleanInterim);
          }
        }

        if (finalChunk.trim()) {
          const cleanFinal = finalChunk.trim();
          setTranscript((prev) => (prev ? `${prev}\n${cleanFinal}` : cleanFinal));
          setInterimTranscript('');
          if (onTranscriptChange) {
            onTranscriptChange(cleanFinal, true);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error || 'unknown';
        console.warn(`[SpeechListener] Speech recognition status notice: ${errType}`);

        // Non-fatal speech errors: log and allow resilient loop to handle recovery
        if (
          errType === 'no-speech' ||
          errType === 'audio-capture' ||
          errType === 'network' ||
          errType === 'aborted'
        ) {
          // Gracefully continue; onend will automatically reconnect if user is still listening
          return;
        }

        // Fatal/permission errors
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          const permMsg = 'Microphone permission denied. Please grant microphone access to enable live transcription.';
          setError(permMsg);
          if (customOnError) customOnError(permMsg);
          isListeningRef.current = false;
          setIsListening(false);
          return;
        }

        const msg = `Speech Recognition notice: ${errType}`;
        setError(msg);
        if (customOnError) customOnError(msg);
      };

      recognition.onend = () => {
        // Resilience Loop: Automatically reconnect if user has not manually stopped
        if (isListeningRef.current) {
          if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
          }

          // Exponential backoff if rapid successive retries occur
          const delay = Math.min(300 + retryCountRef.current * 150, 1500);

          restartTimerRef.current = setTimeout(() => {
            if (isListeningRef.current && retryCountRef.current < maxRetries) {
              retryCountRef.current += 1;
              try {
                recognition.start();
              } catch (startErr) {
                // If restarting existing object fails, create a fresh recognition instance
                initAndStartRecognition();
              }
            }
          }, delay);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('[SpeechListener] Initialization catch notice:', err);
      if (isListeningRef.current) {
        // Attempt recovery after a brief interval
        restartTimerRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            initAndStartRecognition();
          }
        }, 500);
      }
    }
  }, [lang, onTranscriptChange, onInterimChange, customOnError]);

  /**
   * Start listening session
   */
  const startListening = useCallback(async () => {
    setError(null);
    isListeningRef.current = true;
    retryCountRef.current = 0;
    setIsListening(true);

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        console.warn('[SpeechListener] Microphone check notice:', micErr);
      }
    }

    initAndStartRecognition();
  }, [initAndStartRecognition]);

  /**
   * Stop listening session and clean up timers
   */
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    retryCountRef.current = 0;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  /**
   * Clear accumulated transcript text
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  /**
   * Component unmount cleanup
   */
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
  };
}

export default useSpeechListener;
