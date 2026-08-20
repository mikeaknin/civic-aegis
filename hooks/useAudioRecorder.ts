/**
 * Civic Aegis - Real-Time Audio Recorder Hook
 * Captures microphone audio using MediaRecorder on Web and Expo-AV on Native.
 */

import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  startRecording: (existingStream?: MediaStream) => Promise<void>;
  stopRecording: () => Promise<{ audioUri: string | null; duration: number }>;
  recordedUri: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (existingStream?: MediaStream) => {
    try {
      audioChunksRef.current = [];
      setRecordedUri(null);
      setRecordingDuration(0);
      startTimeRef.current = Date.now();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Web Implementation via MediaRecorder
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        let stream = existingStream;
        if (!stream && navigator?.mediaDevices?.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        if (stream && typeof MediaRecorder !== 'undefined') {
          // Detect supported mimeType (webm or mp4)
          let mimeType = 'audio/webm';
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
          }

          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          recorder.start(1000); // 1-second chunks
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
          return;
        }
      }

      // Native Expo AV Recording Fallback
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        nativeRecordingRef.current = recording;
        setIsRecording(true);
      }
    } catch (err) {
      console.warn('Audio recording start notice:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<{ audioUri: string | null; duration: number }> => {
    const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);

    // Web MediaRecorder stop & convert to Data URL
    if (Platform.OS === 'web' && mediaRecorderRef.current) {
      return new Promise((resolve) => {
        const recorder = mediaRecorderRef.current!;

        recorder.onstop = () => {
          try {
            const mimeType = recorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Uri = reader.result as string;
              setRecordedUri(base64Uri);
              resolve({ audioUri: base64Uri, duration });
            };
            reader.onerror = () => {
              // Fallback to blob URL
              const blobUrl = URL.createObjectURL(audioBlob);
              setRecordedUri(blobUrl);
              resolve({ audioUri: blobUrl, duration });
            };
            reader.readAsDataURL(audioBlob);
          } catch (e) {
            resolve({ audioUri: null, duration });
          }
        };

        try {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        } catch (e) {
          resolve({ audioUri: null, duration });
        }
      });
    }

    // Native Recording stop
    if (nativeRecordingRef.current) {
      try {
        await nativeRecordingRef.current.stopAndUnloadAsync();
        const uri = nativeRecordingRef.current.getURI();
        setRecordedUri(uri);
        nativeRecordingRef.current = null;
        return { audioUri: uri, duration };
      } catch (e) {
        nativeRecordingRef.current = null;
        return { audioUri: null, duration };
      }
    }

    return { audioUri: null, duration };
  }, []);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    recordedUri,
  };
}
