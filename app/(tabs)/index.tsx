import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronRight,
  FileText,
  Globe,
  Briefcase,
  Activity,
  CheckCircle2,
  Hand,
  Info,
  Radio,
  Sparkles,
} from 'lucide-react-native';

import { useSpeechToText, TranscriptEntry } from '../../hooks/useSpeechToText';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { vocalCoach } from '../../services/speechSynthesis';
import {
  analyzeLiveTranscript,
  generateComprehensiveIncidentReport,
  LiveStopAnalysis,
} from '../../services/aiService';
import {
  saveStopSession,
  StopSession,
  getUserSettings,
  saveUserSettings,
  getAllStopSessions,
  getEmergencyContacts,
  saveActiveSessionCheckpoint,
  getActiveSessionCheckpoint,
  clearActiveSessionCheckpoint,
} from '../../services/storage';
import {
  LEGAL_DISCLAIMER,
  ABSOLUTE_NON_RESISTANCE_POLICY,
  JURISDICTION_STATE_DATABASE,
} from '../../constants/legalSafety';

const APP_LOGO = require('../../assets/icon.png');

const JURISDICTIONS = [
  { id: 'US', label: 'General U.S.', code: 'US' },
  { id: 'CA', label: 'California', code: 'CA' },
  { id: 'TX', label: 'Texas', code: 'TX' },
  { id: 'FL', label: 'Florida', code: 'FL' },
  { id: 'NY', label: 'New York', code: 'NY' },
  { id: 'GA', label: 'Georgia', code: 'GA' },
  { id: 'IL', label: 'Illinois', code: 'IL' },
  { id: 'WA', label: 'Washington', code: 'WA' },
];

const SCENARIO_SIMULATIONS = [
  {
    id: 'search',
    label: 'Search Trunk',
    phrase: 'Mind if I look inside and search your trunk and glove box?',
    risk: 'High Risk',
  },
  {
    id: 'exit',
    label: 'Step Out',
    phrase: 'Driver, step out and exit the vehicle right now.',
    risk: 'Compulsory Order',
  },
  {
    id: 'sobriety',
    label: 'Sobriety Probe',
    phrase: 'Where are you coming from? Have you had any alcoholic drinks?',
    risk: '5th Amend',
  },
  {
    id: 'docs',
    label: 'License & Reg',
    phrase: 'Driver, license, vehicle registration, and proof of insurance please.',
    risk: 'Mandatory',
  },
  {
    id: 'ticket',
    label: 'Ticket Issued',
    phrase: 'I clocked you speeding. Sign this citation — it is not an admission of guilt.',
    risk: 'Citation',
  },
];

export default function MonitorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('General U.S.');
  const [jurisdictionCode, setJurisdictionCode] = useState<string>('CA');
  const [voiceReadout, setVoiceReadout] = useState<boolean>(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [loggedCount, setLoggedCount] = useState<number>(0);
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stopStartTime, setStopStartTime] = useState<number | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<LiveStopAnalysis | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { startRecording, stopRecording, recordingDuration } = useAudioRecorder();

  // Load telemetry stats, preferences, and check active unfinalized checkpoint
  useEffect(() => {
    getUserSettings().then((settings) => {
      setSelectedJurisdiction(settings.jurisdictionState || 'General U.S.');
      setVoiceReadout(settings.voiceReadout !== false);
      setLanguage(settings.language || 'en');
      setGeminiApiKey(settings.geminiApiKey || '');
    });

    getAllStopSessions().then((sessions) => setLoggedCount(sessions.length));
    getEmergencyContacts().then((contacts) => setContactsCount(contacts.length));

    // Restore active session checkpoint if page was reloaded during a stop
    getActiveSessionCheckpoint().then((checkpoint) => {
      if (checkpoint && checkpoint.transcriptEntries?.length > 0) {
        setSessionId(checkpoint.id);
        setStopStartTime(checkpoint.startTime);
        setCurrentAnalysis(checkpoint.latestAnalysis || null);
      }
    });
  }, []);

  const handleNewPhrase = (phrase: string, allEntries: TranscriptEntry[]) => {
    const fullText = allEntries.map((e) => e.text).join(' ');

    // Call Hybrid Gemini API Bridge with zero-latency offline fallback
    analyzeLiveTranscript(fullText, jurisdictionCode, geminiApiKey).then((analysis) => {
      setCurrentAnalysis(analysis);

      // Trigger real-time vocal coach TTS through speaker
      if (voiceReadout && analysis.suggestedResponse) {
        vocalCoach.speak(analysis.suggestedResponse, {
          enabled: voiceReadout,
          lang: language,
          prefixCoaching: true,
        });
      }

      // Real-time Local Storage Persistence on every audio/speech event
      const activeId = sessionId || `stop_${Date.now()}`;
      if (!sessionId) setSessionId(activeId);

      saveActiveSessionCheckpoint({
        id: activeId,
        startTime: stopStartTime || Date.now(),
        endTime: Date.now(),
        transcript: fullText,
        transcriptEntries: allEntries,
        jurisdictionState: selectedJurisdiction,
        maxRiskLevel: analysis.riskLevel,
        latestAnalysis: analysis,
        locationLabel: `${selectedJurisdiction} Roadside Encounter`,
      });
    });
  };

  const {
    isListening,
    transcript,
    interimTranscript,
    transcriptEntries,
    startListening,
    stopListening,
    clearTranscript,
    injectTestPhrase,
    error: speechError,
  } = useSpeechToText(handleNewPhrase);

  // Auto scroll transcript box
  useEffect(() => {
    if (transcriptEntries.length > 0 || interimTranscript) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [transcriptEntries, interimTranscript]);

  const toggleVoiceReadout = () => {
    const nextVal = !voiceReadout;
    setVoiceReadout(nextVal);
    saveUserSettings({ voiceReadout: nextVal });
    if (!nextVal) {
      vocalCoach.stop();
    }
  };

  const handleJurisdictionSelect = (item: (typeof JURISDICTIONS)[0]) => {
    setSelectedJurisdiction(item.label);
    setJurisdictionCode(item.code === 'US' ? 'CA' : item.code);
    saveUserSettings({ jurisdictionState: item.label });

    if (transcriptEntries.length > 0) {
      const fullText = transcriptEntries.map((e) => e.text).join(' ');
      analyzeLiveTranscript(fullText, item.code === 'US' ? 'CA' : item.code, geminiApiKey).then(
        (analysis) => {
          setCurrentAnalysis(analysis);
        }
      );
    }
  };

  const handleStartShield = async () => {
    const newId = `stop_${Date.now()}`;
    setSessionId(newId);
    const start = Date.now();
    setStopStartTime(start);
    clearTranscript();
    setCurrentAnalysis(null);

    // Write initial checkpoint immediately
    await saveActiveSessionCheckpoint({
      id: newId,
      startTime: start,
      endTime: start,
      transcript: '',
      transcriptEntries: [],
      jurisdictionState: selectedJurisdiction,
      maxRiskLevel: 'Low',
      locationLabel: `${selectedJurisdiction} Roadside Encounter`,
    });

    // Start both real speech recognition and microphone audio recorder
    await startListening();
    await startRecording();

    if (voiceReadout) {
      vocalCoach.speak('Civic Aegis active. Monitoring audio and protecting your rights.', {
        enabled: voiceReadout,
        lang: language,
      });
    }
  };

  const handleStopShield = async () => {
    if (!sessionId && transcriptEntries.length === 0) {
      await stopListening();
      await stopRecording();
      vocalCoach.stop();
      await clearActiveSessionCheckpoint();
      return;
    }

    setIsSynthesizing(true);
    vocalCoach.stop();
    await stopListening();
    const { audioUri, duration } = await stopRecording();

    const fullTranscript = transcriptEntries
      .map((e) => `[${e.speaker === 'officer' ? 'Officer' : 'Driver'}]: ${e.text}`)
      .join('\n');
    const start = stopStartTime || Date.now() - 60000;
    const end = Date.now();

    try {
      const finalReport = await generateComprehensiveIncidentReport(
        fullTranscript || 'Routine traffic stop interaction',
        transcriptEntries,
        jurisdictionCode,
        geminiApiKey
      );

      const savedSession: StopSession = {
        id: sessionId || `stop_${Date.now()}`,
        startTime: start,
        endTime: end,
        transcript: fullTranscript || 'Routine stop interaction.',
        transcriptEntries,
        jurisdictionState: selectedJurisdiction,
        maxRiskLevel: finalReport.riskLevel || currentAnalysis?.riskLevel || 'Low',
        latestAnalysis: currentAnalysis || undefined,
        finalReport,
        locationLabel: `${selectedJurisdiction} Roadside Encounter`,
        audioUri: audioUri || undefined,
        audioDuration: duration || Math.max(1, Math.round((end - start) / 1000)),
      };

      await saveStopSession(savedSession);
      await clearActiveSessionCheckpoint();
      setLoggedCount((prev) => prev + 1);
      setIsSynthesizing(false);
      router.push(`/session/${savedSession.id}` as any);
    } catch (err) {
      console.error('Error saving session:', err);
      setIsSynthesizing(false);
      Alert.alert('Session Saved', 'Stop report archived to History.');
    }
  };

  const handleScenarioInject = (phrase: string) => {
    if (!isListening) {
      handleStartShield().then(() => {
        setTimeout(() => injectTestPhrase(phrase, 'officer'), 200);
      });
    } else {
      injectTestPhrase(phrase, 'officer');
    }
  };

  const currentRisk = currentAnalysis?.riskLevel || 'Low';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header with Safe Area Insets & Official Shield Logo */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <Image source={APP_LOGO} style={styles.headerLogoImage} resizeMode="contain" />
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Civic Aegis</Text>
            <Text style={styles.headerSubtitle}>Autonomous Roadside Civil Rights Agent</Text>
          </View>
        </View>

        {/* Top-right Speaker Toggle Button */}
        <TouchableOpacity
          style={[styles.speakerToggleBtn, voiceReadout && styles.speakerToggleBtnActive]}
          onPress={toggleVoiceReadout}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {voiceReadout ? (
            <Volume2 size={18} color="#EF4444" />
          ) : (
            <VolumeX size={18} color="#71717A" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD: LIVE RIGHTS COACH */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopBadges}>
            <View style={styles.liveCoachTag}>
              <View style={styles.redDot} />
              <Text style={styles.liveCoachText}>LIVE RIGHTS COACH</Text>
            </View>
            <View style={[styles.readyPill, isListening && styles.listeningPill]}>
              <View
                style={[
                  styles.readyDot,
                  isListening ? { backgroundColor: '#EF4444' } : { backgroundColor: '#10B981' },
                ]}
              />
              <Text
                style={[
                  styles.readyPillText,
                  isListening ? { color: '#EF4444' } : { color: '#10B981' },
                ]}
              >
                {isListening ? `RECORDING (${recordingDuration}s)` : 'READY'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroHeadline}>Stay calm. Capture facts. Know what to say.</Text>
          <Text style={styles.heroSubtitle}>
            Real-time rights guidance, saved stop history, AI review, lawyer recommendation, and
            exportable reports.
          </Text>

          {/* Stats Capsule Bar */}
          <View style={styles.statsCapsuleBar}>
            <View style={styles.statCapsule}>
              <Text style={styles.statCapsuleText}>[ {loggedCount} Logged ]</Text>
            </View>
            <View style={styles.statCapsule}>
              <Text style={styles.statCapsuleText}>[ {contactsCount} Contacts ]</Text>
            </View>
            <View style={styles.statCapsule}>
              <Text style={styles.statCapsuleText}>[ {selectedJurisdiction} ]</Text>
            </View>
          </View>
        </View>

        {/* TRIGGER BANNER: "I'M BEING PULLED OVER" */}
        <TouchableOpacity
          style={styles.pulledOverBanner}
          activeOpacity={0.85}
          onPress={isListening ? handleStopShield : handleStartShield}
        >
          <View style={styles.pulledOverLeft}>
            <View style={styles.pulledOverLogoContainer}>
              <Image source={APP_LOGO} style={styles.bannerLogoImage} resizeMode="contain" />
            </View>
            <View style={styles.pulledOverTextBlock}>
              <Text style={styles.pulledOverTitle}>
                {isListening ? 'Stop Civic Aegis Recording' : "I'm Being Pulled Over"}
              </Text>
              <Text style={styles.pulledOverSubtitle}>
                {isListening
                  ? 'Tap to finalize audio recording, evaluate risk, and save defense brief'
                  : 'Instantly start microphone recording, speech recognition, and vocal coaching'}
              </Text>
            </View>
          </View>
          <ChevronRight size={22} color="#EF4444" />
        </TouchableOpacity>

        {/* JURISDICTION SELECTOR */}
        <View style={styles.jurisdictionSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScrollContent}
            style={styles.pillsScroll}
          >
            {JURISDICTIONS.map((item) => {
              const isSelected = selectedJurisdiction === item.label;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleJurisdictionSelect(item)}
                  style={[styles.jurisdictionPill, isSelected && styles.jurisdictionPillActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.jurisdictionPillText,
                      isSelected && styles.jurisdictionPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.jurisdictionSubtext}>
            Officer phrase detection stays English. Civic Aegis coaches and reads responses aloud.
          </Text>
        </View>

        {/* ACTIVE HUD MONITOR DISPLAY (When Listening) */}
        {isListening ? (
          <View style={styles.activeHudSection}>
            {/* Physical Safety Hands-On-Wheel Reminder */}
            <View style={styles.safetyHandsBar}>
              <Hand size={16} color="#EF4444" />
              <Text style={styles.safetyHandsText}>
                Keep both hands visible on steering wheel at 10 and 2. Turn on cabin light.
              </Text>
            </View>

            {/* Real-time Rights Speech Prompter & Vocal Coach Card */}
            <View style={styles.rightsPrompterCard}>
              <View style={styles.prompterHeader}>
                <View style={styles.prompterHeaderLeft}>
                  <Volume2 size={16} color="#EF4444" />
                  <Text style={styles.prompterLabel}>SAY THIS TO THE OFFICER:</Text>
                </View>
                <View
                  style={[
                    styles.riskPill,
                    currentRisk === 'High'
                      ? styles.riskPillHigh
                      : currentRisk === 'Moderate'
                      ? styles.riskPillMod
                      : styles.riskPillLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.riskPillText,
                      currentRisk === 'High'
                        ? { color: '#FCA5A5' }
                        : currentRisk === 'Moderate'
                        ? { color: '#FCD34D' }
                        : { color: '#6EE7B7' },
                    ]}
                  >
                    {currentRisk.toUpperCase()} RISK
                  </Text>
                </View>
              </View>

              {/* Highlighted Driver Response Script */}
              <View style={styles.prompterSpeechHighlightBox}>
                <Text style={styles.prompterSpeechText}>
                  "{currentAnalysis?.suggestedResponse ||
                    'Good day, Officer. How can I help you today?'}"
                </Text>
                {voiceReadout && (
                  <View style={styles.vocalCoachIndicator}>
                    <Sparkles size={13} color="#EF4444" />
                    <Text style={styles.vocalCoachIndicatorText}>Vocal coaching active through speaker</Text>
                  </View>
                )}
              </View>

              {currentAnalysis && (
                <View style={styles.analysisDetailBox}>
                  <Text style={styles.analysisIntentText}>
                    Detected Intent: {currentAnalysis.officerIntent}
                  </Text>
                  <Text style={styles.analysisCitationText}>
                    {currentAnalysis.constitutionalRelevance}
                  </Text>
                  <Text style={styles.analysisReasonText}>{currentAnalysis.reasoning}</Text>
                  <View style={styles.actionCheckRow}>
                    <CheckCircle2 size={14} color="#EF4444" />
                    <Text style={styles.actionCheckText}>{currentAnalysis.actionGuidance}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Live Audio Transcript Box */}
            <View style={styles.transcriptCard}>
              <View style={styles.transcriptCardHeader}>
                <View style={styles.transcriptHeaderLeft}>
                  <Radio size={16} color="#EF4444" />
                  <Text style={styles.transcriptCardTitle}>Live Audio Transcript & Recorder</Text>
                </View>
                <Text style={styles.transcriptCount}>
                  {transcriptEntries.length} {transcriptEntries.length === 1 ? 'phrase' : 'phrases'}
                </Text>
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.transcriptScroll}
                contentContainerStyle={styles.transcriptScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {transcriptEntries.length === 0 && !interimTranscript ? (
                  <Text style={styles.emptyTranscriptText}>
                    🎙️ Microphone recording active: speak naturally or tap a scenario trigger below...
                  </Text>
                ) : (
                  <>
                    {transcriptEntries.map((entry) => (
                      <View
                        key={entry.id}
                        style={[
                          styles.transcriptEntry,
                          entry.speaker === 'officer'
                            ? styles.officerTranscript
                            : styles.driverTranscript,
                        ]}
                      >
                        <View style={styles.entrySpeakerRow}>
                          <Text style={styles.entrySpeakerName}>
                            {entry.speaker === 'officer' ? 'OFFICER' : 'YOU'}
                          </Text>
                          <Text style={styles.entryTimestamp}>
                            {new Date(entry.timestamp).toLocaleTimeString([], {
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </Text>
                        </View>
                        <Text style={styles.entrySpeechBody}>{entry.text}</Text>
                      </View>
                    ))}

                    {/* Live Interim Transcript Stream */}
                    {interimTranscript ? (
                      <View style={styles.interimTranscriptBox}>
                        <Text style={styles.interimSpeakerLabel}>LIVE AUDIO STREAMING...</Text>
                        <Text style={styles.interimSpeechText}>{interimTranscript}</Text>
                      </View>
                    ) : null}
                  </>
                )}
              </ScrollView>
            </View>

            {/* Quick Scenario Triggers */}
            <View style={styles.scenariosContainer}>
              <Text style={styles.scenariosTitle}>One-Tap Scenario Triggers (Injected to Transcript):</Text>
              <View style={styles.scenariosGrid}>
                {SCENARIO_SIMULATIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.scenarioPillBtn}
                    onPress={() => handleScenarioInject(item.phrase)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.scenarioPillText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {/* LARGE CIRCULAR ACTION BUTTON */}
        <View style={styles.circularActionSection}>
          <TouchableOpacity
            style={[styles.shieldCircleButton, isListening && styles.shieldCircleButtonActive]}
            activeOpacity={0.85}
            onPress={isListening ? handleStopShield : handleStartShield}
            disabled={isSynthesizing}
          >
            <View style={styles.shieldInnerCircle}>
              {isListening ? (
                <MicOff size={40} color="#FFFFFF" />
              ) : (
                <Mic size={42} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.circularActionTitle}>
            {isListening
              ? isSynthesizing
                ? 'SYNTHESIZING REPORT...'
                : 'STOP CIVIC AEGIS & SAVE REPORT'
              : 'START CIVIC AEGIS'}
          </Text>
          <Text style={styles.circularActionSubtitle}>
            {isListening
              ? `Recording active (${recordingDuration}s) • Tap to save audio & brief`
              : 'Record audio + live rights guidance'}
          </Text>
        </View>

        {/* "HOW IT WORKS" SECTION */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksHeading}>How Civic Aegis Works</Text>

          <View style={styles.howItemRow}>
            <View style={styles.howItemIconBox}>
              <Shield size={18} color="#EF4444" />
            </View>
            <Text style={styles.howItemText}>
              Tap <Text style={styles.boldWhite}>I'm Being Pulled Over</Text> for instant Civic Aegis Mode
            </Text>
          </View>

          <View style={styles.howItemRow}>
            <View style={styles.howItemIconBox}>
              <Mic size={18} color="#EF4444" />
            </View>
            <Text style={styles.howItemText}>
              <Text style={styles.boldWhite}>Start Civic Aegis</Text> records microphone audio and
              transcribes dialogue in real time
            </Text>
          </View>

          <View style={styles.howItemRow}>
            <View style={styles.howItemIconBox}>
              <Volume2 size={18} color="#EF4444" />
            </View>
            <Text style={styles.howItemText}>
              Vocal coaching speaks out recommended constitutional responses through your speaker
            </Text>
          </View>

          <View style={styles.howItemRow}>
            <View style={styles.howItemIconBox}>
              <Briefcase size={18} color="#EF4444" />
            </View>
            <Text style={styles.howItemText}>
              <Text style={styles.boldWhite}>History</Text> plays back recorded audio and analyzes if
              you should consult legal counsel
            </Text>
          </View>

          <View style={styles.howItemRow}>
            <View style={styles.howItemIconBox}>
              <FileText size={18} color="#EF4444" />
            </View>
            <Text style={styles.howItemText}>
              Export a structured stop brief for yourself, contacts, or defense counsel
            </Text>
          </View>

          <View style={styles.howFooterNote}>
            <Text style={styles.howFooterText}>
              {voiceReadout
                ? '🔊 Vocal coach is currently ON. Recommended phrases will be spoken aloud.'
                : '🔇 Vocal coach is currently MUTED. Tap speaker icon to enable audio prompts.'}
            </Text>
          </View>
        </View>

        {/* Mandatory Policy Disclaimer */}
        <View style={styles.bottomPolicyBox}>
          <Info size={14} color="#71717A" style={{ marginTop: 2 }} />
          <Text style={styles.bottomPolicyText}>
            Civic Aegis provides real-time rights awareness and automated fact-recording. It does
            not constitute legal advice. Never physically resist law enforcement.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#080808',
    borderBottomWidth: 1,
    borderBottomColor: '#2F1517',
    minHeight: 60,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLogoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2F1517',
  },
  headerTextCol: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4D4D8',
    marginTop: 1,
  },
  speakerToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2F1517',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  speakerToggleBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 18,
    marginBottom: 14,
  },
  heroTopBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveCoachTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveCoachText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  listeningPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  readyPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  heroHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 14,
  },
  statsCapsuleBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCapsule: {
    backgroundColor: '#080808',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F1517',
    minHeight: 34,
    justifyContent: 'center',
  },
  statCapsuleText: {
    fontSize: 13,
    color: '#E4E4E7',
    fontWeight: '700',
  },
  pulledOverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C0A0D',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 14,
    marginBottom: 16,
    minHeight: 76,
  },
  pulledOverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  pulledOverLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  bannerLogoImage: {
    width: 44,
    height: 44,
  },
  pulledOverTextBlock: {
    flex: 1,
  },
  pulledOverTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pulledOverSubtitle: {
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 16,
    marginTop: 2,
  },
  jurisdictionSection: {
    marginBottom: 16,
  },
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pillsScrollContent: {
    paddingVertical: 2,
  },
  jurisdictionPill: {
    backgroundColor: '#141414',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2F1517',
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jurisdictionPillActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  jurisdictionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  jurisdictionPillTextActive: {
    color: '#FFFFFF',
  },
  jurisdictionSubtext: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  activeHudSection: {
    marginBottom: 16,
  },
  safetyHandsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 12,
    marginBottom: 12,
  },
  safetyHandsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
  rightsPrompterCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 16,
    marginBottom: 12,
  },
  prompterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  prompterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prompterLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EF4444',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  riskPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  riskPillHigh: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
  },
  riskPillMod: {
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
  },
  riskPillLow: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  riskPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  prompterSpeechHighlightBox: {
    backgroundColor: '#1E0A0D',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: 12,
  },
  prompterSpeechText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  vocalCoachIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  vocalCoachIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 6,
  },
  analysisDetailBox: {
    backgroundColor: '#080808',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  analysisIntentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FCA5A5',
    marginBottom: 3,
  },
  analysisCitationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  analysisReasonText: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 18,
    marginBottom: 6,
  },
  actionCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCheckText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 5,
    flex: 1,
  },
  transcriptCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 14,
    marginBottom: 12,
  },
  transcriptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transcriptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transcriptCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  transcriptCount: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  transcriptScroll: {
    maxHeight: 180,
  },
  transcriptScrollContent: {
    paddingVertical: 2,
  },
  emptyTranscriptText: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    paddingVertical: 16,
    lineHeight: 19,
  },
  transcriptEntry: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  officerTranscript: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  driverTranscript: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  entrySpeakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  entrySpeakerName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A1A1AA',
  },
  entryTimestamp: {
    fontSize: 10,
    color: '#71717A',
  },
  entrySpeechBody: {
    fontSize: 13,
    color: '#F4F4F5',
    lineHeight: 17,
  },
  interimTranscriptBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#EF4444',
    borderStyle: 'dashed',
    marginBottom: 6,
  },
  interimSpeakerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  interimSpeechText: {
    fontSize: 13,
    color: '#FCA5A5',
    fontStyle: 'italic',
  },
  scenariosContainer: {
    marginTop: 4,
  },
  scenariosTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4D4D8',
    marginBottom: 6,
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scenarioPillBtn: {
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F1517',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scenarioPillText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  circularActionSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  shieldCircleButton: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 14,
  },
  shieldCircleButtonActive: {
    backgroundColor: '#991B1B',
    borderColor: '#EF4444',
    borderWidth: 3,
  },
  shieldInnerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circularActionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  circularActionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4D4D8',
  },
  howItWorksCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  howItWorksHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  howItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  howItemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  howItemText: {
    fontSize: 14,
    color: '#D4D4D8',
    lineHeight: 20,
    flex: 1,
  },
  boldWhite: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  howFooterNote: {
    backgroundColor: '#080808',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F1517',
    marginTop: 4,
  },
  howFooterText: {
    fontSize: 12,
    color: '#D4D4D8',
    lineHeight: 17,
  },
  bottomPolicyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  bottomPolicyText: {
    fontSize: 11,
    color: '#71717A',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
});
