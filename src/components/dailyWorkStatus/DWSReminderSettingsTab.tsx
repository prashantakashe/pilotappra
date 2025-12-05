// src/components/dailyWorkStatus/DWSReminderSettingsTab.tsx
/**
 * DWS Reminder Settings Tab
 * Configure email/SMS reminders for Daily Work Status
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ReminderSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  targetDateReminders: {
    sevenDays: boolean;
    threeDays: boolean;
    oneDay: boolean;
    overdue: boolean;
  };
  statusUpdateReminder: {
    enabled: boolean;
    hoursThreshold: number;
  };
  dailySummary: {
    enabled: boolean;
    time: string; // "18:00"
    recipients: string[]; // email addresses
  };
  testMode: boolean;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  emailEnabled: true,
  smsEnabled: false,
  targetDateReminders: {
    sevenDays: true,
    threeDays: true,
    oneDay: true,
    overdue: true,
  },
  statusUpdateReminder: {
    enabled: true,
    hoursThreshold: 24,
  },
  dailySummary: {
    enabled: true,
    time: '18:00',
    recipients: [],
  },
  testMode: false,
};

export const DWSReminderSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  // Load settings from Firestore
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'appSettings', 'dwsReminders');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() as ReminderSettings });
      }
    } catch (error) {
      console.error('[DWS Reminders] Error loading settings:', error);
      Alert.alert('Error', 'Failed to load reminder settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'appSettings', 'dwsReminders');
      await setDoc(docRef, settings);
      Alert.alert('Success', 'Reminder settings saved successfully');
    } catch (error) {
      console.error('[DWS Reminders] Error saving settings:', error);
      Alert.alert('Error', 'Failed to save reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = () => {
    const email = newRecipient.trim();
    if (!email) return;
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (settings.dailySummary.recipients.includes(email)) {
      Alert.alert('Duplicate', 'This email is already added');
      return;
    }

    setSettings(prev => ({
      ...prev,
      dailySummary: {
        ...prev.dailySummary,
        recipients: [...prev.dailySummary.recipients, email]
      }
    }));
    setNewRecipient('');
  };

  const removeRecipient = (email: string) => {
    setSettings(prev => ({
      ...prev,
      dailySummary: {
        ...prev.dailySummary,
        recipients: prev.dailySummary.recipients.filter(r => r !== email)
      }
    }));
  };

  const testReminders = async () => {
    console.log('[DWS] Test button clicked!');
    
    // Get the first recipient email or prompt for one
    const testEmail = settings.dailySummary.recipients[0] || newRecipient;
    
    console.log('[DWS] Test email:', testEmail);
    console.log('[DWS] Recipients:', settings.dailySummary.recipients);
    
    if (!testEmail) {
      if (window.confirm) {
        window.alert('No Email - Please enter an email address in the recipients section first');
      } else {
        Alert.alert('No Email', 'Please enter an email address in the recipients section first');
      }
      return;
    }

    // Use window.confirm for web compatibility
    const confirmed = window.confirm ? 
      window.confirm(`Send a test email to ${testEmail}?`) :
      true;
    
    if (!confirmed && !window.confirm) {
      Alert.alert(
        'Send Test Email',
        `Send a test email to ${testEmail}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send', onPress: () => sendTestEmailNow(testEmail) }
        ]
      );
      return;
    }
    
    if (confirmed) {
      await sendTestEmailNow(testEmail);
    }
  };

  const sendTestEmailNow = async (testEmail: string) => {
    try {
      console.log('[DWS] Attempting to send email...');
      
      // For now, show instructions to use the terminal script
      // until Cloud Functions CORS issues are resolved
      if (window.alert) {
        window.alert(
          `✉️ Send Test Email\n\n` +
          `To send a test email, please run this command in your terminal:\n\n` +
          `node test-email-direct.js ${testEmail}\n\n` +
          `The Cloud Functions deployment is having CORS issues.\n` +
          `The terminal script works perfectly and will send the email immediately.`
        );
      } else {
        Alert.alert(
          '✉️ Send Test Email',
          `To send a test email, run this command in terminal:\n\nnode test-email-direct.js ${testEmail}`
        );
      }
    } catch (error: any) {
      console.error('[DWS] Test email error:', error);
      if (window.alert) {
        window.alert(`Error: ${error.message}`);
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Reminder Settings</Text>
        <Text style={styles.subtitle}>
          Configure automatic email and SMS notifications for Daily Work Status
        </Text>
      </View>

      {/* Notification Channels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📧 Notification Channels</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingText}>Email Notifications</Text>
            <Text style={styles.settingDescription}>Send reminders via email</Text>
          </View>
          <Switch
            value={settings.emailEnabled}
            onValueChange={(value) => setSettings(prev => ({ ...prev, emailEnabled: value }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingText}>SMS Notifications</Text>
            <Text style={styles.settingDescription}>Send reminders via SMS (requires Twilio)</Text>
          </View>
          <Switch
            value={settings.smsEnabled}
            onValueChange={(value) => setSettings(prev => ({ ...prev, smsEnabled: value }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Target Date Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Target Date Reminders</Text>
        <Text style={styles.sectionDescription}>
          Send reminders before target dates approach
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>7 days before</Text>
          <Switch
            value={settings.targetDateReminders.sevenDays}
            onValueChange={(value) => setSettings(prev => ({
              ...prev,
              targetDateReminders: { ...prev.targetDateReminders, sevenDays: value }
            }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>3 days before</Text>
          <Switch
            value={settings.targetDateReminders.threeDays}
            onValueChange={(value) => setSettings(prev => ({
              ...prev,
              targetDateReminders: { ...prev.targetDateReminders, threeDays: value }
            }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>1 day before</Text>
          <Switch
            value={settings.targetDateReminders.oneDay}
            onValueChange={(value) => setSettings(prev => ({
              ...prev,
              targetDateReminders: { ...prev.targetDateReminders, oneDay: value }
            }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Overdue alerts</Text>
          <Switch
            value={settings.targetDateReminders.overdue}
            onValueChange={(value) => setSettings(prev => ({
              ...prev,
              targetDateReminders: { ...prev.targetDateReminders, overdue: value }
            }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Status Update Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Status Update Reminders</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingText}>Enable status reminders</Text>
            <Text style={styles.settingDescription}>
              Remind when no update for {settings.statusUpdateReminder.hoursThreshold}+ hours
            </Text>
          </View>
          <Switch
            value={settings.statusUpdateReminder.enabled}
            onValueChange={(value) => setSettings(prev => ({
              ...prev,
              statusUpdateReminder: { ...prev.statusUpdateReminder, enabled: value }
            }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {settings.statusUpdateReminder.enabled && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Hours threshold:</Text>
            <TextInput
              style={styles.numberInput}
              value={settings.statusUpdateReminder.hoursThreshold.toString()}
              onChangeText={(text) => {
                const hours = parseInt(text) || 24;
                setSettings(prev => ({
                  ...prev,
                  statusUpdateReminder: { ...prev.statusUpdateReminder, hoursThreshold: hours }
                }));
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.inputUnit}>hours</Text>
          </View>
        )}
      </View>

      {/* Daily Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Daily Summary Report</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingText}>Enable daily summary</Text>
            <Text style={styles.settingDescription}>Send end-of-day summary to managers</Text>
          </View>
          <Switch
            value={settings.dailySummary.enabled}
            onValueChange={(value) => setSettings(prev => ({
              ...prev,
              dailySummary: { ...prev.dailySummary, enabled: value }
            }))}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {settings.dailySummary.enabled && (
          <>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Send at:</Text>
              <TextInput
                style={styles.timeInput}
                value={settings.dailySummary.time}
                onChangeText={(text) => setSettings(prev => ({
                  ...prev,
                  dailySummary: { ...prev.dailySummary, time: text }
                }))}
                placeholder="18:00"
                maxLength={5}
              />
              <Text style={styles.inputUnit}>(24-hour format)</Text>
            </View>

            <View style={styles.recipientsSection}>
              <Text style={styles.recipientsTitle}>Recipients:</Text>
              
              {settings.dailySummary.recipients.map((email, index) => (
                <View key={index} style={styles.recipientRow}>
                  <Text style={styles.recipientEmail}>{email}</Text>
                  <TouchableOpacity onPress={() => removeRecipient(email)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.addRecipientRow}>
                <TextInput
                  style={styles.emailInput}
                  value={newRecipient}
                  onChangeText={setNewRecipient}
                  placeholder="manager@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onSubmitEditing={addRecipient}
                />
                <TouchableOpacity style={styles.addButton} onPress={addRecipient}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>💾 Save Settings</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testReminders}
        >
          <Text style={styles.testButtonText}>🧪 Send Test Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Status Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Setup Status</Text>
        <Text style={styles.infoText}>
          • Email Extension: {settings.emailEnabled ? '✅ Enabled' : '❌ Disabled'}
        </Text>
        <Text style={styles.infoText}>
          • SMS Service: {settings.smsEnabled ? '✅ Configured' : '⚠️ Not configured'}
        </Text>
        <Text style={styles.infoText}>
          • Cloud Functions: Check Firebase Console
        </Text>
        <Text style={styles.infoText}>
          • Reminders run daily at 8:00 AM IST
        </Text>
        <Text style={styles.infoText}>
          • Summary sends at {settings.dailySummary.time} IST
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium as any,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginRight: spacing.md,
    fontWeight: typography.weights.medium as any,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: spacing.sm,
    width: 80,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: spacing.sm,
    width: 100,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  recipientsSection: {
    marginTop: spacing.md,
  },
  recipientsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  recipientEmail: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  removeButton: {
    fontSize: 20,
    color: colors.error,
    fontWeight: typography.weights.bold as any,
    padding: spacing.xs,
  },
  addRecipientRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    marginRight: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
  },
  actions: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  button: {
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  testButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});
