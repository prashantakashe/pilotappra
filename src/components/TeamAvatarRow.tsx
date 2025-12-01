// src/components/TeamAvatarRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatUtils } from '../utils/formatUtils';

interface TeamMember {
  name: string;
  role: string;
}

interface TeamAvatarRowProps {
  members: TeamMember[];
  maxVisible?: number;
}

export const TeamAvatarRow: React.FC<TeamAvatarRowProps> = ({
  members,
  maxVisible = 3
}) => {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;

  const getAvatarColor = (index: number): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      {visibleMembers.map((member, index) => (
        <View
          key={index}
          style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(index) },
            index > 0 && styles.avatarOverlap
          ]}
        >
          <Text style={styles.initials}>
            {formatUtils.getInitials(member.name)}
          </Text>
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={[styles.avatar, styles.moreAvatar, styles.avatarOverlap]}>
          <Text style={styles.moreText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  avatarOverlap: {
    marginLeft: -8
  },
  initials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  moreAvatar: {
    backgroundColor: '#6B7280'
  },
  moreText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600'
  }
});
