/**
 * LegalScreen – Renders AGB, Datenschutzerklärung, or Impressum based on route param.
 * Full German legal texts with proper sections and formatting.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/providers/ThemeProvider';
import { THeader } from '../../src/components/common';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';
import type { Colors } from '../../src/theme/colors';

const LEGAL_VERSION = '1.0';
const LEGAL_DATE = 'April 2026';

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: Colors }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children, colors }: { children: React.ReactNode; colors: Colors }) {
  return <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{children}</Text>;
}

function Li({ children, colors }: { children: React.ReactNode; colors: Colors }) {
  return (
    <View style={styles.listItem}>
      <Text style={[styles.bullet, { color: colors.textTertiary }]}>•</Text>
      <Text style={[styles.listText, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════
// AGB – Allgemeine Geschäftsbedingungen
// ═══════════════════════════════════════════
function AGBContent({ colors }: { colors: Colors }) {
  return (
    <>
      <Section title="§ 1 Geltungsbereich & Vertragspartner" colors={colors}>
        <P colors={colors}>Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für die Nutzung der mobilen Applikation „Tourneo" (nachfolgend „App") und aller damit verbundenen Dienstleistungen, bereitgestellt durch [FIRMENNAME], [STRASSE], [PLZ] [STADT], Deutschland (nachfolgend „Betreiber").</P>
        <P colors={colors}>Mit der Registrierung und Nutzung der App akzeptiert der Nutzer diese AGB in ihrer jeweils gültigen Fassung. Abweichende Geschäftsbedingungen des Nutzers werden nicht anerkannt, es sei denn, der Betreiber stimmt ihrer Geltung ausdrücklich schriftlich zu.</P>
      </Section>

      <Section title="§ 2 Registrierung & Mindestalter" colors={colors}>
        <P colors={colors}>Die Nutzung der App erfordert eine Registrierung. Der Nutzer muss zum Zeitpunkt der Registrierung mindestens 18 Jahre alt sein. Mit der Registrierung bestätigt der Nutzer, dass die angegebenen Daten vollständig und wahrheitsgemäß sind.</P>
        <P colors={colors}>Der Nutzer ist verpflichtet, seine Zugangsdaten vertraulich zu behandeln und den Betreiber unverzüglich zu informieren, falls ein Missbrauch des Kontos vermutet wird.</P>
      </Section>

      <Section title="§ 3 Turnier-Anmeldung" colors={colors}>
        <P colors={colors}>Die Anmeldung zu einem Turnier über die App stellt ein verbindliches Angebot des Nutzers dar. Der Vertrag kommt mit der Bestätigung der Anmeldung durch die App zustande.</P>
        <P colors={colors}>Stornierungsbedingungen:</P>
        <Li colors={colors}>Stornierung mehr als 14 Tage vor dem Event: 75% Rückerstattung der Teilnahmegebühr.</Li>
        <Li colors={colors}>Stornierung weniger als 14 Tage vor dem Event: Keine Rückerstattung, außer bei höherer Gewalt (z.B. Krankheit mit ärztlichem Attest).</Li>
        <Li colors={colors}>Bei Turnierausfall durch den Veranstalter: Vollständige Rückerstattung innerhalb von 14 Werktagen.</Li>
      </Section>

      <Section title="§ 4 Membership-Abonnements" colors={colors}>
        <P colors={colors}>Die App bietet kostenpflichtige Mitgliedschaften („Tourneo Plus" und „Tourneo Club") als monatlich kündbare Abonnements an.</P>
        <Li colors={colors}>Tourneo Plus: 9,99 €/Monat – 10% Rabatt, 24h Early Access, höhere Wartelisten-Priorität.</Li>
        <Li colors={colors}>Tourneo Club: 19,99 €/Monat – 20% Rabatt, 48h Early Access, exklusive Turniere, Premium-Statistiken.</Li>
        <P colors={colors}>Die Abrechnung erfolgt über Apple In-App Purchase (iOS) oder Google Play Billing (Android). Die Kündigung erfolgt über die jeweilige Plattform (Apple / Google). Das Widerrufsrecht von 14 Tagen gemäß § 355 BGB bleibt unberührt.</P>
      </Section>

      <Section title="§ 5 Zahlungsbedingungen" colors={colors}>
        <P colors={colors}>Zahlungen für Turniergebühren werden über den Zahlungsdienstleister Stripe, Inc. (USA) abgewickelt. Der Betreiber speichert keine vollständigen Kreditkartendaten. Es gelten zusätzlich die Nutzungsbedingungen und Datenschutzrichtlinien von Stripe (https://stripe.com/de/privacy).</P>
        <P colors={colors}>Bei fehlgeschlagener Zahlung wird die Turnieranmeldung nicht bestätigt. Der Nutzer wird umgehend informiert und kann die Zahlung wiederholen.</P>
      </Section>

      <Section title="§ 6 Haftungsausschluss" colors={colors}>
        <P colors={colors}>Der Betreiber haftet nicht für Schäden, die durch die Teilnahme an Turnieren entstehen, soweit nicht Vorsatz oder grobe Fahrlässigkeit des Betreibers vorliegt. Insbesondere übernimmt der Betreiber keine Haftung für:</P>
        <Li colors={colors}>Verletzungen während der Sportausübung</Li>
        <Li colors={colors}>Schäden an persönlichem Eigentum am Veranstaltungsort</Li>
        <Li colors={colors}>Turnierausfall oder -verschiebung durch höhere Gewalt</Li>
        <Li colors={colors}>Technische Störungen der App, die nicht vom Betreiber zu vertreten sind</Li>
      </Section>

      <Section title="§ 7 Community-Verhaltensregeln" colors={colors}>
        <P colors={colors}>Innerhalb der Community-Funktionen der App verpflichtet sich der Nutzer zu einem respektvollen Umgang. Untersagt sind insbesondere:</P>
        <Li colors={colors}>Beleidigende, diskriminierende oder rassistische Äußerungen</Li>
        <Li colors={colors}>Spam, Werbung oder irreführende Inhalte</Li>
        <Li colors={colors}>Das Teilen von persönlichen Daten Dritter ohne deren Einwilligung</Li>
        <P colors={colors}>Bei Verstoß behält sich der Betreiber das Recht vor, das Nutzerkonto zu sperren oder zu löschen.</P>
      </Section>

      <Section title="§ 8 Geistiges Eigentum" colors={colors}>
        <P colors={colors}>Alle Inhalte der App (Texte, Grafiken, Logos, Software) sind urheberrechtlich geschützt und Eigentum des Betreibers oder lizenzierter Dritter. Eine Vervielfältigung, Verbreitung oder Bearbeitung bedarf der vorherigen schriftlichen Zustimmung des Betreibers.</P>
      </Section>

      <Section title="§ 9 Änderungsvorbehalt" colors={colors}>
        <P colors={colors}>Der Betreiber behält sich das Recht vor, diese AGB jederzeit mit einer Ankündigungsfrist von 30 Tagen zu ändern. Die Änderungen werden dem Nutzer per E-Mail und In-App-Benachrichtigung mitgeteilt. Widerspricht der Nutzer nicht innerhalb von 30 Tagen, gelten die neuen AGB als akzeptiert.</P>
      </Section>

      <Section title="§ 10 Anwendbares Recht & Gerichtsstand" colors={colors}>
        <P colors={colors}>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist [STADT], soweit der Nutzer Kaufmann ist oder keinen allgemeinen Gerichtsstand in Deutschland hat.</P>
        <P colors={colors}>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr. Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.</P>
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// DATENSCHUTZERKLÄRUNG
// ═══════════════════════════════════════════
function DatenschutzContent({ colors }: { colors: Colors }) {
  return (
    <>
      <Section title="1. Verantwortlicher" colors={colors}>
        <P colors={colors}>[FIRMENNAME]{'\n'}[STRASSE]{'\n'}[PLZ] [STADT]{'\n'}Deutschland{'\n'}E-Mail: [EMAIL]{'\n'}Telefon: [TELEFON]</P>
        <P colors={colors}>Datenschutzbeauftragter: [NAME DES DSB]{'\n'}E-Mail: datenschutz@tourneo.de</P>
      </Section>

      <Section title="2. Welche Daten wir erheben" colors={colors}>
        <P colors={colors}>Im Rahmen der Nutzung der App erheben und verarbeiten wir folgende personenbezogene Daten:</P>
        <Li colors={colors}>Stammdaten: Vor- und Nachname, E-Mail-Adresse, Geburtsdatum, Stadt</Li>
        <Li colors={colors}>Profildaten: Profilbild/Avatar, Anzeigename, Spielstärke</Li>
        <Li colors={colors}>Nutzungsdaten: Turnier-Teilnahmen, Ergebnisse, ELO-Rating, Bracket-Daten</Li>
        <Li colors={colors}>Kommunikationsdaten: Push-Notification-Token, Community-Nachrichten</Li>
        <Li colors={colors}>Zahlungsdaten: Zahlungs-IDs (über Stripe verarbeitet – keine vollständigen Kreditkartendaten)</Li>
        <Li colors={colors}>Kalenderdaten: Nur bei expliziter Freigabe zum Hinzufügen von Turnierterminen</Li>
        <Li colors={colors}>Technische Daten: Gerätetyp, OS-Version, App-Version, IP-Adresse (anonymisiert)</Li>
      </Section>

      <Section title="3. Rechtsgrundlagen (Art. 6 DSGVO)" colors={colors}>
        <Li colors={colors}>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO): Registrierung, Turnier-Anmeldung, Zahlungsabwicklung, Mitgliedschaftsverwaltung</Li>
        <Li colors={colors}>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO): Push-Benachrichtigungen, Newsletter, personalisierte Empfehlungen, Kalender-Integration</Li>
        <Li colors={colors}>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO): App-Sicherheit, Betrugsprävention, aggregierte Statistiken zur Verbesserung des Dienstes</Li>
      </Section>

      <Section title="4. Drittanbieter & Datenübermittlung in Drittländer" colors={colors}>
        <P colors={colors}>Wir setzen folgende Drittanbieter ein, die personenbezogene Daten verarbeiten:</P>
        <P colors={colors}>a) Stripe, Inc. (USA) – Zahlungsabwicklung{'\n'}Stripe verarbeitet Zahlungsdaten im Auftrag des Betreibers. Die Datenübermittlung in die USA erfolgt auf Grundlage von EU-Standardvertragsklauseln (SCC) gemäß Art. 46 Abs. 2 lit. c DSGVO.{'\n'}Datenschutz: https://stripe.com/de/privacy</P>
        <P colors={colors}>b) Firebase / Google LLC (USA) – Push-Benachrichtigungen{'\n'}Firebase Cloud Messaging wird für die Zustellung von Push-Benachrichtigungen verwendet. Datenübermittlung auf Basis von EU-Standardvertragsklauseln.{'\n'}Datenschutz: https://firebase.google.com/support/privacy</P>
        <P colors={colors}>c) Expo / Meta Platforms, Inc. (USA) – App-Infrastruktur{'\n'}Expo EAS wird für den Build- und Update-Prozess der App verwendet. Datenübermittlung auf Basis von EU-Standardvertragsklauseln.{'\n'}Datenschutz: https://expo.dev/privacy</P>
      </Section>

      <Section title="5. Datenspeicherung & Löschfristen" colors={colors}>
        <Li colors={colors}>Kontodaten: Werden für die Dauer des Vertragsverhältnisses gespeichert und nach Kündigung innerhalb von 30 Tagen gelöscht, sofern keine gesetzliche Aufbewahrungspflicht besteht.</Li>
        <Li colors={colors}>Turnier- und Ergebnisdaten: Werden für statistische Zwecke (Ranglisten, ELO-Rating) aggregiert aufbewahrt. Personenbezogene Zuordnung wird nach 3 Jahren gelöscht.</Li>
        <Li colors={colors}>Zahlungsdaten: Gemäß handels- und steuerrechtlicher Vorschriften für 10 Jahre aufbewahrt (§ 147 AO, § 257 HGB).</Li>
        <Li colors={colors}>Push-Tokens: Werden bei Deinstallation der App oder Widerruf der Einwilligung sofort gelöscht.</Li>
        <Li colors={colors}>Logs und technische Daten: Werden nach 90 Tagen automatisch gelöscht.</Li>
      </Section>

      <Section title="6. Deine Rechte" colors={colors}>
        <P colors={colors}>Du hast gemäß DSGVO folgende Rechte bezüglich deiner personenbezogenen Daten:</P>
        <Li colors={colors}>Recht auf Auskunft (Art. 15 DSGVO): Informationen über die von uns verarbeiteten Daten</Li>
        <Li colors={colors}>Recht auf Berichtigung (Art. 16 DSGVO): Korrektur unrichtiger Daten</Li>
        <Li colors={colors}>Recht auf Löschung (Art. 17 DSGVO): Löschung deiner Daten („Recht auf Vergessenwerden")</Li>
        <Li colors={colors}>Recht auf Datenübertragbarkeit (Art. 20 DSGVO): Export deiner Daten in einem gängigen Format</Li>
        <Li colors={colors}>Recht auf Widerspruch (Art. 21 DSGVO): Widerspruch gegen Datenverarbeitung auf Basis berechtigter Interessen</Li>
        <Li colors={colors}>Recht auf Einschränkung (Art. 18 DSGVO): Einschränkung der Verarbeitung unter bestimmten Voraussetzungen</Li>
        <P colors={colors}>Zur Ausübung deiner Rechte kontaktiere uns unter: datenschutz@tourneo.de</P>
        <P colors={colors}>Du kannst deine Daten jederzeit direkt in der App exportieren oder die Löschung beantragen (Einstellungen → Datenschutz).</P>
      </Section>

      <Section title="7. Datenschutzbeauftragter" colors={colors}>
        <P colors={colors}>[NAME DES DSB]{'\n'}E-Mail: datenschutz@tourneo.de{'\n'}Telefon: [TELEFON]</P>
      </Section>

      <Section title="8. Beschwerderecht bei Aufsichtsbehörde" colors={colors}>
        <P colors={colors}>Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn du der Meinung bist, dass die Verarbeitung deiner personenbezogenen Daten gegen die DSGVO verstößt.</P>
        <P colors={colors}>Zuständige Aufsichtsbehörde:{'\n'}Bayerisches Landesamt für Datenschutzaufsicht (BayLDA){'\n'}Promenade 18, 91522 Ansbach{'\n'}E-Mail: poststelle@lda.bayern.de{'\n'}https://www.lda.bayern.de</P>
      </Section>
    </>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getTitle = (): string => {
    switch (type) {
      case 'agb': return t('legal.agb');
      case 'datenschutz': return t('legal.datenschutz');
      case 'impressum': return t('legal.impressum');
      default: return t('profile.legal');
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'agb': return <AGBContent colors={colors} />;
      case 'datenschutz': return <DatenschutzContent colors={colors} />;
      case 'impressum': return <ImpressumContent colors={colors} />;
      default: return <P colors={colors}>Inhalt nicht gefunden.</P>;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <THeader title={getTitle()} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.versionInfo, { color: colors.textTertiary }]}>
          {t('legal.lastUpdated', { date: LEGAL_DATE, version: LEGAL_VERSION })}
        </Text>
        {renderContent()}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════
// IMPRESSUM
// ═══════════════════════════════════════════
function ImpressumContent({ colors }: { colors: Colors }) {
  return (
    <>
      <Section title="Angaben gemäß § 5 TMG" colors={colors}>
        <P colors={colors}>[FIRMENNAME]{'\n'}[STRASSE]{'\n'}[PLZ] [STADT]{'\n'}Deutschland</P>
        <P colors={colors}>Vertreten durch:{'\n'}[GESCHÄFTSFÜHRER/IN]</P>
        <P colors={colors}>Registergericht: Amtsgericht [STADT]{'\n'}Registernummer: HRB [NUMMER]</P>
        <P colors={colors}>USt-IdNr.: DE[NUMMER]</P>
      </Section>

      <Section title="Kontakt" colors={colors}>
        <P colors={colors}>E-Mail: info@tourneo.de{'\n'}Telefon: [TELEFON]{'\n'}Webseite: https://tourneo.de</P>
      </Section>

      <Section title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV" colors={colors}>
        <P colors={colors}>[NAME]{'\n'}[STRASSE]{'\n'}[PLZ] [STADT]</P>
      </Section>

      <Section title="EU-Streitschlichtung" colors={colors}>
        <P colors={colors}>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr</P>
        <P colors={colors}>Unsere E-Mail-Adresse finden Sie oben im Impressum.</P>
        <P colors={colors}>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</P>
      </Section>

      <Section title="Haftungsausschluss" colors={colors}>
        <P colors={colors}>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</P>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  versionInfo: { fontSize: fontSize.xs, marginBottom: spacing.lg, fontStyle: 'italic' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold as any, marginBottom: spacing.sm },
  paragraph: { fontSize: fontSize.sm, lineHeight: 22, marginBottom: spacing.sm },
  listItem: { flexDirection: 'row', marginBottom: spacing.xs, paddingLeft: spacing.sm },
  bullet: { fontSize: fontSize.sm, marginRight: spacing.sm, lineHeight: 22 },
  listText: { fontSize: fontSize.sm, lineHeight: 22, flex: 1 },
});