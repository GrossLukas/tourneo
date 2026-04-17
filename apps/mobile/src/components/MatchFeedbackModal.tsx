/**
 * MatchFeedbackModal — Rating calibration via opponent-strength feedback.
 *
 * Shown after a completed match. User picks "schwächer / passend / stärker"
 * relative to their own level, optionally adds a comment, and submits.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../theme/spacing';
import { submitMatchFeedback, type MatchFeedbackValue } from '../api/v2';
import type { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  matchId: number;
  opponentUserId: number;
  opponentName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function MatchFeedbackModal({
  visible,
  matchId,
  opponentUserId,
  opponentName,
  onClose,
  onSubmitted,
}: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState<MatchFeedbackValue | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value) {
      Alert.alert('Wähle eine Bewertung', 'Bitte gib an, wie stark dein Gegner war.');
      return;
    }
    setSubmitting(true);
    try {
      await submitMatchFeedback(matchId, opponentUserId, value, comment.trim() || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmitted?.();
      onClose();
      setValue(null);
      setComment('');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Feedback konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            War {opponentName} auf deinem Level?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Dein Feedback hilft, ELOs fair zu kalibrieren.
          </Text>

          <View style={styles.options}>
            <Option
              icon="trending-down"
              label="Schwächer"
              active={value === 'lower'}
              activeColor={colors.success}
              colors={colors}
              onPress={() => {
                Haptics.selectionAsync();
                setValue('lower');
              }}
            />
            <Option
              icon="checkmark-circle"
              label="Passend"
              active={value === 'correct'}
              activeColor={colors.primary}
              colors={colors}
              onPress={() => {
                Haptics.selectionAsync();
                setValue('correct');
              }}
            />
            <Option
              icon="trending-up"
              label="Stärker"
              active={value === 'higher'}
              activeColor={colors.warning}
              colors={colors}
              onPress={() => {
                Haptics.selectionAsync();
                setValue('higher');
              }}
            />
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Kommentar (optional)"
            placeholderTextColor={colors.textTertiary}
            maxLength={500}
            multiline
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.cardBorder,
              },
            ]}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !value}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: submitting || !value ? 0.5 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Senden</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Option({
  icon,
  label,
  active,
  activeColor,
  colors,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  activeColor: string;
  colors: Colors;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: active ? activeColor + '22' : colors.surface,
          borderColor: active ? activeColor : colors.cardBorder,
        },
      ]}
    >
      <Ionicons name={icon} size={28} color={active ? activeColor : colors.textTertiary} />
      <Text
        style={[
          styles.optionLabel,
          { color: active ? activeColor : colors.textSecondary, fontWeight: active ? '700' : '500' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as any,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  option: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  optionLabel: {
    fontSize: fontSize.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
  },
  submitBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold as any,
  },
});
