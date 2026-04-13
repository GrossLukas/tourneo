import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { THeader, TCard, TBadge, TButton, TLoadingScreen, TDivider } from '../../src/components/common';
import { useVenueStore } from '../../src/store/venueStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useAppColors();
  const { currentVenue, fetchVenueById, loading } = useVenueStore();

  useEffect(() => {
    if (id) fetchVenueById(id);
  }, [id]);

  if (loading || !currentVenue) return <TLoadingScreen message="Venue wird geladen..." />;

  const v = currentVenue;

  const openMaps = () => {
    const address = `${v.address_street}, ${v.address_zip} ${v.address_city}`;
    const url = Platform.OS === 'ios'
      ? `maps:?q=${encodeURIComponent(address)}`
      : `geo:0,0?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader title={v.name} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{v.name}</Text>

        {v.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{v.description}</Text>
        )}

        {/* Address */}
        <TCard variant="outlined" style={styles.infoCard}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Adresse</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
            {v.address_street}
          </Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
            {v.address_zip} {v.address_city}
          </Text>
          <TButton title="In Karten öffnen" onPress={openMaps} variant="ghost" size="sm" fullWidth={false} style={{ marginTop: spacing.sm }} />
        </TCard>

        {/* Contact */}
        <TCard variant="outlined" style={styles.infoCard}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Kontakt</Text>
          {v.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${v.phone}`)}>
              <Text style={[styles.linkText, { color: (colors.primary as string) }]}>📱 {v.phone}</Text>
            </TouchableOpacity>
          )}
          {v.email && (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${v.email}`)}>
              <Text style={[styles.linkText, { color: (colors.primary as string) }]}>✉️ {v.email}</Text>
            </TouchableOpacity>
          )}
          {v.website && (
            <TouchableOpacity onPress={() => Linking.openURL(v.website!)}>
              <Text style={[styles.linkText, { color: (colors.primary as string) }]}>🌐 Website öffnen</Text>
            </TouchableOpacity>
          )}
        </TCard>

        {/* Courts */}
        {v.courts && v.courts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Courts ({v.courts.length})
            </Text>
            {v.courts.map((court) => (
              <TCard key={court.id} variant="outlined" style={styles.courtCard}>
                <View style={styles.courtRow}>
                  <Text style={[styles.courtName, { color: colors.textPrimary }]}>{court.name}</Text>
                  <View style={styles.courtBadges}>
                    <TBadge
                      label={court.court_type === 'indoor' ? 'Indoor' : court.court_type === 'outdoor' ? 'Outdoor' : 'Überdacht'}
                      variant="info"
                    />
                    <TBadge label={court.surface} variant="default" />
                  </View>
                </View>
              </TCard>
            ))}
          </View>
        )}

        {/* Booking Links */}
        {v.booking_links && v.booking_links.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Online Buchen
            </Text>
            {v.booking_links.map((link) => (
              <TButton
                key={link.id}
                title={`Buchen über ${link.provider_name}`}
                onPress={() => Linking.openURL(link.booking_url)}
                variant="outline"
                icon={<Text>🔗</Text>}
                style={{ marginBottom: spacing.sm }}
              />
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  name: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any, marginBottom: spacing.sm },
  description: { fontSize: fontSize.md, lineHeight: 22, marginBottom: spacing.md },
  infoCard: { alignItems: 'center', marginBottom: spacing.md },
  infoIcon: { fontSize: 24, marginBottom: spacing.xs },
  infoLabel: { fontSize: fontSize.xs, marginBottom: spacing.xs },
  infoValue: { fontSize: fontSize.md, fontWeight: fontWeight.medium as any, textAlign: 'center' },
  linkText: { fontSize: fontSize.md, marginTop: spacing.xs },
  section: { marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any, marginBottom: spacing.sm },
  courtCard: { marginBottom: spacing.xs },
  courtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courtName: { fontSize: fontSize.md, fontWeight: fontWeight.medium as any },
  courtBadges: { flexDirection: 'row', gap: spacing.xxs },
});