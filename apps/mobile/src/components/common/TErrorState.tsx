import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

// ============================================
// TOURNEO - Error & Retry State Component
// Premium error display with retry action
// ============================================

interface TErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: string;
  compact?: boolean;
}

export function TErrorState({
  title = 'Etwas ist schiefgelaufen',
  message = 'Bitte versuche es erneut.',
  onRetry,
  retryLabel = 'Erneut versuchen',
  icon = '⚠️',
  compact = false,
}: TErrorStateProps) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.errorBg as string }]}>
        <Text style={styles.compactIcon}>{icon}</Text>
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: colors.error as string }]}>{title}</Text>
          {message ? <Text style={[styles.compactMessage, { color: colors.textSecondary }]}>{message}</Text> : null}
        </View>
        {onRetry ? (
          <TouchableOpacity onPress={onRetry} style={[styles.compactRetry, { backgroundColor: colors.error as string }]}>
            <Text style={styles.compactRetryText}>↻</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textTertiary }]}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryButton, { backgroundColor: colors.primary as string }]}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Network error specialization
export function TNetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <TErrorState
      icon="📡"
      title="Keine Verbindung"
      message="Bitte prüfe deine Internetverbindung und versuche es erneut."
      onRetry={onRetry}
      retryLabel="Verbindung prüfen"
    />
  );
}

// Permission error
export function TPermissionError({ message }: { message?: string }) {
  return (
    <TErrorState
      icon="🔒"
      title="Zugriff verweigert"
      message={message || 'Du hast keine Berechtigung für diese Aktion.'}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingVertical: 48,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  compactIcon: {
    fontSize: 24,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactMessage: {
    fontSize: 12,
    marginTop: 2,
  },
  compactRetry: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRetryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});