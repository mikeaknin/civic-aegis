import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  audioUri?: string;
  durationSeconds?: number;
  label?: string;
}

export function AudioPlayer({ audioUri, durationSeconds = 0, label = 'Recorded Audio' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(durationSeconds || 0);

  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (durationSeconds > 0 && duration === 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds, duration]);

  // Initialize Web Audio Element
  useEffect(() => {
    if (Platform.OS === 'web' && audioUri) {
      const audio = new window.Audio(audioUri);
      webAudioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(Math.round(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [audioUri]);

  // Clean up native sound
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (Platform.OS === 'web') {
      if (!webAudioRef.current && audioUri) {
        webAudioRef.current = new window.Audio(audioUri);
      }

      if (webAudioRef.current) {
        if (isPlaying) {
          webAudioRef.current.pause();
          setIsPlaying(false);
        } else {
          try {
            await webAudioRef.current.play();
            setIsPlaying(true);
          } catch (e) {
            console.warn('Audio play error:', e);
          }
        }
      } else {
        // Fallback simulation timer if no raw audio stream
        if (isPlaying) {
          setIsPlaying(false);
        } else {
          setIsPlaying(true);
          const interval = setInterval(() => {
            setCurrentTime((prev) => {
              if (prev >= (duration || 5)) {
                clearInterval(interval);
                setIsPlaying(false);
                return 0;
              }
              return prev + 1;
            });
          }, 1000);
        }
      }
      return;
    }

    // Native Expo-AV playback
    try {
      if (!soundRef.current && audioUri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setCurrentTime(Math.round(status.positionMillis / 1000));
              if (status.durationMillis) {
                setDuration(Math.round(status.durationMillis / 1000));
              }
              if (status.didJustFinish) {
                setIsPlaying(false);
                setCurrentTime(0);
              }
            }
          }
        );
        soundRef.current = sound;
        setIsPlaying(true);
      } else if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.warn('Native audio playback error:', err);
    }
  };

  const handleRestart = () => {
    if (Platform.OS === 'web' && webAudioRef.current) {
      webAudioRef.current.currentTime = 0;
      webAudioRef.current.play().catch(() => {});
      setIsPlaying(true);
      setCurrentTime(0);
    } else {
      setCurrentTime(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <Volume2 size={15} color="#EF4444" />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.timeText}>
          {formatTime(currentTime)} / {formatTime(duration || durationSeconds || 5)}
        </Text>
      </View>

      {/* Progress Track */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          onPress={handleTogglePlay}
          activeOpacity={0.8}
        >
          {isPlaying ? <Pause size={16} color="#FFFFFF" /> : <Play size={16} color="#FFFFFF" />}
          <Text style={styles.playBtnText}>
            {isPlaying ? 'PAUSE RECORDING' : audioUri ? 'PLAY STOP RECORDING' : 'REPLAY AUDIO'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
          <RotateCcw size={14} color="#A1A1AA" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080808',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 12,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 38,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  playBtnActive: {
    backgroundColor: '#991B1B',
  },
  playBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  restartBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2F1517',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
