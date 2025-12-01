// src/screens/ProfileScreen.tsx
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { userService, User as UserType } from '../services/userService';
import InputText from '../components/InputText';
import ButtonPrimary from '../components/ButtonPrimary';
import { AppLayout } from '../components/AppLayout';
import { MAIN_NAV } from '../constants/sidebarMenus';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useResponsive } from '../hooks/useResponsive';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useContext(AuthContext)!;
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (user?.uid) {
        const userProfile = await userService.getUserProfile(user.uid);
        if (userProfile) {
          setProfile(userProfile);
          setName(userProfile.name);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      if (user?.uid) {
        await userService.updateUserProfile(user.uid, { name: name.trim() });
        setProfile((prev) => (prev ? { ...prev, name: name.trim() } : null));
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  return (
    <AppLayout title="Profile" activeRoute="Profile" sidebarItems={MAIN_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      {loading && (
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>👤</Text>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {profile && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Details</Text>

            {!editing ? (
              <View style={styles.displayMode}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{profile.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{profile.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Role:</Text>
                  <Text style={styles.value}>{profile.role}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Member Since:</Text>
                  <Text style={styles.value}>
                    {profile.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}
                  </Text>
                </View>

                <ButtonPrimary
                  title="Edit Profile"
                  onPress={() => setEditing(true)}
                  style={styles.editButton}
                />
              </View>
            ) : (
              <View style={styles.editMode}>
                <InputText
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                />

                <View style={styles.buttonGroup}>
                  <ButtonPrimary
                    title="Save"
                    onPress={handleSaveProfile}
                    loading={isSaving}
                    disabled={!name.trim() || isSaving}
                    style={{ flex: 1, marginRight: spacing.md }}
                  />
                  <TouchableOpacity
                    style={[styles.cancelButton, { flex: 1 }]}
                    onPress={() => {
                      setEditing(false);
                      setName(profile.name);
                    }}
                    disabled={isSaving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Two-Factor Authentication</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  headerIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
  },
  card: {
    backgroundColor: colors.PRIMARY_LIGHT,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.lg,
  },
  displayMode: {},
  editMode: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.WHITE,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
  },
  value: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    flex: 1,
    textAlign: 'right',
  },
  editButton: {
    marginTop: spacing.lg,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: colors.ACTION_BLUE,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  cancelButtonText: {
    color: colors.ACTION_BLUE,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    borderBottomWidth: 1,
    borderBottomColor: colors.WHITE,
    paddingVertical: spacing.md,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.ACTION_BLUE,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: colors.ERROR_RED,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
