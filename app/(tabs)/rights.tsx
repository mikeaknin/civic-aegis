import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Volume2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Shield,
  Info,
  HelpCircle,
  Gavel,
} from 'lucide-react-native';

import {
  CONSTITUTIONAL_RIGHTS,
  ConstitutionalRightItem,
  JURISDICTION_STATE_DATABASE,
  LEGAL_DISCLAIMER,
  ABSOLUTE_NON_RESISTANCE_POLICY,
} from '../../constants/legalSafety';

interface FAQItem {
  question: string;
  answer: string;
  citation: string;
}

const ROADSIDE_FAQS: FAQItem[] = [
  {
    question: 'Do I have to roll my window all the way down?',
    answer:
      'Most state laws require rolling down the window sufficiently to communicate and pass required documents (usually halfway). Officers may request lowering it further for safety, which you should comply with calmly.',
    citation: 'General Officer Safety & State Vehicle Codes',
  },
  {
    question: 'Can police search my locked glove box or trunk without consent?',
    answer:
      'No, unless they possess a valid search warrant, clear probable cause (e.g., plain view contraband, distinct odor of illicit substances in non-recreational states), or you are lawfully arrested.',
    citation: '4th Amendment & Arizona v. Gant (2009)',
  },
  {
    question: 'Am I required to take a Field Sobriety Test (FST) before arrest?',
    answer:
      'In nearly all states, physical roadside field sobriety tests (such as walking a line or following a pen) are voluntary. However, post-arrest chemical tests (breath/blood) are subject to Implied Consent laws.',
    citation: '5th Amendment & State Implied Consent Statutes',
  },
  {
    question: 'Can passengers be ordered out of the vehicle?',
    answer:
      'Yes. Under Maryland v. Wilson (1997), officers have lawful authority to order both drivers and passengers out of a vehicle during a traffic stop for safety.',
    citation: 'Maryland v. Wilson, 519 U.S. 408 (1997)',
  },
  {
    question: 'What is the difference between detention and arrest?',
    answer:
      'Detention is a temporary investigative stop requiring Reasonable Articulable Suspicion (RAS). You are not free to leave, but you are not under formal arrest. You may ask: "Officer, am I free to go, or am I being detained?"',
    citation: 'Terry v. Ohio, 392 U.S. 1 (1968)',
  },
];

const SIXTH_AMENDMENT_INFO: ConstitutionalRightItem = {
  id: 'sixth-amendment',
  amendment: 'Sixth Amendment',
  title: 'Right to Legal Counsel & Formal Accusation',
  shortRule: 'You have the right to speak with an attorney before custodial interrogation.',
  practicalScript: 'Officer, I will not answer questions or participate in questioning without my lawyer present.',
  detailedExplanation:
    'Under the 6th Amendment and Miranda v. Arizona, once in custody, interrogation must cease immediately once you invoke your right to legal counsel. You also have the right to know the precise infraction or accusation.',
  dosAndDonts: {
    dos: [
      'Unambiguously declare: "I want to speak with an attorney."',
      'Remain silent once you have invoked counsel.',
      'Ask for a copy of the citation or incident number.',
    ],
    donts: [
      'Do not engage in casual conversation after invoking your lawyer.',
      'Do not sign confessions or waivers without attorney review.',
      'Do not physically resist if placed in handcuffs.',
    ],
  },
};

export default function RightsGuideScreen() {
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string>('fifth-amendment');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<string>('CA');

  const allRights = [...CONSTITUTIONAL_RIGHTS, SIXTH_AMENDMENT_INFO];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? '' : id);
  };

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const selectedStateData =
    JURISDICTION_STATE_DATABASE[selectedStateCode] || JURISDICTION_STATE_DATABASE['CA'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconCircle}>
            <BookOpen size={20} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Constitutional Rights</Text>
            <Text style={styles.headerSubtitle}>Verified legal scripts & case precedent</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Safety Directive Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertHeader}>
            <Shield size={18} color="#EF4444" />
            <Text style={styles.alertTitle}>Absolute Non-Resistance Policy</Text>
          </View>
          <Text style={styles.alertText}>
            Assert your rights <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>verbally and calmly</Text>.
            Never physically resist, pull away, or argue aggressively with officers. Verbal non-consent
            protects your evidence for court and attorney defense.
          </Text>
        </View>

        {/* State Jurisdiction Profile */}
        <View style={styles.jurisdictionCard}>
          <View style={styles.jurisdictionHeader}>
            <MapPin size={16} color="#EF4444" />
            <Text style={styles.jurisdictionTitle}>State Jurisdiction Legal Profile</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateChipList}>
            {Object.keys(JURISDICTION_STATE_DATABASE).map((code) => {
              const active = selectedStateCode === code;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => setSelectedStateCode(code)}
                  style={[styles.stateChip, active && styles.stateChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.stateChipText, active && styles.stateChipTextActive]}>
                    {JURISDICTION_STATE_DATABASE[code].stateName} ({code})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.stateDetailBox}>
            <View style={styles.stateMetaRow}>
              <Text style={styles.stateMetaLabel}>Stop & Identify Law:</Text>
              <Text style={styles.stateMetaValue}>
                {selectedStateData.stopAndIdentify
                  ? 'Mandatory for Lawfully Detained Drivers'
                  : 'Driver License & Insurance Mandatory on Demand'}
              </Text>
            </View>
            <View style={styles.stateMetaRow}>
              <Text style={styles.stateMetaLabel}>Audio Recording Consent:</Text>
              <Text style={styles.stateMetaValue}>{selectedStateData.recordingConsent}</Text>
            </View>
            <View style={styles.stateMetaRow}>
              <Text style={styles.stateMetaLabel}>Statutory Vehicle Mandate:</Text>
              <Text style={styles.stateMetaValue}>{selectedStateData.vehicleCodeSummary}</Text>
            </View>
          </View>
        </View>

        {/* Constitutional Protections Accordion */}
        <Text style={styles.sectionHeaderTitle}>Constitutional Amendments & Scripts</Text>

        {allRights.map((item: ConstitutionalRightItem) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                activeOpacity={0.8}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.amendmentTag}>{item.amendment}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={22} color="#A1A1AA" />
                ) : (
                  <ChevronDown size={22} color="#A1A1AA" />
                )}
              </TouchableOpacity>

              <Text style={styles.shortRuleText}>{item.shortRule}</Text>

              {/* Exact Script to Speak */}
              <View style={styles.scriptContainer}>
                <View style={styles.scriptHeader}>
                  <Volume2 size={15} color="#EF4444" />
                  <Text style={styles.scriptLabel}>EXACT VERBAL SCRIPT TO SPEAK:</Text>
                </View>
                <Text style={styles.scriptText}>"{item.practicalScript}"</Text>
              </View>

              {isExpanded && (
                <View style={styles.expandedDetails}>
                  <Text style={styles.detailedExplanation}>{item.detailedExplanation}</Text>

                  {/* Dos and Don'ts */}
                  <View style={styles.dosDontsGrid}>
                    <View style={styles.dosColumn}>
                      <View style={styles.dosHeader}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={styles.dosTitle}>DO</Text>
                      </View>
                      {item.dosAndDonts.dos.map((doItem, i) => (
                        <Text key={i} style={styles.doItemText}>
                          • {doItem}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.dontsColumn}>
                      <View style={styles.dontsHeader}>
                        <XCircle size={14} color="#EF4444" />
                        <Text style={styles.dontsTitle}>DON'T</Text>
                      </View>
                      {item.dosAndDonts.donts.map((dontItem, i) => (
                        <Text key={i} style={styles.dontItemText}>
                          • {dontItem}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Roadside Encounter FAQs */}
        <Text style={styles.sectionHeaderTitle}>Roadside Legal FAQ & Precedent</Text>

        {ROADSIDE_FAQS.map((faq, idx) => {
          const isFaqOpen = expandedFaq === idx;
          return (
            <View key={idx} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                activeOpacity={0.8}
                onPress={() => toggleFaq(idx)}
              >
                <View style={styles.faqTitleBlock}>
                  <HelpCircle size={16} color="#EF4444" style={styles.faqIcon} />
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                </View>
                {isFaqOpen ? (
                  <ChevronUp size={20} color="#A1A1AA" />
                ) : (
                  <ChevronDown size={20} color="#A1A1AA" />
                )}
              </TouchableOpacity>

              {isFaqOpen && (
                <View style={styles.faqAnswerBlock}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  <View style={styles.citationRow}>
                    <Gavel size={13} color="#F59E0B" />
                    <Text style={styles.citationText}>Precedent: {faq.citation}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Bottom Legal Disclaimer */}
        <View style={styles.footerDisclaimer}>
          <Info size={14} color="#71717A" />
          <Text style={styles.footerDisclaimerText}>{LEGAL_DISCLAIMER}</Text>
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
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  alertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 14,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
    marginLeft: 6,
  },
  alertText: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 19,
  },
  jurisdictionCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 14,
    marginBottom: 20,
  },
  jurisdictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  jurisdictionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  stateChipList: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#2F1517',
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateChipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  stateChipText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  stateChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stateDetailBox: {
    backgroundColor: '#080808',
    borderRadius: 8,
    padding: 12,
  },
  stateMetaRow: {
    marginBottom: 6,
  },
  stateMetaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  stateMetaValue: {
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 2,
    lineHeight: 17,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 48,
  },
  cardTitleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  amendmentTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shortRuleText: {
    fontSize: 13,
    color: '#D4D4D8',
    lineHeight: 18,
    marginBottom: 12,
  },
  scriptContainer: {
    backgroundColor: '#080808',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    padding: 12,
    marginBottom: 10,
  },
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scriptLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  scriptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  expandedDetails: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2F1517',
    paddingTop: 12,
  },
  detailedExplanation: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 19,
    marginBottom: 14,
  },
  dosDontsGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  dosColumn: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 10,
  },
  dosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dosTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    marginLeft: 6,
  },
  doItemText: {
    fontSize: 12,
    color: '#F4F4F5',
    lineHeight: 17,
    marginBottom: 4,
  },
  dontsColumn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 10,
  },
  dontsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dontsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    marginLeft: 6,
  },
  dontItemText: {
    fontSize: 12,
    color: '#F4F4F5',
    lineHeight: 17,
    marginBottom: 4,
  },
  faqCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 14,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  faqTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  faqIcon: {
    marginRight: 8,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 19,
  },
  faqAnswerBlock: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2F1517',
    paddingTop: 10,
  },
  faqAnswerText: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 19,
    marginBottom: 8,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citationText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 5,
  },
  footerDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  footerDisclaimerText: {
    fontSize: 11,
    color: '#71717A',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
});
