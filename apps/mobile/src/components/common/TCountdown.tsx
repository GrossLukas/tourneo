import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import type { Colors } from '../../theme/colors';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme/spacing';

interface TCountdownProps {
  targetDate: string | Date;
  size?: 'sm' | 'md' | 'lg';
  onExpired?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export const TCountdown: React.FC<TCountdownProps> = ({
  targetDate,
  size = 'md',
  onExpired,
}) => {
  const { colors } = useTheme();
  // Memoize the resolved Date by its numeric value so prop identity
  // changes (a new Date() with the same time) don't restart the timer.
  const targetTime = targetDate instanceof Date
    ? targetDate.getTime()
    : new Date(targetDate).getTime();
  const target = useMemo(() => new Date(targetTime), [targetTime]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calcTimeLeft(target));

  // Always read the latest onExpired handler from a ref so the effect
  // doesn't need to be in the dependency list — that would otherwise
  // cause the interval to be torn down and recreated on every render.
  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    setTimeLeft(calcTimeLeft(target));
    const interval = setInterval(() => {
      const next = calcTimeLeft(target);
      setTimeLeft(next);
      if (!next) {
        clearInterval(interval);
        onExpiredRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  const sizeConfig = {
    sm: {
      boxSize:   44,
      valueSize: fontSize.md,
      labelSize: fontSize.xxs,
      gap:       spacing.xs,
      radius:    borderRadius.sm,
      padding:   spacing.xs,
    },
    md: {
      boxSize:   56,
      valueSize: fontSize.lg,
      labelSize: fontSize.xxs,
      gap:       spacing.sm,
      radius:    borderRadius.md,
      padding:   spacing.sm,
    },
    lg: {
      boxSize:   72,
      valueSize: fontSize.xl,
      labelSize: fontSize.xs,
      gap:       spacing.md,
      radius:    borderRadius.md,
      padding:   spacing.sm,
    },
  }[size];

  if (!timeLeft) {
    return (
      <View style={styles.expiredContainer}>
        <Text style={[styles.expiredText, { color: colors.primary }]}>
          Gestartet!
        </Text>
      </View>
    );
  }

  const units: { value: number; label: string }[] = [
    { value: timeLeft.days,    label: 'Tage' },
    { value: timeLeft.hours,   label: 'Std' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sek' },
  ];

  return (
    <View style={[styles.row, { gap: sizeConfig.gap }]}>
      {units.map(({ value, label }) => (
        <View
          key={label}
          style={[
            styles.box,
            {
              width:           sizeConfig.boxSize,
              height:          sizeConfig.boxSize,
              borderRadius:    sizeConfig.radius,
              padding:         sizeConfig.padding,
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
        >
          <Text
            style={[
              styles.value,
              {
                fontSize:   sizeConfig.valueSize,
                color:      colors.textPrimary,
              },
            ]}
          >
            {String(value).padStart(2, '0')}
          </Text>
          <Text
            style={[
              styles.label,
              {
                fontSize: sizeConfig.labelSize,
                color:    colors.textTertiary,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'center',
  },
  box: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: fontWeight.bold as any,
    textAlign:  'center',
    lineHeight: undefined,
  },
  label: {
    textAlign:   'center',
    marginTop:   1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  expiredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  expiredText: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold as any,
  },
});
