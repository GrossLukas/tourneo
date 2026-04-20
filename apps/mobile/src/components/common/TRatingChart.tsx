/**
 * TRatingChart — ELO time series sparkline.
 *
 * Renders a compact line chart of the user's rating history using
 * react-native-svg. Shows current value, delta vs first point, and
 * colored line (green if up, red if down). Optimized for the profile
 * screen and the home dashboard widget.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line as SvgLine, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../providers/ThemeProvider';
import type { Colors } from '../../theme/colors';
import { fontSize, fontWeight, spacing } from '../../theme/spacing';

export interface RatingPoint {
  elo: number;
  recorded_at: string;
}

interface Props {
  points: RatingPoint[];
  width?: number;
  height?: number;
  showAxis?: boolean;
  showDelta?: boolean;
  title?: string;
}

export const TRatingChart: React.FC<Props> = ({
  points,
  width,
  height = 120,
  showAxis = true,
  showDelta = true,
  title,
}) => {
  const { colors } = useTheme();
  const screen = Dimensions.get('window').width;
  const w = width ?? screen - spacing.md * 4;
  const styles = makeStyles(colors);

  const computed = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((p) => p.elo);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padX = 8;
    const padY = 12;
    const chartW = w - padX * 2;
    const chartH = height - padY * 2;

    const coords = points.map((p, i) => {
      const x = padX + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
      const y = padY + chartH - ((p.elo - min) / range) * chartH;
      return { x, y, elo: p.elo };
    });

    const pathD = coords
      .map((c, i) => (i === 0 ? `M${c.x},${c.y}` : `L${c.x},${c.y}`))
      .join(' ');

    const areaD = `${pathD} L${coords[coords.length - 1].x},${padY + chartH} L${coords[0].x},${padY + chartH} Z`;

    const first = values[0];
    const last = values[values.length - 1];
    const delta = last - first;
    const up = delta >= 0;

    return { coords, pathD, areaD, min, max, first, last, delta, up };
  }, [points, w, height]);

  if (!computed) {
    return (
      <View style={[styles.empty, { width: w, height }]}>
        <Text style={styles.emptyText}>Noch keine Rating-Historie</Text>
      </View>
    );
  }

  const lineColor = computed.up ? (colors.success as string) : (colors.error as string);
  const gradientId = `ratingGrad-${computed.up ? 'up' : 'down'}`;

  return (
    <View style={[styles.container, { width: w }]}>
      {(title || showDelta) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {showDelta && (
            <View style={styles.deltaRow}>
              <Text style={styles.currentElo}>{computed.last}</Text>
              <Text style={[styles.delta, { color: lineColor }]}>
                {computed.up ? '+' : ''}
                {computed.delta}
              </Text>
            </View>
          )}
        </View>
      )}
      <Svg width={w} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {showAxis && (
          <>
            <SvgLine x1={0} y1={height - 1} x2={w} y2={height - 1} stroke={colors.border} strokeWidth={1} />
          </>
        )}
        <Path d={computed.areaD} fill={`url(#${gradientId})`} />
        <Path d={computed.pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {computed.coords.length > 0 && (
          <Circle
            cx={computed.coords[computed.coords.length - 1].x}
            cy={computed.coords[computed.coords.length - 1].y}
            r={4}
            fill={lineColor}
            stroke={colors.cardBg as string}
            strokeWidth={2}
          />
        )}
      </Svg>
      {showAxis && (
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>Min {computed.min}</Text>
          <Text style={styles.axisLabel}>Max {computed.max}</Text>
        </View>
      )}
    </View>
  );
};

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      padding: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold as any,
      color: colors.textSecondary,
    },
    deltaRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    currentElo: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold as any,
      color: colors.textPrimary,
    },
    delta: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold as any,
    },
    axisRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
      marginTop: 2,
    },
    axisLabel: {
      fontSize: fontSize.xxs,
      color: colors.textTertiary,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg as string,
      borderRadius: 12,
    },
    emptyText: {
      color: colors.textTertiary,
      fontSize: fontSize.sm,
    },
  });

export default TRatingChart;
