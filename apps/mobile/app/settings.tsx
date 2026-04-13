import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Switch, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppColors } from '../src/hooks/useColorScheme';
import { THeader, TListItem, TCard, TButton, TDivider, TInput, TAvatar } from '../src/components/common';
import { useAuthStore } from '../src/store/authStore';
import { spacing, fontSize, fontWeight } from '../src/theme/spacing';
import api from '../src/api/client';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { user, logout, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim() || displayName.trim().length < 3) {
      Alert.alert('Fehler', 'Anzeigename muss mindestens 3 Zeichen haben.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/profile', { display_name: displayName.trim() });
      updateUser({ display_name: displayName.trim() });
      setEditing(false);
      Alert.alert('Erfolg', 'Profil wurde aktualisiert.');
    } catch (error: any) {
      Alert.alert('Fehler', error.response?.data?.message || 'Profil konnte nicht aktualisiert werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Konto löschen',
      'Bist du sicher, dass du dein Konto permanent löschen möchtest? Alle Daten werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Konto löschen',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Letzte Warnung',
              'Diese Aktion kann nicht rückgängig gemacht werden!',
              [
                { text: 'Abbrechen', style: 'cancel' },
                {
                  text: 'Endgültig löschen',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.delete('/users/account');
                      await logout();
                      router.replace('/(auth)/onboarding');
                    } catch (error: any) {
                      Alert.alert('Fehler', 'Konto konnte nicht gelöscht werden. Bitte kontaktiere den Support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (!user) {
    router.replace('/(auth)/login');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[100] }]}>
      <THeader title="Einstellungen" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TCard variant="default" style={styles.section}>
          <View style={styles.profileHeader}>
            <TAvatar uri={user.avatar_url} name={user.display_name} size="lg" />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.neutral[900] }]}>{user.display_name}</Text>
              <Text style={[styles.profileEmail, { color: colors.neutral[500] }]}>{user.email}</Text>
            </View>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <TInput
                label="Anzeigename"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <View style={styles.editButtons}>
                <TButton title="Speichern" onPress={handleSaveProfile} loading={loading} size="sm" fullWidth={false} style={{ flex: 1, marginRight: spacing.sm }} />
                <TButton title="Abbrechen" onPress={() => { setEditing(false); setDisplayName(user.display_name || ''); }} variant="outline" size="sm" fullWidth={false} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <TButton
              title="Profil bearbeiten"
              onPress={() => setEditing(true)}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          )}
        </TCard>

        {/* Notifications */}
        <TCard variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Benachrichtigungen</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.neutral[700] }]}>Push-Benachrichtigungen</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
              thumbColor={pushEnabled ? colors.primary[500] : colors.neutral[100]}
            />
          </View>
        </TCard>

        {/* Account Actions */}
        <TCard variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>Konto</Text>
          <TListItem
            title="Passwort ändern"
            leftIcon={<Text style={styles.menuIcon}>🔑</Text>}
            onPress={() => Alert.alert('Info', 'Passwort kann über "Passwort vergessen" auf der Login-Seite zurückgesetzt werden.')}
          />
          <TListItem
            title="Daten exportieren"
            leftIcon={<Text style={styles.menuIcon}>📦</Text>}
            onPress={() => Alert.alert('Datenexport', 'Ein Export deiner Daten wird per E-Mail zugesendet. Dies kann einige Minuten dauern.')}
          />
          <TListItem
            title="Käufe wiederherstellen"
            leftIcon={<Text style={styles.menuIcon}>🔄</Text>}
            onPress={() => Alert.alert('Info', 'In der Produktionsversion werden hier Apple-Käufe wiederhergestellt.')}
          />
        </TCard>

        {/* Danger Zone */}
        <TCard variant="default" style={StyleSheet.flatten([styles.section, { borderColor: colors.status.error, borderWidth: 1 }])}>
          <Text style={[styles.sectionTitle, { color: colors.status.error }]}>Gefahrenzone</Text>
          <Text style={[styles.dangerText, { color: colors.neutral[600] }]}>
            Das Löschen deines Kontos ist permanent und kann nicht rückgängig gemacht werden. Alle Daten, Turnierhistorie und Mitgliedschaften gehen verloren.
          </Text>
          <TButton
            title="Konto löschen"
            onPress={handleDeleteAccount}
            variant="danger"
            size="sm"
            style={{ marginTop: spacing.md }}
          />
        </TCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: spacing.md, flex: 1 },
  profileName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any },
  profileEmail: { fontSize: fontSize.sm, marginTop: 2 },
  editForm: { marginTop: spacing.md },
  editButtons: { flexDirection: 'row' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  switchLabel: { fontSize: fontSize.md },
  menuIcon: { fontSize: 20 },
  dangerText: { fontSize: fontSize.sm, lineHeight: 20 },
});