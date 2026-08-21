import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Share2,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  Sparkles,
  Info,
} from 'lucide-react-native';

import { getStopSessionById, StopSession } from '../../services/storage';
import { LawyerRecommendationPayload } from '../../services/aiService';
import { AudioPlayer } from '../../components/AudioPlayer';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<StopSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      getStopSessionById(id).then((data) => {
        setSession(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>Loading Incident Record...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Incident Record Not Found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const report: LawyerRecommendationPayload | undefined = session.finalReport;
  const risk = session.maxRiskLevel || report?.riskLevel || 'Low';

  const getRiskStyles = () => {
    switch (risk) {
      case 'High':
        return { bg: '#450A0A', border: '#EF4444', text: '#FCA5A5', Icon: ShieldAlert };
      case 'Moderate':
        return { bg: '#451A03', border: '#F59E0B', text: '#FCD34D', Icon: AlertTriangle };
      case 'Low':
      default:
        return { bg: '#064E3B', border: '#10B981', text: '#6EE7B7', Icon: ShieldCheck };
    }
  };

  const riskStyle = getRiskStyles();
  const RiskIcon = riskStyle.Icon;

  const dateFormatted = new Date(session.startTime).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = new Date(session.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const durationSeconds = session.audioDuration || Math.max(1, Math.round((session.endTime - session.startTime) / 1000));

  const generateMarkdownBrief = () => {
    return `# CIVIC AEGIS ROADWAY INCIDENT BRIEF
- **Date & Time:** ${dateFormatted} at ${timeFormatted}
- **Jurisdiction:** ${session.jurisdictionState} Law
- **Duration:** ${durationSeconds} seconds
- **Incident Risk Level:** ${risk.toUpperCase()}

## Attorney Consultation Recommendation
- **Should Contact Counsel:** ${report?.shouldContactLawyer ? 'YES' : 'NO'}
- **Recommended Practice Area:** ${report?.lawyerType || 'Traffic Defense'}
- **Urgency Level:** ${report?.urgency || 'Low'}

### Key Incident Findings:
${(report?.keyFindings || ['Standard verification stop']).map((f) => `- ${f}`).join('\n')}

### Recommended Next Steps for Legal Defense:
${(report?.recommendedNextSteps || ['Archive record']).map((s) => `- ${s}`).join('\n')}

## Complete Roadside Audio Transcript
${session.transcript}

---
*Disclaimer: ${report?.legalDisclaimer || 'Civic Aegis provides automated informational legal summaries, not formal legal counsel.'}*`;
  };

  const handleCopyReport = () => {
    const brief = generateMarkdownBrief();
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareReport = async () => {
    const brief = generateMarkdownBrief();
    try {
      if (Platform.OS === 'web') {
        handleCopyReport();
        Alert.alert('Copied', 'Incident brief copied to clipboard.');
      } else {
        await Share.share({
          message: brief,
          title: 'Civic Aegis Incident Brief',
        });
      }
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Top Bar Actions */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color="#EF4444" />
          <Text style={styles.backButtonText}>History</Text>
        </TouchableOpacity>

        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>Attorney Incident Brief</Text>
          <Text style={styles.topBarSubtitle}>AI Legal Synthesis & Case Evaluation</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleCopyReport}
            activeOpacity={0.8}
          >
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color="#EF4444" />}
            <Text style={[styles.actionBtnText, copied && { color: '#10B981' }]}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={handleShareReport}
            activeOpacity={0.8}
          >
            <Share2 size={16} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Incident Summary Header */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.jurisdictionTag}>
              <MapPin size={12} color="#EF4444" />
              <Text style={styles.jurisdictionTagText}>{session.jurisdictionState}</Text>
            </View>

            <View
              style={[
                styles.riskBadge,
                { backgroundColor: riskStyle.bg, borderColor: riskStyle.border },
              ]}
            >
              <RiskIcon size={14} color={riskStyle.border} />
              <Text style={[styles.riskBadgeText, { color: riskStyle.text }]}>
                {risk.toUpperCase()} RISK
              </Text>
            </View>
          </View>

          <Text style={styles.summaryTitle}>
            {session.locationLabel || 'Roadside Police Encounter'}
          </Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Calendar size={13} color="#71717A" />
              <Text style={styles.metaText}>{dateFormatted}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={13} color="#71717A" />
              <Text style={styles.metaText}>
                {timeFormatted} ({durationSeconds}s duration)
              </Text>
            </View>
          </View>
        </View>

        {/* Real Audio Player in Incident Brief */}
        <AudioPlayer
          audioUri={session.audioUri}
          durationSeconds={durationSeconds}
          label={session.audioUri ? 'Roadside Stop Voice Audio' : 'Audio Encounter Log'}
        />

        {/* Lawyer Recommendation Matrix */}
        <View style={styles.lawyerCard}>
          <View style={styles.lawyerHeader}>
            <Scale size={20} color="#EF4444" />
            <Text style={styles.lawyerTitle}>Legal Counsel Evaluation</Text>
          </View>

          <View style={styles.recommendationBadgeRow}>
            <View
              style={[
                styles.recStatusBadge,
                report?.shouldContactLawyer ? styles.recStatusYes : styles.recStatusNo,
              ]}
            >
              <Text
                style={[
                  styles.recStatusText,
                  report?.shouldContactLawyer
                    ? styles.recStatusTextYes
                    : styles.recStatusTextNo,
                ]}
              >
                {report?.shouldContactLawyer
                  ? 'ATTORNEY CONSULTATION ADVISED'
                  : 'ROUTINE STOP • NO COUNSEL REQUIRED'}
              </Text>
            </View>

            {report?.urgency && (
              <View style={styles.urgencyBadge}>
                <Text style={styles.urgencyText}>Urgency: {report.urgency}</Text>
              </View>
            )}
          </View>

          {report?.shouldContactLawyer && (
            <View style={styles.lawyerTypeBox}>
              <Text style={styles.lawyerTypeLabel}>Recommended Legal Specialty:</Text>
              <Text style={styles.lawyerTypeValue}>{report.lawyerType}</Text>
            </View>
          )}

          {/* Key Findings */}
          <Text style={styles.sectionSubTitle}>Synthesized Legal Findings</Text>
          <View style={styles.bulletList}>
            {(report?.keyFindings || ['Routine traffic verification.']).map((finding, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Sparkles size={14} color="#EF4444" style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{finding}</Text>
              </View>
            ))}
          </View>

          {/* Recommended Next Steps */}
          <Text style={styles.sectionSubTitle}>Recommended Defense Action Items</Text>
          <View style={styles.bulletList}>
            {(
              report?.recommendedNextSteps || ['Archive incident log for personal records.']
            ).map((step, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.bulletText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Complete Interaction Transcript */}
        <View style={styles.transcriptCard}>
          <View style={styles.transcriptHeader}>
            <FileText size={18} color="#A1A1AA" />
            <Text style={styles.transcriptTitle}>Complete Roadside Audio Transcript</Text>
          </View>

          {session.transcriptEntries && session.transcriptEntries.length > 0 ? (
            session.transcriptEntries.map((entry, idx) => (
              <View
                key={entry.id || idx}
                style={[
                  styles.transcriptEntryItem,
                  entry.speaker === 'officer'
                    ? styles.officerEntry
                    : styles.userEntry,
                ]}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entrySpeaker}>
                    {entry.speaker === 'officer' ? 'OFFICER' : 'YOU'}
                  </Text>
                  <Text style={styles.entryTime}>
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.entryBody}>{entry.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.rawTranscriptText}>
              {session.transcript || 'No transcript text available.'}
            </Text>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Info size={14} color="#71717A" />
          <Text style={styles.disclaimerText}>
            {report?.legalDisclaimer ||
              'Civic Aegis provides automated analytical summaries. It does not constitute formal legal counsel.'}
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 15,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#141414',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#080808',
    borderBottomWidth: 1,
    borderBottomColor: '#2F1517',
    minHeight: 56,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButtonText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 2,
  },
  topBarTitleCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  topBarSubtitle: {
    fontSize: 11,
    color: '#D4D4D8',
    marginTop: 1,
    textAlign: 'center',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F1517',
    marginLeft: 8,
    minHeight: 38,
  },
  actionBtnText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 4,
  },
  shareBtn: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  shareBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 4,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 16,
    marginBottom: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jurisdictionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F1517',
  },
  jurisdictionTagText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  metaGrid: {
    flexDirection: 'column',
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#A1A1AA',
    marginLeft: 6,
  },
  lawyerCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 16,
    marginBottom: 16,
  },
  lawyerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lawyerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  recommendationBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  recStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  recStatusYes: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  recStatusNo: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  recStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recStatusTextYes: {
    color: '#FCA5A5',
  },
  recStatusTextNo: {
    color: '#6EE7B7',
  },
  urgencyBadge: {
    backgroundColor: '#080808',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2F1517',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  lawyerTypeBox: {
    backgroundColor: '#080808',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginBottom: 14,
  },
  lawyerTypeLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  lawyerTypeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 2,
  },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  bulletList: {
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bulletText: {
    fontSize: 15,
    color: '#E4E4E7',
    lineHeight: 22,
    flex: 1,
  },
  transcriptCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 16,
    marginBottom: 16,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  transcriptEntryItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  officerEntry: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  userEntry: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entrySpeaker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A1A1AA',
  },
  entryTime: {
    fontSize: 11,
    color: '#71717A',
  },
  entryBody: {
    fontSize: 15,
    color: '#F4F4F5',
    lineHeight: 22,
  },
  rawTranscriptText: {
    fontSize: 15,
    color: '#E4E4E7',
    lineHeight: 22,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#71717A',
    lineHeight: 15,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
});
