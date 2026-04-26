/**
 * Greeting top bar: avatar (with optional ring) + 2-line greeting/name +
 * bell with coral badge dot.  62-px top padding accounts for the iPhone
 * notch.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { fontFamily } from '../../theme/typography';
import { NC } from './tokens';
import { NCAvatar } from './NCAvatar';
import { NCIcon } from './NCIcon';

interface NCTopBarProps {
  greeting: string;
  name: string;
  badge?: number;
  onAvatar?: () => void;
  onBell?: () => void;
}

export const NCTopBar: React.FC<NCTopBarProps> = ({
  greeting,
  name,
  badge = 0,
  onAvatar,
  onBell,
}) => {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onAvatar}
        style={styles.left}
        accessibilityRole="button"
        accessibilityLabel="Profil öffnen"
      >
        <NCAvatar name={name} hue={250} size={42} ring />
        <View style={styles.text}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onBell}
        style={styles.bell}
        accessibilityRole="button"
        accessibilityLabel="Benachrichtigungen"
      >
        <NCIcon name="bell" size={19} color={NC.textP} />
        {badge > 0 ? <View style={styles.badge} /> : null}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 62 : 36,
    paddingBottom: 12,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { flex: 1, minWidth: 0 },
  greeting: {
    fontFamily: fontFamily.uiMedium,
    fontWeight: '500',
    fontSize: 12,
    color: NC.textT,
    letterSpacing: 0.2,
  },
  name: {
    fontFamily: fontFamily.displayBold,
    fontWeight: '700',
    fontSize: 17,
    color: NC.textP,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: NC.bgCard,
    borderWidth: 1,
    borderColor: NC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: NC.coral,
    borderWidth: 2,
    borderColor: NC.bgCard,
  },
});
