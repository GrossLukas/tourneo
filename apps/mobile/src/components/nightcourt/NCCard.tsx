import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
import { NC } from './tokens';

interface NCCardProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  glow?: boolean;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Glass card.  18 px radius, 1 px border, dark surface.  `glow` adds an
 * indigo halo (used for the hero card).  `elevated` swaps to the elevated
 * surface colour.
 *
 * Use Pressable when an `onPress` is given so the press scale-feedback is
 * consistent across the design system.
 */
export const NCCard: React.FC<NCCardProps> = ({
  children,
  onPress,
  glow,
  elevated,
  padded = true,
  style,
}) => {
  const base: ViewStyle = {
    backgroundColor: elevated ? NC.bgElev : NC.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: NC.border,
    padding: padded ? 16 : 0,
    overflow: 'hidden',
    ...(glow
      ? {
          shadowColor: NC.primary,
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }
      : null),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
