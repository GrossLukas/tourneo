/**
 * Playtomic Screenshot Verification
 * - User uploads screenshot of their Playtomic profile
 * - Admin reviews manually (no AI)
 * - User can skip for now and verify later (when signing up for a tournament)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/providers/ThemeProvider';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/spacing';
import { submitPlaytomicScreenshot } from '../../src/api/v2';
import apiClient from '../../src/api/client';

export default function PlaytomicVerifyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung nötig', 'Bitte erlaube den Zugriff auf die Galerie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung nötig', 'Bitte erlaube den Zugriff auf die Kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) return;
    setSubmitting(true);
    try {
      // Upload via generic /upload/image endpoint (reuse venue photo uploader)
      const form = new FormData();
      // @ts-ignore
      form.append('image', {
        uri: imageUri,
        name: 'playtomic.jpg',
        type: 'image/jpeg',
      });
      const uploadRes = await apiClient.post('/me/playtomic/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = uploadRes.data?.data?.url;
      if (!uploadedUrl) throw new Error('Upload failed');

      await submitPlaytomicScreenshot(uploadedUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Eingereicht!',
        'Ein Admin prüft deinen Screenshot. Du kannst die App schon nutzen — für Turniere wird die Freigabe benötigt.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Fehler', err?.response?.data?.error?.message || 'Upload fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Später verifizieren?',
      'Du kannst die App nutzen. Für Turnier-Anmeldungen musst du den Screenshot aber nachreichen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Später', onPress: () => router.replace('/(tabs)/home') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>📸</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Screenshot zur Verifizierung
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Mache einen Screenshot deines Playtomic-Profils, auf dem dein Level und dein Name sichtbar sind.
            Ein Admin prüft das manuell — meist innerhalb von 24 h.
          </Text>
        </View>

        {/* Example / instructions */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Level muss gut lesbar sein
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Dein Playtomic-Name muss erkennbar sein
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Keine Manipulation / Bildbearbeitung
            </Text>
          </View>
        </View>

        {/* Preview / picker */}
        {imageUri ? (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
            <TouchableOpacity
              onPress={() => setImageUri(null)}
              style={[styles.removeBtn, { backgroundColor: colors.error }]}
            >
              <Ionicons name="close" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickerRow}>
            <TouchableOpacity
              onPress={pickImage}
              style={[styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <Ionicons name="images-outline" size={28} color={colors.primary} />
              <Text style={[styles.pickerLabel, { color: colors.textPrimary }]}>Galerie</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={takePhoto}
              style={[styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <Ionicons name="camera-outline" size={28} color={colors.primary} />
              <Text style={[styles.pickerLabel, { color: colors.textPrimary }]}>Kamera</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!imageUri || submitting}
          style={[
            styles.primaryBtn,
            {
              backgroundColor: colors.primary,
              opacity: !imageUri || submitting ? 0.5 : 1,
            },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Zur Prüfung einreichen</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textTertiary }]}>
            Später verifizieren →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: spacing.xxl,
  },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  emoji: { fontSize: 56, marginBottom: spacing.sm },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold as any,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: { fontSize: fontSize.sm, flex: 1 },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pickerBtn: {
    flex: 1,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pickerLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
  previewWrapper: {
    marginBottom: spacing.lg,
    position: 'relative',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: 400,
    borderRadius: radius.lg,
  },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold as any,
  },
  skipBtn: { alignItems: 'center', padding: spacing.md },
  skipText: { fontSize: fontSize.sm },
});
