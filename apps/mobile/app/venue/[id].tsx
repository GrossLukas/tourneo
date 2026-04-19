import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform,
  Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { THeader, TCard, TBadge, TButton, TLoadingScreen, TDivider } from '../../src/components/common';
import { useVenueStore } from '../../src/store/venueStore';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import { listVenueReviews, postVenueReview } from '../../src/api/v2';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { currentVenue, fetchVenueById, loading } = useVenueStore();

  const [reviews, setReviews] = useState<Array<{
    id: number; user_id: number; display_name: string; avatar_url: string | null;
    rating: number; comment: string | null; created_at: string;
  }>>([]);
  const [reviewSummary, setReviewSummary] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async (venueId: string) => {
    try {
      const data = await listVenueReviews(Number(venueId));
      setReviews(data.reviews);
      setReviewSummary(data.summary);
    } catch (_) {
      // silently fail – reviews are non-critical
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchVenueById(id);
      fetchReviews(id);
    }
  }, [id]);

  const handleSubmitReview = useCallback(async () => {
    if (!id) return;
    if (newRating === 0) {
      Alert.alert('Bewertung fehlt', 'Bitte wähle mindestens einen Stern.');
      return;
    }
    setSubmitting(true);
    try {
      await postVenueReview(Number(id), newRating, newComment.trim() || undefined);
      setNewRating(0);
      setNewComment('');
      await fetchReviews(id);
    } catch (_) {
      Alert.alert('Fehler', 'Bewertung konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  }, [id, newRating, newComment, fetchReviews]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (i < rating ? '\u2B50' : '\u2606')).join('');
  };

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

        {/* Court Availability shortcut */}
        <View style={styles.section}>
          <TButton
            title="🗓️ Platz-Verfügbarkeit ansehen"
            onPress={() => router.push(`/venue/availability/${v.id}`)}
            variant="outline"
          />
        </View>

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

        {/* Bewertungen */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Bewertungen
          </Text>

          {/* Summary */}
          {reviewSummary.count > 0 && (
            <View style={[styles.reviewSummaryCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.reviewAverage, { color: colors.textPrimary }]}>
                {reviewSummary.average.toFixed(1)}
              </Text>
              <Text style={[styles.reviewStarsLarge, { color: '#F59E0B' }]}>
                {renderStars(Math.round(reviewSummary.average))}
              </Text>
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                {reviewSummary.count} {reviewSummary.count === 1 ? 'Bewertung' : 'Bewertungen'}
              </Text>
            </View>
          )}

          {/* Submit form */}
          <View style={[styles.reviewFormCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.reviewFormTitle, { color: colors.textPrimary }]}>
              Bewertung abgeben
            </Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNewRating(star)}
                  style={styles.starButton}
                >
                  <Text style={styles.starText}>
                    {star <= newRating ? '\u2B50' : '\u2606'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.commentInput, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }]}
              placeholder="Kommentar (optional)"
              placeholderTextColor={colors.textTertiary as string}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary as string, opacity: submitting ? 0.6 : 1 }]}
              onPress={handleSubmitReview}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Wird gesendet...' : 'Bewertung senden'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Review list */}
          {reviews.map((review) => (
            <View
              key={review.id}
              style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewAuthor, { color: colors.textPrimary }]}>
                  {review.display_name}
                </Text>
                <Text style={{ color: '#F59E0B', fontSize: fontSize.sm }}>
                  {renderStars(review.rating)}
                </Text>
              </View>
              {review.comment ? (
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                  {review.comment}
                </Text>
              ) : null}
              <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                {new Date(review.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </Text>
            </View>
          ))}
        </View>

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
  // Reviews
  reviewSummaryCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  reviewAverage: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold as any,
  },
  reviewStarsLarge: {
    fontSize: fontSize.xl,
    marginTop: spacing.xs,
  },
  reviewCount: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  reviewFormCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  reviewFormTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as any,
    marginBottom: spacing.sm,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  starText: {
    fontSize: 28,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  submitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as any,
  },
  reviewCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewAuthor: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium as any,
  },
  reviewComment: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  reviewDate: {
    fontSize: fontSize.xs,
  },
});