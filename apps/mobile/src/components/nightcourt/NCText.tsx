/**
 * Convenience text wrapper that pulls a role from `typography.ts`.
 *
 * Usage:
 *   <NCText role="screenTitle">Turniere</NCText>
 *
 * Falls back to system font weight when the Outfit / Inter / Mono families
 * haven't loaded yet.
 */
import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { typography, type TextRole } from '../../theme/typography';

interface NCTextProps extends Omit<TextProps, 'role' | 'style'> {
  variant?: TextRole;
  color?: string;
  uppercase?: boolean;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle | TextStyle[] | (TextStyle | undefined | false)[];
}

export const NCText: React.FC<NCTextProps> = ({
  variant = 'body',
  color,
  uppercase,
  align,
  style,
  children,
  ...rest
}) => {
  const t = typography[variant];
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          letterSpacing: t.letterSpacing,
          lineHeight: t.lineHeight,
          color: color ?? '#FFFFFF',
          textTransform: uppercase ? 'uppercase' : 'none',
          textAlign: align,
        },
        style as any,
      ]}
    >
      {children}
    </Text>
  );
};

export const ncTextStyle = (role: TextRole): TextStyle => {
  const t = typography[role];
  return StyleSheet.flatten({
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    letterSpacing: t.letterSpacing,
    lineHeight: t.lineHeight,
  });
};
