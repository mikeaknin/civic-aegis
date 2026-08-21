import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Users,
  UserPlus,
  Phone,
  Scale,
  Trash2,
  Send,
  Check,
  Shield,
  Info,
} from 'lucide-react-native';

import {
  getEmergencyContacts,
  saveEmergencyContacts,
  EmergencyContact,
} from '../../services/storage';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Family');
  const [isAttorney, setIsAttorney] = useState<boolean>(false);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  const loadContacts = useCallback(async () => {
    const data = await getEmergencyContacts();
    setContacts(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Info', 'Please provide a contact name and phone number.');
      return;
    }

    const newContact: EmergencyContact = {
      id: `contact_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim() || (isAttorney ? 'Civil Rights Counsel' : 'Emergency Contact'),
      isAttorney,
      autoNotify: true,
    };

    const updated = [newContact, ...contacts];
    setContacts(updated);
    await saveEmergencyContacts(updated);

    setName('');
    setPhone('');
    setIsAttorney(false);
    setShowAddForm(false);
  };

  const handleDeleteContact = async (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    await saveEmergencyContacts(updated);
  };

  const handleToggleAutoNotify = async (id: string) => {
    const updated = contacts.map((c) => (c.id === id ? { ...c, autoNotify: !c.autoNotify } : c));
    setContacts(updated);
    await saveEmergencyContacts(updated);
  };

  const handleTestBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);

    const msg = `EMERGENCY ALERT SIMULATION:
"I am currently in a roadside traffic stop. Civic Aegis is actively transcribing audio and archiving legal evidence. My GPS location and live brief will be dispatched."`;

    if (Platform.OS === 'web') {
      alert(`SMS Broadcast dispatched to ${contacts.length} emergency contacts:\n\n${msg}`);
    } else {
      Alert.alert('Emergency Broadcast Sent', `Simulated SMS sent to ${contacts.length} emergency contacts.`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconCircle}>
            <Users size={20} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Emergency Contacts</Text>
            <Text style={styles.headerSubtitle}>Automated roadside dispatch & legal counsel</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
          activeOpacity={0.8}
        >
          <UserPlus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{showAddForm ? 'Close' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick SMS Broadcast Simulation Card */}
        <View style={styles.broadcastCard}>
          <View style={styles.broadcastHeader}>
            <Shield size={18} color="#EF4444" />
            <Text style={styles.broadcastTitle}>Instant Roadside SMS Alert</Text>
          </View>
          <Text style={styles.broadcastDescription}>
            When Civic Aegis starts or reaches high-risk inquiry, designated contacts can be
            notified with your location and stop brief:
          </Text>

          <TouchableOpacity
            style={[styles.broadcastBtn, broadcastSent && styles.broadcastBtnSuccess]}
            activeOpacity={0.85}
            onPress={handleTestBroadcast}
          >
            {broadcastSent ? (
              <>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.broadcastBtnText}>BROADCAST SMS SENT TO ALL CONTACTS</Text>
              </>
            ) : (
              <>
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.broadcastBtnText}>TEST EMERGENCY DISPATCH SMS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Add Contact Form Accordion */}
        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Add New Emergency Contact / Lawyer</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name / Law Firm</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Maya Lin (or Civil Defense Group)"
                placeholderTextColor="#71717A"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Phone Number (for SMS)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +1 (555) 432-8765"
                placeholderTextColor="#71717A"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship / Role</Text>
              <TextInput
                style={styles.input}
                value={relationship}
                onChangeText={setRelationship}
                placeholder="e.g. Spouse, Parent, Attorney"
                placeholderTextColor="#71717A"
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Is Legal Counsel / Attorney?</Text>
              <Switch
                value={isAttorney}
                onValueChange={setIsAttorney}
                trackColor={{ false: '#27272A', true: '#EF4444' }}
                thumbColor={isAttorney ? '#FFFFFF' : '#71717A'}
              />
            </View>

            <TouchableOpacity
              style={styles.saveContactBtn}
              onPress={handleAddContact}
              activeOpacity={0.8}
            >
              <Text style={styles.saveContactBtnText}>SAVE EMERGENCY CONTACT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contacts List */}
        <Text style={styles.sectionHeaderTitle}>Configured Emergency Network ({contacts.length})</Text>

        {contacts.length === 0 ? (
          <View style={styles.emptyContacts}>
            <Users size={36} color="#3F3F46" />
            <Text style={styles.emptyContactsText}>No emergency contacts added yet.</Text>
          </View>
        ) : (
          contacts.map((item) => (
            <View key={item.id} style={styles.contactCard}>
              <View style={styles.contactTopRow}>
                <View style={styles.contactAvatar}>
                  {item.isAttorney ? (
                    <Scale size={20} color="#EF4444" />
                  ) : (
                    <Phone size={20} color="#EF4444" />
                  )}
                </View>
                <View style={styles.contactMeta}>
                  <View style={styles.contactNameRow}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    {item.isAttorney && (
                      <View style={styles.attorneyTag}>
                        <Text style={styles.attorneyTagText}>COUNSEL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.contactPhone}>{item.phone}</Text>
                  <Text style={styles.contactRelationship}>{item.relationship}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteContact(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.contactBottomRow}>
                <Text style={styles.autoNotifyLabel}>Auto-SMS on High Risk Stop:</Text>
                <Switch
                  value={item.autoNotify}
                  onValueChange={() => handleToggleAutoNotify(item.id)}
                  trackColor={{ false: '#27272A', true: '#EF4444' }}
                  thumbColor={item.autoNotify ? '#FFFFFF' : '#71717A'}
                />
              </View>
            </View>
          ))
        )}

        {/* Bottom Policy Card */}
        <View style={styles.disclaimerCard}>
          <Info size={14} color="#71717A" style={{ marginTop: 2 }} />
          <Text style={styles.disclaimerText}>
            Emergency alerts are dispatched locally via device SMS capabilities. No contact data is
            sold or shared with third parties.
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 38,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  broadcastCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 16,
    marginBottom: 16,
  },
  broadcastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  broadcastTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  broadcastDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 50,
  },
  broadcastBtnSuccess: {
    backgroundColor: '#10B981',
  },
  broadcastBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 16,
    marginBottom: 16,
  },
  formHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4D4D8',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#080808',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F1517',
    paddingHorizontal: 12,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveContactBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  saveContactBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  emptyContacts: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyContactsText: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 8,
  },
  contactCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F1517',
    padding: 14,
    marginBottom: 12,
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactMeta: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  attorneyTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  attorneyTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  contactPhone: {
    fontSize: 13,
    color: '#D4D4D8',
    marginTop: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 1,
  },
  deleteBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2F1517',
    marginTop: 10,
    paddingTop: 10,
    minHeight: 44,
  },
  autoNotifyLabel: {
    fontSize: 12,
    color: '#D4D4D8',
    fontWeight: '600',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 4,
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
