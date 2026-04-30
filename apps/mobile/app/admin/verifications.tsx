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
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import apiClient from '../../src/api/client';
import { API_BASE_URL } from '../../src/api/client';
import type { Colors } from '../../src/theme/colors';

type PendingVerification = {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  playtomic_level: number;
  playtomic_screenshot_url: string;
  playtomic_ocr_status?: string | null;
  playtomic_ocr_level?: number | null;
  playtomic_ocr_name?: string | null;
  playtomic_ocr_points?: number | null;
  playtomic_duplicate_user_id?: number | null;
  email: string;
  submitted_at: string;
};

type PendingEligibility = {
  registration_id: number;
  event_id: number;
  user_id: number;
  registration_type: 'solo' | 'duo' | 'team';
  status: 'pending_verification' | 'pending_payment' | 'confirmed' | 'waitlisted' | 'cancelled' | 'refunded' | 'rejected' | 'no_show';
  eligibility_status: 'pending' | 'approved' | 'rejected' | 'not_required';
  eligibility_note: string | null;
  eligibility_checked_at: string | null;
  playtomic_level_at_registration: number | null;
  created_at: string;
  event_title: string;
  min_playtomic_level: number | null;
  max_playtomic_level: number | null;
  event_eligibility_note: string | null;
  venue_name: string | null;
  venue_city: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  playtomic_level: number | null;
  playtomic_verification_status: string | null;
  playtomic_screenshot_url: string | null;
  playtomic_ocr_status?: string | null;
  playtomic_ocr_level?: number | null;
  playtomic_ocr_name?: string | null;
  playtomic_ocr_points?: number | null;
  playtomic_duplicate_user_id?: number | null;
  checked_by_email: string | null;
  email: string;
};

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'all';
type AdminTab = 'eligibility' | 'profiles' | 'reports';
type ModerationReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned' | 'all';

type ModerationReport = {
  id: number;
  reporter_user_id: number;
  target_user_id: number | null;
  target_type: 'profile' | 'chat_message' | 'venue_review' | 'venue_photo' | 'event' | 'other';
  target_id: number | null;
  reason: string;
  detail: string | null;
  status: 'open' | 'reviewed' | 'dismissed' | 'actioned';
  action_taken: string | null;
  created_at: string;
  reviewed_at: string | null;
  reporter_email: string | null;
  target_email: string | null;
};

const REVIEW_FILTERS: Array<{ key: ReviewStatus; label: string }> = [
  { key: 'pending', label: 'Ausstehend' },
  { key: 'approved', label: 'Zugelassen' },
  { key: 'rejected', label: 'Abgelehnt' },
  { key: 'all', label: 'Alle' },
];

const REPORT_FILTERS: Array<{ key: ModerationReportStatus; label: string }> = [
  { key: 'open', label: 'Offen' },
  { key: 'actioned', label: 'Aktioniert' },
  { key: 'dismissed', label: 'Abgelehnt' },
  { key: 'reviewed', label: 'Gelesen' },
  { key: 'all', label: 'Alle' },
];

export default function AdminVerificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [rows, setRows] = useState<PendingVerification[]>([]);
  const [eligibilityRows, setEligibilityRows] = useState<PendingEligibility[]>([]);
  const [moderationRows, setModerationRows] = useState<ModerationReport[]>([]);
  const [tab, setTab] = useState<AdminTab>('eligibility');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('pending');
  const [moderationStatus, setModerationStatus] = useState<ModerationReportStatus>('open');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<PendingVerification | null>(null);
  const [selectedEligibility, setSelectedEligibility] = useState<PendingEligibility | null>(null);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [overrideLevel, setOverrideLevel] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [moderationNote, setModerationNote] = useState('');
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('access_token')
      .then((token) => setAuthHeader(token ? `Bearer ${token}` : null))
      .catch(() => setAuthHeader(null));
  }, []);

  const load = useCallback(async () => {
    try {
      const [profileRes, eligibilityRes, moderationRes] = await Promise.all([
        apiClient.get('/admin/playtomic/pending'),
        apiClient.get('/admin/eligibility/reviews', { params: { status: reviewStatus } }),
        apiClient.get('/moderation/admin/reports', { params: { status: moderationStatus } }),
      ]);
      setRows(profileRes.data.data);
      setEligibilityRows(eligibilityRes.data.data);
      setModerationRows(moderationRes.data.data);
    } catch (err: any) {
      Alert.alert(
        'Fehler',
        err?.response?.status === 403
          ? 'Nur Admins haben Zugriff.'
          : 'Pending-Liste konnte nicht geladen werden.'
      );
    }
  }, [reviewStatus, moderationStatus]);

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

  const openEligibilityDetails = (row: PendingEligibility) => {
    setSelectedEligibility(row);
    setReviewNote(row.eligibility_note || '');
  };

  const closeEligibilityDetails = () => {
    setSelectedEligibility(null);
    setReviewNote('');
  };

  const openReportDetails = (row: ModerationReport) => {
    setSelectedReport(row);
    setModerationNote(row.action_taken || defaultReportAction(row));
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
    setModerationNote('');
  };

  const handleEligibilityApprove = async () => {
    if (!selectedEligibility) return;
    setProcessing(true);
    try {
      await apiClient.put(
        `/admin/events/${selectedEligibility.event_id}/participants/${selectedEligibility.registration_id}/approve`,
        { note: reviewNote.trim() || 'Turnierzulassung erteilt' }
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
      closeEligibilityDetails();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Freigabe fehlgeschlagen.');
    } finally {
      setProcessing(false);
    }
  };

  const handleEligibilityReject = async () => {
    if (!selectedEligibility) return;
    Alert.alert('Ablehnen?', 'Der User wird benachrichtigt und der Platz wird wieder frei.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Ablehnen',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            await apiClient.put(
              `/admin/events/${selectedEligibility.event_id}/participants/${selectedEligibility.registration_id}/reject`,
              { note: reviewNote.trim() || 'Playtomic-Daten passen nicht zum Turnierlevel' }
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await load();
            closeEligibilityDetails();
          } catch (err: any) {
            Alert.alert('Fehler', err?.response?.data?.error?.message || 'Ablehnung fehlgeschlagen.');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
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

  const handleReportStatus = async (status: Exclude<ModerationReportStatus, 'all'>) => {
    if (!selectedReport) return;
    setProcessing(true);
    try {
      await apiClient.put(`/moderation/admin/reports/${selectedReport.id}`, {
        status,
        action_taken: moderationNote.trim() || defaultReportAction(selectedReport),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
      closeReportDetails();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Moderation konnte nicht gespeichert werden.');
    } finally {
      setProcessing(false);
    }
  };

  const handleHideReportedContent = async () => {
    if (!selectedReport || !selectedReport.target_id) return;
    if (!canHideTarget(selectedReport)) {
      Alert.alert('Nicht automatisch ausblendbar', 'Dieses Ziel kann nur als bearbeitet markiert werden.');
      return;
    }

    setProcessing(true);
    try {
      const note = moderationNote.trim() || defaultReportAction(selectedReport);
      await apiClient.post('/moderation/admin/hide', {
        target_type: selectedReport.target_type,
        target_id: selectedReport.target_id,
        note,
      });
      await apiClient.put(`/moderation/admin/reports/${selectedReport.id}`, {
        status: 'actioned',
        action_taken: note,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
      closeReportDetails();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Inhalt konnte nicht ausgeblendet werden.');
    } finally {
      setProcessing(false);
    }
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
        data={tab === 'profiles' ? rows : []}
        keyExtractor={(r) => String(r.user_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setTab('eligibility')}
                style={[
                  styles.tabBtn,
                  { borderColor: colors.cardBorder, backgroundColor: tab === 'eligibility' ? colors.primary : colors.surface },
                ]}
              >
                <Text style={[styles.tabText, { color: tab === 'eligibility' ? '#FFF' : colors.textPrimary }]}>
                  Turnier-Zulassungen ({eligibilityRows.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTab('profiles')}
                style={[
                  styles.tabBtn,
                  { borderColor: colors.cardBorder, backgroundColor: tab === 'profiles' ? colors.primary : colors.surface },
                ]}
              >
                <Text style={[styles.tabText, { color: tab === 'profiles' ? '#FFF' : colors.textPrimary }]}>
                  Playtomic-Profile ({rows.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTab('reports')}
                style={[
                  styles.tabBtn,
                  { borderColor: colors.cardBorder, backgroundColor: tab === 'reports' ? colors.primary : colors.surface },
                ]}
              >
                <Text style={[styles.tabText, { color: tab === 'reports' ? '#FFF' : colors.textPrimary }]}>
                  Meldungen ({moderationRows.length})
                </Text>
              </TouchableOpacity>
            </View>

            {tab === 'eligibility' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {REVIEW_FILTERS.map((filter) => {
                  const active = reviewStatus === filter.key;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => setReviewStatus(filter.key)}
                      style={[
                        styles.filterChip,
                        { borderColor: active ? colors.primary : colors.cardBorder, backgroundColor: active ? colors.primary : colors.surface },
                      ]}
                    >
                      <Text style={[styles.filterText, { color: active ? '#FFF' : colors.textPrimary }]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {tab === 'reports' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {REPORT_FILTERS.map((filter) => {
                  const active = moderationStatus === filter.key;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => setModerationStatus(filter.key)}
                      style={[
                        styles.filterChip,
                        { borderColor: active ? colors.primary : colors.cardBorder, backgroundColor: active ? colors.primary : colors.surface },
                      ]}
                    >
                      <Text style={[styles.filterText, { color: active ? '#FFF' : colors.textPrimary }]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {tab === 'eligibility' ? (
              eligibilityRows.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Keine offenen Zulassungen</Text>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    Alle Turnier-Anmeldungen sind geprüft.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {eligibilityRows.map((item) => (
                    <TouchableOpacity
                      key={String(item.registration_id)}
                      activeOpacity={0.8}
                      onPress={() => openEligibilityDetails(item)}
                      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                    >
                      {item.playtomic_screenshot_url ? (
                        <Image source={playtomicImageSource(item.user_id, item.playtomic_screenshot_url, authHeader)} style={styles.thumb} />
                      ) : (
                        <View style={[styles.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="image-outline" size={22} color={colors.textTertiary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                          {item.display_name || `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() || item.email}
                        </Text>
                        <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
                          {item.event_title}
                        </Text>
                        <Text style={[styles.meta, { color: colors.textTertiary }]}>
                          Level {displayLevel(item)} - {rangeLabel(item.min_playtomic_level, item.max_playtomic_level)}
                        </Text>
                        <Text style={[styles.meta, { color: item.playtomic_duplicate_user_id ? colors.error : colors.textTertiary }]}>
                          {ocrSummary(item)}
                        </Text>
                        <Text style={[styles.meta, { color: statusColor(item.eligibility_status, colors) }]}>
                          {statusLabel(item.eligibility_status)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : null}

            {tab === 'reports' ? (
              moderationRows.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="shield-checkmark-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Keine offenen Meldungen</Text>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    Neue Reports erscheinen hier mit Ziel, Grund und Admin-Aktion.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {moderationRows.map((item) => (
                    <TouchableOpacity
                      key={String(item.id)}
                      activeOpacity={0.8}
                      onPress={() => openReportDetails(item)}
                      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                    >
                      <View style={[styles.reportIcon, { backgroundColor: reportBg(item.status, colors) }]}>
                        <Ionicons name="flag-outline" size={22} color={reportColor(item.status, colors)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                          {targetTypeLabel(item.target_type)} - {reasonLabel(item.reason)}
                        </Text>
                        <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
                          Von {item.reporter_email || `User #${item.reporter_user_id}`}
                        </Text>
                        <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
                          Ziel {item.target_email || (item.target_user_id ? `User #${item.target_user_id}` : targetIdLabel(item))}
                        </Text>
                        <Text style={[styles.meta, { color: reportColor(item.status, colors) }]}>
                          {reportStatusLabel(item.status)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : null}
          </View>
        }
        ListEmptyComponent={
          tab === 'profiles' ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Alles geprüft!</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Keine offenen Verifizierungen.
            </Text>
          </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openDetails(item)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          >
            <Image source={playtomicImageSource(item.user_id, item.playtomic_screenshot_url, authHeader)} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.display_name || `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() || item.email}
              </Text>
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                Angegeben: Level {Number(item.playtomic_level).toFixed(1)}
              </Text>
              <Text style={[styles.meta, { color: item.playtomic_duplicate_user_id ? colors.error : colors.textTertiary }]}>
                {ocrSummary(item)}
              </Text>
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                {new Date(item.submitted_at).toLocaleString('de-DE')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selectedEligibility} animationType="slide" onRequestClose={closeEligibilityDetails}>
        {selectedEligibility && (
          <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <TouchableOpacity onPress={closeEligibilityDetails}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>Schließen</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Zulassung prüfen</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
              {selectedEligibility.playtomic_screenshot_url ? (
                <Image
                  source={playtomicImageSource(selectedEligibility.user_id, selectedEligibility.playtomic_screenshot_url, authHeader)}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.noImage, { borderColor: colors.cardBorder }]}>
                  <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Kein Screenshot hinterlegt</Text>
                </View>
              )}

              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <DetailRow label="Turnier" value={selectedEligibility.event_title} colors={colors} />
                <DetailRow label="Venue" value={[selectedEligibility.venue_name, selectedEligibility.venue_city].filter(Boolean).join(', ')} colors={colors} />
                <DetailRow label="User" value={selectedEligibility.email} colors={colors} />
                <DetailRow
                  label="Name"
                  value={selectedEligibility.display_name || `${selectedEligibility.first_name ?? ''} ${selectedEligibility.last_name ?? ''}`.trim()}
                  colors={colors}
                />
                <DetailRow
                  label="Playtomic"
                  value={`Level ${
                    displayLevel(selectedEligibility)
                  } (${selectedEligibility.playtomic_verification_status || 'none'})`}
                  colors={colors}
                />
                <DetailRow label="OCR" value={ocrSummary(selectedEligibility)} colors={colors} />
                {selectedEligibility.playtomic_duplicate_user_id ? (
                  <DetailRow
                    label="Betrugspruefung"
                    value={`Gleicher Screenshot wie User #${selectedEligibility.playtomic_duplicate_user_id}`}
                    colors={colors}
                  />
                ) : null}
                <DetailRow
                  label="Turnierbereich"
                  value={rangeLabel(selectedEligibility.min_playtomic_level, selectedEligibility.max_playtomic_level)}
                  colors={colors}
                />
                <DetailRow label="Status" value={statusLabel(selectedEligibility.eligibility_status)} colors={colors} />
                {selectedEligibility.checked_by_email ? (
                  <DetailRow label="Geprüft von" value={selectedEligibility.checked_by_email} colors={colors} />
                ) : null}
                {selectedEligibility.eligibility_note ? (
                  <DetailRow label="Hinweis" value={selectedEligibility.eligibility_note} colors={colors} />
                ) : null}
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                    Admin-Notiz
                  </Text>
                  <TextInput
                    value={reviewNote}
                    onChangeText={setReviewNote}
                    placeholder="Optionaler Hinweis für Audit und Benachrichtigung"
                    placeholderTextColor={colors.textTertiary as string}
                    multiline
                    style={[
                      styles.noteInput,
                      { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.surfaceSecondary },
                    ]}
                  />
                </View>
              </View>

              {selectedEligibility.eligibility_status === 'pending' ? (
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={handleEligibilityReject}
                  disabled={processing}
                  style={[styles.rejectBtn, { borderColor: colors.error, opacity: processing ? 0.6 : 1 }]}
                >
                  <Text style={[styles.rejectText, { color: colors.error }]}>Ablehnen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEligibilityApprove}
                  disabled={processing}
                  style={[styles.approveBtn, { backgroundColor: colors.success, opacity: processing ? 0.6 : 1 }]}
                >
                  {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.approveText}>Zulassen</Text>}
                </TouchableOpacity>
              </View>
              ) : null}
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal visible={!!selectedReport} animationType="slide" onRequestClose={closeReportDetails}>
        {selectedReport && (
          <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <TouchableOpacity onPress={closeReportDetails}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>Schliessen</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Meldung pruefen</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <DetailRow label="Status" value={reportStatusLabel(selectedReport.status)} colors={colors} />
                <DetailRow label="Grund" value={reasonLabel(selectedReport.reason)} colors={colors} />
                <DetailRow label="Ziel" value={targetTypeLabel(selectedReport.target_type)} colors={colors} />
                <DetailRow label="Ziel-ID" value={targetIdLabel(selectedReport)} colors={colors} />
                <DetailRow label="Gemeldet von" value={selectedReport.reporter_email || `User #${selectedReport.reporter_user_id}`} colors={colors} />
                <DetailRow label="Betroffener User" value={selectedReport.target_email || (selectedReport.target_user_id ? `User #${selectedReport.target_user_id}` : '-')} colors={colors} />
                <DetailRow label="Erstellt" value={new Date(selectedReport.created_at).toLocaleString('de-DE')} colors={colors} />
                {selectedReport.detail ? (
                  <View style={{ gap: spacing.xs }}>
                    <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Beschreibung</Text>
                    <Text style={[styles.detailText, { color: colors.textPrimary }]}>{selectedReport.detail}</Text>
                  </View>
                ) : null}
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                    Admin-Aktion
                  </Text>
                  <TextInput
                    value={moderationNote}
                    onChangeText={setModerationNote}
                    placeholder="Was wurde geprueft oder entfernt?"
                    placeholderTextColor={colors.textTertiary as string}
                    multiline
                    style={[
                      styles.noteInput,
                      { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.surfaceSecondary },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.moderationActions}>
                {canHideTarget(selectedReport) ? (
                  <TouchableOpacity
                    onPress={handleHideReportedContent}
                    disabled={processing}
                    style={[styles.rejectBtn, { borderColor: colors.error, opacity: processing ? 0.6 : 1 }]}
                  >
                    <Text style={[styles.rejectText, { color: colors.error }]}>Inhalt ausblenden</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => handleReportStatus('actioned')}
                  disabled={processing}
                  style={[styles.approveBtn, { backgroundColor: colors.success, opacity: processing ? 0.6 : 1 }]}
                >
                  <Text style={styles.approveText}>Als erledigt markieren</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReportStatus('dismissed')}
                  disabled={processing}
                  style={[styles.neutralBtn, { borderColor: colors.cardBorder, opacity: processing ? 0.6 : 1 }]}
                >
                  <Text style={[styles.rejectText, { color: colors.textSecondary }]}>Meldung ablehnen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReportStatus('reviewed')}
                  disabled={processing}
                  style={[styles.neutralBtn, { borderColor: colors.cardBorder, opacity: processing ? 0.6 : 1 }]}
                >
                  <Text style={[styles.rejectText, { color: colors.textSecondary }]}>Nur als gelesen speichern</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

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
                source={playtomicImageSource(selected.user_id, selected.playtomic_screenshot_url, authHeader)}
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
                <DetailRow label="OCR" value={ocrSummary(selected)} colors={colors} />
                {selected.playtomic_duplicate_user_id ? (
                  <DetailRow
                    label="Betrugspruefung"
                    value={`Gleicher Screenshot wie User #${selected.playtomic_duplicate_user_id}`}
                    colors={colors}
                  />
                ) : null}
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

function rangeLabel(min: number | null, max: number | null): string {
  const from = min == null ? 0 : Number(min);
  const to = max == null ? 7 : Number(max);
  return `${from.toFixed(1)} bis ${to.toFixed(1)}`;
}

function displayLevel(row: PendingEligibility): string {
  const level = row.playtomic_level_at_registration ?? row.playtomic_level;
  return level == null ? '?' : Number(level).toFixed(1);
}

function ocrSummary(row: {
  playtomic_ocr_status?: string | null;
  playtomic_ocr_level?: number | null;
  playtomic_ocr_name?: string | null;
  playtomic_ocr_points?: number | null;
  playtomic_duplicate_user_id?: number | null;
}): string {
  if (row.playtomic_duplicate_user_id) {
    return `Dubletten-Warnung: User #${row.playtomic_duplicate_user_id}`;
  }
  if (!row.playtomic_ocr_status) return 'OCR noch nicht gelaufen';
  if (row.playtomic_ocr_status === 'failed') return 'OCR konnte nicht sicher lesen';
  const parts = [
    row.playtomic_ocr_name ? `Name: ${row.playtomic_ocr_name}` : null,
    row.playtomic_ocr_level != null ? `Level: ${Number(row.playtomic_ocr_level).toFixed(1)}` : null,
    row.playtomic_ocr_points != null ? `Punkte: ${row.playtomic_ocr_points}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'OCR ohne Treffer';
}

function statusLabel(status: PendingEligibility['eligibility_status']): string {
  if (status === 'approved') return 'Zugelassen';
  if (status === 'rejected') return 'Abgelehnt';
  if (status === 'not_required') return 'Keine Prüfung nötig';
  return 'Ausstehend';
}

function statusColor(status: PendingEligibility['eligibility_status'], colors: Colors): string {
  if (status === 'approved') return colors.success as string;
  if (status === 'rejected') return colors.error as string;
  return colors.warning as string;
}

function reasonLabel(reason: string): string {
  switch (reason) {
    case 'spam':
      return 'Spam';
    case 'abuse':
      return 'Beleidigung';
    case 'harassment':
      return 'Belaestigung';
    case 'inappropriate':
      return 'Unangemessen';
    case 'privacy':
      return 'Datenschutz';
    case 'fraud':
      return 'Betrug';
    default:
      return 'Sonstiges';
  }
}

function targetTypeLabel(type: ModerationReport['target_type']): string {
  switch (type) {
    case 'profile':
      return 'Profil';
    case 'chat_message':
      return 'Chat-Nachricht';
    case 'venue_review':
      return 'Venue-Bewertung';
    case 'venue_photo':
      return 'Venue-Foto';
    case 'event':
      return 'Turnier';
    default:
      return 'Sonstiges';
  }
}

function reportStatusLabel(status: ModerationReport['status']): string {
  if (status === 'actioned') return 'Aktioniert';
  if (status === 'dismissed') return 'Abgelehnt';
  if (status === 'reviewed') return 'Gelesen';
  return 'Offen';
}

function reportColor(status: ModerationReport['status'], colors: Colors): string {
  if (status === 'actioned') return colors.success as string;
  if (status === 'dismissed') return colors.textTertiary as string;
  if (status === 'reviewed') return colors.info as string;
  return colors.warning as string;
}

function reportBg(status: ModerationReport['status'], colors: Colors): string {
  if (status === 'actioned') return colors.successBg as string;
  if (status === 'reviewed') return colors.infoBg as string;
  if (status === 'dismissed') return colors.surfaceSecondary as string;
  return colors.warningBg as string;
}

function canHideTarget(report: ModerationReport): boolean {
  return !!report.target_id && ['chat_message', 'venue_review', 'venue_photo'].includes(report.target_type);
}

function targetIdLabel(report: ModerationReport): string {
  if (report.target_id) return `#${report.target_id}`;
  if (report.target_user_id) return `User #${report.target_user_id}`;
  return '-';
}

function defaultReportAction(report: ModerationReport): string {
  if (canHideTarget(report)) return 'Inhalt geprueft und bei Bedarf ausgeblendet.';
  return 'Meldung geprueft.';
}

function playtomicImageSource(userId: number, rawUrl: string | null, authHeader: string | null) {
  const isPrivate = !rawUrl || rawUrl.startsWith('private:playtomic/');
  const uri = isPrivate ? `${API_BASE_URL}/admin/playtomic/${userId}/screenshot` : rawUrl;
  return {
    uri,
    headers: authHeader ? { Authorization: authHeader } : undefined,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterRow: { gap: spacing.xs, paddingBottom: spacing.md },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterText: { fontSize: fontSize.xxs, fontWeight: fontWeight.bold as any },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: { fontSize: fontSize.xxs, fontWeight: fontWeight.bold as any, textAlign: 'center' },
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
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  noImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
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
  detailText: { fontSize: fontSize.sm, lineHeight: 20 },
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
  noteInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 92,
    textAlignVertical: 'top',
    fontSize: fontSize.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  moderationActions: {
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
  neutralBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
});
