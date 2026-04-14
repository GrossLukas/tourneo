/**
 * Partner search screen for an event
 * - list existing partner requests
 * - POST to create your own request
 * - tap a card → /partners/:id/contact (push notification)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../../src/theme/spacing';
import {
  listPartners,
  createPartnerRequest,
  contactPartner,
} from '../../../src/api/v2';

type PartnerRow = Awaited<ReturnType<typeof listPartners>>[number];

export default function PartnerSearchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Number(id);
  const { colors } = useTheme();

  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [skill, setSkill] = useState<'beginner' | 'intermediate' | 'advanced' | 'open'>('open');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listPartners(eventId);
      setRows(data);
    } catch (err) {
      // silent
    }
  }, [eventId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleCreate = useCallback(async () => {
    setPosting(true);
    try {
      await createPartnerRequest(eventId, {
        message: message.trim() || undefined,
        skill_level: skill,
      });
      setMessage('');
      await load();
    } catch (err: any) {
      Alert.alert(
        'Fehler',
        err?.response?.data?.error?.message || 'Anfrage konnte nicht erstellt werden.'
      );
    } finally {
      setPosting(false);
    }
  }, [eventId, message, skill, load]);

  const handleContact = useCallback(async (row: PartnerRow) => {
    try {
      await contactPartner(row.id);
      Alert.alert('Gesendet', `${row.display_name} wurde benachrichtigt.`);
    } catch (err: any) {
      Alert.alert(
        'Fehler',
        err?.response?.data?.error?.message || 'Kontakt fehlgeschlagen.'
      );
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: 'Partner suchen', headerShown: true }} />
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
              Eigene Anfrage stellen
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Kurze Nachricht (optional)"
              placeholderTextColor={colors.textTertiary}
              maxLength={500}
              multiline
              style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceSecondary }]}
            />
            <View style={styles.skillRow}>
              {(['beginner', 'intermediate', 'advanced', 'open'] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => setSkill(lvl)}
                  style={[
                    styles.skillChip,
                    {
                      backgroundColor: skill === lvl ? colors.primary : colors.surfaceSecondary,
                      borderColor: skill === lvl ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={{ color: skill === lvl ? '#fff' : colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600' }}>
                    {LEVEL_LABEL[lvl]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={posting}
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: posting ? 0.6 : 1 }]}
            >
              <Text style={styles.submitText}>{posting ? 'Sende…' : 'Anfrage posten'}</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Noch keine Anfragen. Sei die/der Erste!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{item.display_name}</Text>
              {item.skill_level && (
                <Text style={[styles.meta, { color: colors.textTertiary }]}>
                  {LEVEL_LABEL[item.skill_level as keyof typeof LEVEL_LABEL] || item.skill_level}
                </Text>
              )}
              {item.message && (
                <Text style={[styles.msg, { color: colors.textSecondary }]} numberOfLines={3}>
                  {item.message}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleContact(item)}
              style={[styles.contactBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#fff', fontSize: fontSize.xs, fontWeight: '700' }}>Kontakt</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const LEVEL_LABEL = {
  beginner: 'Anfänger',
  intermediate: 'Mittel',
  advanced: 'Fortgeschritten',
  open: 'Alle Level',
} as const;

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  form: {
    padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1,
  },
  formTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  input: {
    minHeight: 80, padding: spacing.md, borderRadius: radius.md,
    fontSize: fontSize.sm, textAlignVertical: 'top',
  },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  skillChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1,
  },
  submitBtn: { padding: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.md },
  submitText: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: fontSize.sm },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md,
  },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.xxs, marginTop: 2 },
  msg: { fontSize: fontSize.sm, marginTop: 4 },
  contactBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
});
