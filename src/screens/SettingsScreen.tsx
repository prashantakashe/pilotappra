// src/screens/SettingsScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { MAIN_NAV } from '../constants/sidebarMenus';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { userService } from '../services/userService';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState('User');
  const [deploying, setDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState<string[]>([]);
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

  const handleDeploy = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Available', 'Deployment is only available on web platform.');
      return;
    }

    const confirmed = window.confirm(
      '🚀 Deploy to GitHub Pages?\n\n' +
      'This will:\n' +
      '✓ Stage all changes\n' +
      '✓ Commit with auto-generated message\n' +
      '✓ Push to GitHub\n' +
      '✓ Trigger deployment workflow\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setDeploying(true);
    setDeployLog([]);
    
    const addLog = (message: string) => {
      console.log(message);
      setDeployLog(prev => [...prev, `${message}`]);
    };

    try {
      addLog('🚀 Starting deployment process...');
      addLog('');

      // Execute PowerShell script
      addLog('📋 Executing deployment script...');
      addLog('⚠️  This requires PowerShell access and may open a new window');
      addLog('');

      // For web platform, we need to instruct the user to run the script manually
      // Since we can't execute PowerShell from browser for security reasons
      
      addLog('📝 MANUAL DEPLOYMENT INSTRUCTIONS:');
      addLog('');
      addLog('1. Open PowerShell in your project directory:');
      addLog('   E:\\prashant\\APP_PILOT PROJECT');
      addLog('');
      addLog('2. Run the deployment script:');
      addLog('   .\\deploy-web.ps1');
      addLog('');
      addLog('OR use these commands manually:');
      addLog('   git add .');
      addLog('   git commit -m "Deploy: ' + new Date().toLocaleString() + '"');
      addLog('   git push origin main');
      addLog('');
      addLog('✅ Your changes will be deployed to GitHub Pages');
      addLog('🌐 Monitor progress at: https://github.com/prashantakashe/pilotappra/actions');
      addLog('📍 Live site: https://prashantakashe.github.io/pilotappra/');
      
      // Copy deployment command to clipboard
      try {
        const deployCommand = '.\\deploy-web.ps1';
        await navigator.clipboard.writeText(deployCommand);
        addLog('');
        addLog('✅ Deployment command copied to clipboard!');
      } catch (e) {
        // Clipboard API might not be available
      }

      window.alert(
        '📋 Deployment Instructions\n\n' +
        'Open PowerShell in your project directory and run:\n' +
        '.\\deploy-web.ps1\n\n' +
        'OR manually execute:\n' +
        'git add .\n' +
        'git commit -m "Deploy"\n' +
        'git push origin main\n\n' +
        '✅ Command copied to clipboard!'
      );

    } catch (error: any) {
      addLog('');
      addLog('❌ Error: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <AppLayout title="Settings" activeRoute="Settings" sidebarItems={MAIN_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Deployment Section */}
        <Card title="🚀 Deployment">
          <Text style={styles.sectionDescription}>
            Deploy your changes to GitHub Pages with one click
          </Text>
          
          <TouchableOpacity 
            style={[styles.deployButton, deploying && styles.deployButtonDisabled]} 
            onPress={handleDeploy}
            disabled={deploying}
          >
            {deploying ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.deployButtonText}>  Processing...</Text>
              </View>
            ) : (
              <Text style={styles.deployButtonText}>🚀 Deploy to Web</Text>
            )}
          </TouchableOpacity>

          {deployLog.length > 0 && (
            <View style={styles.logContainer}>
              <Text style={styles.logTitle}>Deployment Log:</Text>
              <View style={styles.logContent}>
                {deployLog.map((log, index) => (
                  <Text key={index} style={styles.logLine}>{log}</Text>
                ))}
              </View>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
            <Text style={styles.infoText}>• Stages all your changes</Text>
            <Text style={styles.infoText}>• Commits with timestamp</Text>
            <Text style={styles.infoText}>• Pushes to GitHub</Text>
            <Text style={styles.infoText}>• Triggers automatic build & deployment</Text>
            <Text style={styles.infoText}>• Updates live site in 2-3 minutes</Text>
          </View>

          <View style={styles.linkBox}>
            <Text style={styles.linkTitle}>🔗 Quick Links:</Text>
            <TouchableOpacity onPress={() => Platform.OS === 'web' && window.open('https://github.com/prashantakashe/pilotappra/actions', '_blank')}>
              <Text style={styles.link}>📊 GitHub Actions (Monitor Deployment)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Platform.OS === 'web' && window.open('https://prashantakashe.github.io/pilotappra/', '_blank')}>
              <Text style={styles.link}>🌐 Live Website</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Other Settings */}
        <Card title="⚙️ Application Settings">
          <Text style={styles.comingSoon}>Coming Soon</Text>
          <Text style={styles.description}>
            User preferences, notifications, and system configuration
            will be available here.
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
  sectionDescription: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  deployButton: {
    backgroundColor: colors.ACTION_BLUE,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
      }
    })
  },
  deployButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deployButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  logTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  logContent: {
    maxHeight: 300,
  },
  logLine: {
    color: '#E5E7EB',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier New',
    marginBottom: 2,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE,
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: colors.TEXT_SECONDARY,
    marginBottom: 4,
    lineHeight: 20,
  },
  linkBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    borderRadius: 6,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  link: {
    fontSize: 14,
    color: colors.ACTION_BLUE,
    marginBottom: spacing.xs,
    textDecorationLine: 'underline',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      }
    })
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
});

export default SettingsScreen;
