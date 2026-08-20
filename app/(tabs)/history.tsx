import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Clock,
  Trash2,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Scale,
  Calendar,
  Share2,
  Check,
} from 'lucide-react-native';

import {
  getAllStopSessions,
  deleteStopSession,
  clearAllStopSessions,
  StopSession,
} from '../../services/storage';
import { AudioPlayer } from '../../components/AudioPlayer';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<StopSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const data = await getAllStopSessions();
    setSessions(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleExportShare = async (item: StopSession) => {
    const dateStr = new Date(item.startTime).toLocaleDateString();
    const timeStr = new Date(item.startTime).toLocaleTimeString();
    const briefText = `=== CIVIC AEGIS ROADSIDE STOP REPORT ===
Incident Ref: ${item.id}
Date/Time: ${dateStr} at ${timeStr}
Jurisdiction: ${item.jurisdictionState} Law
Risk Evaluation: ${item.maxRiskLevel.toUpperCase()}
Attorney Consultation Recommended: ${item.finalReport?.shouldContactLawyer ? 'YES (' + item.finalReport.lawyerType + ')' : 'NO'}

TRANSCRIPT OF AUDIO ENCOUNTER:
${item.transcript}

KEY FINDINGS:
${(item.finalReport?.keyFindings || ['Standard verification stop']).map((f) => '• ' + f).join('\n')}

RECOMMENDED ACTION ITEMS:
${(item.finalReport?.recommendedNextSteps || ['Archive record']).map((s) => '• ' + s).join('\n')}

Generated autonomously by Civic Aegis.`;

    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(briefText);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
      alert('Civic Aegis stop report copied to clipboard.');
    } else {
      try {
        await Share.share({
          message: briefText,
          title: `Civic Aegis Report - ${item.id}`,
        });
      } catch (err) {
        console.error('Error sharing report:', err);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this incident log?')) {
        deleteStopSession(id).then(loadSessions);
      }
    } else {
      Alert.alert('Delete Log', 'Permanently delete this incident log?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteStopSession(id).then(loadSessions),
        },
      ]);
    }
  };

  const handleClearAll = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear all history logs?')) {
        clearAllStopSessions().then(loadSessions);
      }
    } else {
      Alert.alert('Clear History', 'This will delete all saved traffic stop sessions.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAllStopSessions().then(loadSessions),
        },
      ]);
    }
  };

  const getRiskColor = (risk: string) => {
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

  const renderSessionItem = ({ item }: { item: StopSession }) => {
    const risk = getRiskColor(item.maxRiskLevel);
    const RiskIcon = risk.Icon;
    const isCopied = copiedId === item.id;

    const dateStr = new Date(item.startTime).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = new Date(item.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const durationSeconds = item.audioDuration || Math.max(1, Math.round((item.endTime - item.startTime) / 1000));

    return (
      <View style={styles.sessionCard}>
        {/* Top Meta Row */}
        <View style={styles.cardTopRow}>
          <View style={styles.dateBlock}>
            <Calendar size={14} color="#71717A" />
            <Text style={styles.dateText}>
              {dateStr} • {timeStr}
            </Text>
          </View>

          {/* Risk Badge */}
          <View
            style={[
              styles.riskBadge,
              { backgroundColor: risk.bg, borderColor: risk.border },
            ]}
          >
            <RiskIcon size={12} color={risk.border} />
            <Text style={[styles.riskBadgeText, { color: risk.text }]}>
              {item.maxRiskLevel.toUpperCase()} RISK
            </Text>
          </View>
        </View>

        {/* Location & Jurisdiction Title */}
        <Text style={styles.locationTitle}>
          {item.locationLabel || `${item.jurisdictionState} Encounter`}
        </Text>

        {/* Real Audio Player Component */}
        <AudioPlayer
          audioUri={item.audioUri}
          durationSeconds={durationSeconds}
          label={item.audioUri ? 'Recorded Stop Audio' : 'Audio Stream Log'}
        />

        {/* Transcript Preview Box */}
        <View style={styles.transcriptBox}>
          <View style={styles.transcriptHeader}>
            <FileText size={12} color="#71717A" />
            <Text style={styles.transcriptHeaderLabel}>INCIDENT TRANSCRIPT</Text>
          </View>
          <Text style={styles.transcriptPreview} numberOfLines={3}>
            {item.transcript || 'No verbal audio recorded during stop.'}
          </Text>
        </View>

        {/* Lawyer advice indicator if applicable */}
        {item.finalReport?.shouldContactLawyer && (
          <View style={styles.lawyerBadge}>
            <Scale size={14} color="#EF4444" />
            <Text style={styles.lawyerBadgeText}>
              Legal Counsel Recommended: {item.finalReport.lawyerType} ({item.finalReport.urgency} Urgency)
            </Text>
          </View>
        )}

        {/* Bottom Actions Row */}
        <View style={styles.cardBottomRow}>
          <TouchableOpacity
            style={styles.exportBriefBtn}
            onPress={() => handleExportShare(item)}
            activeOpacity={0.8}
          >
            {isCopied ? (
              <Check size={16} color="#10B981" />
            ) : (
              <Share2 size={16} color="#EF4444" />
            )}
            <Text style={[styles.exportBriefText, isCopied && { color: '#10B981' }]}>
              {isCopied ? 'Report Copied' : 'Export Stop Report'}
            </Text>
          </TouchableOpacity>

          <View style={styles.rightActionBtns}>
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => handleDelete(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => router.push(`/session/${item.id}` as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDetailsText}>Full Brief</Text>
              <ChevronRight size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconCircle}>
            <Clock size={20} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Stop History</Text>
            <Text style={styles.headerSubtitle}>Saved encounters & legal defense briefs</Text>
          </View>
        </View>

        {sessions.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll} activeOpacity={0.8}>
            <Trash2 size={14} color="#EF4444" />
            <Text style={styles.clearAllText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={48} color="#27272A" />
          <Text style={styles.emptyTitle}>No Recorded Incidents</Text>
          <Text style={styles.emptySubtitle}>
            When you activate Civic Aegis during traffic stops, ambient audio recordings, transcripts,
            and attorney defense reports will be securely stored here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#080808',
    borderBottomWidth: 1,
    borderBottomColor: '#2F1517',
    minHeight: 56,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#D4D4D8',
    marginTop: 1,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    minHeight: 36,
  },
  clearAllText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: '#D4D4D8',
    marginLeft: 6,
    fontWeight: '600',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  transcriptBox: {
    backgroundColor: '#080808',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transcriptHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A1A1AA',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  transcriptPreview: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 18,
  },
  lawyerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  lawyerBadgeText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 6,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2F1517',
    paddingTop: 10,
    minHeight: 48,
  },
  exportBriefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  exportBriefText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 4,
  },
  rightActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteIconButton: {
    padding: 8,
    marginRight: 6,
    minHeight: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 36,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginRight: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 19,
  },
});
