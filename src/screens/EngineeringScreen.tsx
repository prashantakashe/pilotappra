// src/screens/EngineeringScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { ENGINEERING_NAV } from '../constants/sidebarMenus';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { userService } from '../services/userService';

interface EngineeringScreenProps {
  navigation: any;
}

const EngineeringScreen: React.FC<EngineeringScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState('User');
  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName.split(' ')[0]);
    } else if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }

    if (user?.uid) {
      userService
        .getUserProfile(user.uid)
        .then((profile) => {
          if (profile?.name) {
            const firstName = profile.name.split(' ')[0];
            setUserName(firstName);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <AppLayout title="Engineering" activeRoute="Engineering" sidebarItems={ENGINEERING_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Module Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={styles.moduleCard}
            onPress={() => navigation.navigate('EscalationBill')}
          >
            <Text style={styles.moduleIcon}>📈</Text>
            <Text style={styles.moduleTitle}>Escalation Bill</Text>
            <Text style={styles.moduleDescription}>
              Calculate and track escalation adjustments for running bills and contracts
            </Text>
            <View style={styles.moduleFooter}>
              <Text style={styles.moduleLink}>Open Module →</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🔧</Text>
            <Text style={styles.moduleTitle}>Coming Soon</Text>
            <Text style={styles.moduleDescription}>
              More engineering modules will be added here
            </Text>
          </View>
        </View>

        <Card title="Engineering Module">
          <Text style={styles.comingSoon}>🔧 Engineering Management</Text>
          <Text style={styles.description}>
            The Engineering module will help you manage technical aspects of projects:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Technical drawings and specifications management</Text>
            <Text style={styles.featureItem}>• Design review and approval workflows</Text>
            <Text style={styles.featureItem}>• Material and equipment calculations</Text>
            <Text style={styles.featureItem}>• Quality control checklists</Text>
            <Text style={styles.featureItem}>• Site inspection reports</Text>
            <Text style={styles.featureItem}>• Technical query management</Text>
            <Text style={styles.featureItem}>• Compliance tracking and certifications</Text>
          </View>
          <Text style={[styles.description, { marginTop: spacing.lg, fontStyle: 'italic' }]}>
            Additional modules are under development and will be released soon.
          </Text>
        </Card>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  moduleCard: {
    flex: 1,
    minWidth: 250,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        ':hover': {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          borderColor: colors.ACTION_BLUE,
        }
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }
    })
  },
  moduleIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  moduleFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 'auto',
  },
  moduleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ACTION_BLUE,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.ACTION_BLUE,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureList: {
    marginTop: spacing.md,
    marginLeft: spacing.lg,
    alignSelf: 'stretch'
  },
  featureItem: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.sm,
    lineHeight: 20,
    textAlign: 'left'
  },
});

export default EngineeringScreen;
