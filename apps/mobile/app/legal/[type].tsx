import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppColors } from '../../src/hooks/useColorScheme';
import { THeader, TLoadingScreen } from '../../src/components/common';
import api from '../../src/api/client';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const colors = useAppColors();
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const getTitleForType = (t: string): string => {
    switch (t) {
      case 'terms': return 'Allgemeine Geschäftsbedingungen';
      case 'privacy': return 'Datenschutzerklärung';
      case 'imprint': return 'Impressum';
      default: return 'Rechtliches';
    }
  };

  useEffect(() => {
    setTitle(getTitleForType(type || ''));
    fetchLegalContent();
  }, [type]);

  const fetchLegalContent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/legal/${type}`, { params: { language: 'de' } });
      setContent(response.data.data?.content || getFallbackContent(type || ''));
    } catch (error: any) {
      setContent(getFallbackContent(type || ''));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackContent = (t: string): string => {
    switch (t) {
      case 'terms':
        return `ALLGEMEINE GESCHÄFTSBEDINGUNGEN

Stand: 2025

1. Geltungsbereich
Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Turneo-App und aller damit verbundenen Dienste.

2. Anbieter
Turneo
E-Mail: gross.lukas01@web.de

3. Registrierung
Die Nutzung der App erfordert eine Registrierung. Nutzer müssen mindestens 18 Jahre alt sein. Bei der Registrierung sind wahrheitsgemäße Angaben zu machen.

4. Turnieranmeldung & Zahlung
Die Teilnahme an Turnieren erfordert eine vorherige Anmeldung und ggf. die Zahlung der Teilnahmegebühr. Die Zahlung erfolgt über Stripe.

5. Stornierungsrichtlinie
• Stornierung 14+ Tage vor dem Event: 75% Erstattung
• Stornierung weniger als 14 Tage vor dem Event: Keine Erstattung
• Absage durch den Veranstalter: 100% Erstattung

6. Mitgliedschaften
Mitgliedschaften (Plus, Club) werden als Abonnements über Apple In-App Purchase abgewickelt. Die automatische Verlängerung kann in den iOS-Einstellungen deaktiviert werden.

7. Haftung
Die Teilnahme an Sportveranstaltungen erfolgt auf eigene Gefahr. Turneo haftet nicht für Verletzungen oder Schäden, die im Rahmen von Turnieren entstehen.

⚠️ HINWEIS: Diese AGB müssen vor Veröffentlichung von einem Rechtsanwalt geprüft werden.`;

      case 'privacy':
        return `DATENSCHUTZERKLÄRUNG

Stand: 2025

1. Verantwortlicher
Turneo
E-Mail: gross.lukas01@web.de

2. Erhobene Daten
Wir erheben folgende personenbezogene Daten:
• Name, E-Mail-Adresse, Geburtsdatum
• Spielerstatistiken und Turnierteilnahmen
• Zahlungsinformationen (verarbeitet durch Stripe)
• Geräteinformationen und Nutzungsdaten

3. Zweck der Verarbeitung
Die Daten werden verarbeitet für:
• Bereitstellung und Verwaltung des Benutzerkontos
• Organisation und Durchführung von Turnieren
• Abwicklung von Zahlungen
• Kommunikation und Benachrichtigungen

4. Rechtsgrundlage
Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 DSGVO:
• Einwilligung (Art. 6 Abs. 1 lit. a)
• Vertragserfüllung (Art. 6 Abs. 1 lit. b)
• Berechtigte Interessen (Art. 6 Abs. 1 lit. f)

5. Deine Rechte
Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.

6. Datenlöschung
Kontodaten werden auf Anfrage gelöscht. Eine Löschung kann in der App oder per E-Mail angefordert werden.

⚠️ HINWEIS: Diese Datenschutzerklärung muss vor Veröffentlichung von einem Rechtsanwalt geprüft werden.`;

      case 'imprint':
        return `IMPRESSUM

Turneo
Verantwortlich: Lukas Gross
E-Mail: gross.lukas01@web.de

Angaben gemäß § 5 TMG

⚠️ HINWEIS: Vollständige Impressumspflichtangaben müssen vor Veröffentlichung ergänzt werden (Anschrift, Handelsregister, USt-ID etc.).`;

      default:
        return 'Inhalt nicht verfügbar.';
    }
  };

  if (loading) return <TLoadingScreen message="Wird geladen..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <THeader title={title} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.text, { color: colors.textSecondary }]}>{content}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  text: { fontSize: fontSize.sm, lineHeight: 22 },
});