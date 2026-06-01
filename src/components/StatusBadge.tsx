import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'offline'
  | 'online'
  | 'pending'
  | 'synced';

interface StatusBadgeProps {
  type: BadgeType;
  text: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

const BADGE_STYLES: Record<BadgeType, { bg: string; text: string; dot: string }> = {
  success: { bg: '#E8F8F0', text: '#1a7a4a', dot: '#2ECC71' },
  error:   { bg: '#FFF0F0', text: '#a32d2d', dot: '#E24B4A' },
  warning: { bg: '#FFF8F0', text: '#854F0B', dot: '#FF6B00' },
  info:    { bg: '#E8EDF5', text: '#1A3C6E', dot: '#1A3C6E' },
  offline: { bg: '#FFF8F0', text: '#854F0B', dot: '#FF6B00' },
  online:  { bg: '#E8F8F0', text: '#1a7a4a', dot: '#2ECC71' },
  pending: { bg: '#FFF8F0', text: '#854F0B', dot: '#FF6B00' },
  synced:  { bg: '#E8F8F0', text: '#1a7a4a', dot: '#2ECC71' },
};

export default function StatusBadge({
  type,
  text,
  showDot = true,
  size = 'md',
}: StatusBadgeProps) {
  const colors = BADGE_STYLES[type];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        isSmall ? styles.badgeSm : styles.badgeMd,
      ]}>
      {showDot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: colors.dot },
            isSmall ? styles.dotSm : styles.dotMd,
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: colors.text },
          isSmall ? styles.textSm : styles.textMd,
        ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeMd: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  dot: { borderRadius: 10 },
  dotMd: { width: 8, height: 8 },
  dotSm: { width: 6, height: 6 },
  text: { fontWeight: '500' },
  textMd: { fontSize: 13 },
  textSm: { fontSize: 11 },
});