/**
 * Admin: Playtomic Verification Queue
 * - Lists all pending Playtomic level submissions
 * - Admin taps on row → full screenshot view + approve/reject buttons
 * - Admin can override declared level before approval
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import apiClient from '../../src/api/client';
import type { Colors } from '../../src/theme/colors';

type PendingVerification = {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  playtomic_level: number;
  playtomic_screenshot_url: string;
  email: string;
  submitted_at: string;
};

export default function AdminVerificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [rows, setRows] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<PendingVerification | null>(null);
  const [overrideLevel, setOverrideLevel] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/playtomic/pending');
      setRows(res.data.data);
    } catch (err: any) {
      Alert.alert(
        'Fehler',
        err?.response?.status === 403
          ? 'Nur Admins haben Zugriff.'
          : 'Pending-Liste konnte nicht geladen werden.'
      );
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openDetails = (row: PendingVerification) => {
    setSelected(row);
    setOverrideLevel(row.playtomic_level.toString());
  };

  const closeDetails = () => {
    setSelected(null);
    setOverrideLevel('');
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const level = parseFloat(overrideLevel);
      if (isNaN(level) || level < 0 || level > 7) {
        Alert.alert('Ungültig', 'Level muss zwischen 0 und 7 liegen.');
        setProcessing(false);
        return;
      }
      await apiClient.post(`/admin/playtomic/${selected.user_id}/approve`, {
        level,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRows((prev) => prev.filter((r) => r.user_id !== selected.user_id));
      closeDetails();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Approval fehlgeschlagen.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    Alert.alert('Ablehnen?', 'Der User wird benachrichtigt und muss neu einreichen.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Ablehnen',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            await apiClient.post(`/admin/playtomic/${selected.user_id}/reject`, {});
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRows((prev) => prev.filter((r) => r.user_id !== selected.user_id));
            closeDetails();
          } catch (err: any) {
            Alert.alert('Fehler', err?.response?.data?.error?.message || 'Rejection fehlgeschlagen.');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ title: 'Verifizierungen', headerShown: true }} />

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.user_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Alles geprüft!</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Keine offenen Verifizierungen.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openDetails(item)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          >
            <Image source={{ uri: item.playtomic_screenshot_url }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.display_name || `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() || item.email}
              </Text>
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                Angegeben: Level {Number(item.playtomic_level).toFixed(1)}
              </Text>
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                {new Date(item.submitted_at).toLocaleString('de-DE')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      />

      {/* Details modal */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={closeDetails}>
        {selected && (
          <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <TouchableOpacity onPress={closeDetails}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>Schließen</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Prüfen</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
              <Image
                source={{ uri: selected.playtomic_screenshot_url }}
                style={styles.fullImage}
                resizeMode="contain"
              />

              <View
                style={[
                  styles.detailCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <DetailRow label="User" value={selected.email} colors={colors} />
                <DetailRow
                  label="Name"
                  value={selected.display_name || `${selected.first_name ?? ''} ${selected.last_name ?? ''}`.trim()}
                  colors={colors}
                />
                <DetailRow
                  label="Angegeben"
                  value={`Level ${Number(selected.playtomic_level).toFixed(1)}`}
                  colors={colors}
                />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                    Verifiziertes Level
                  </Text>
                  <TextInput
                    value={overrideLevel}
                    onChangeText={setOverrideLevel}
                    keyboardType="decimal-pad"
                    style={[
                      styles.levelInput,
                      { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.surfaceSecondary },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={handleReject}
                  disabled={processing}
                  style={[styles.rejectBtn, { borderColor: colors.error, opacity: processing ? 0.6 : 1 }]}
                >
                  <Text style={[styles.rejectText, { color: colors.error }]}>Ablehnen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApprove}
                  disabled={processing}
                  style={[styles.approveBtn, { backgroundColor: colors.success, opacity: processing ? 0.6 : 1 }]}
                >
                  {processing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.approveText}>Freigeben</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any },
  emptyText: { fontSize: fontSize.sm, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: '#1F1F3D',
  },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold as any },
  meta: { fontSize: fontSize.xxs, marginTop: 2 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalClose: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
  modalTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold as any },
  fullImage: { width: '100%', height: 500, borderRadius: radius.lg, marginBottom: spacing.lg },
  detailCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any, flex: 1 },
  detailValue: { fontSize: fontSize.sm, flex: 2, textAlign: 'right' },
  levelInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: fontSize.base,
    textAlign: 'center',
    minWidth: 80,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  rejectText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold as any },
  approveBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  approveText: { color: '#FFF', fontSize: fontSize.sm, fontWeight: fontWeight.bold as any },
});
