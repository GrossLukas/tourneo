# 🧪 Tourneo – Vollständiger Testleitfaden

## Inhaltsverzeichnis

1. [Voraussetzungen](#1-voraussetzungen)
2. [Backend Tests](#2-backend-tests)
3. [Mobile App Tests](#3-mobile-app-tests)
4. [API-Testing mit REST-Client](#4-api-testing-mit-rest-client)
5. [iOS Simulator Testing](#5-ios-simulator-testing)
6. [Android Emulator Testing](#6-android-emulator-testing)
7. [End-to-End Testing](#7-end-to-end-testing)
8. [Datenbank Testing](#8-datenbank-testing)
9. [Security Testing](#9-security-testing)
10. [Performance Testing](#10-performance-testing)

---

## 1. Voraussetzungen

### System-Anforderungen

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org/) |
| npm | 10.x+ | Kommt mit Node.js |
| macOS | 14+ (Sonoma) | Für iOS Simulator erforderlich |
| Xcode | 15+ | App Store → Xcode |
| iOS Simulator | 17+ | Xcode → Settings → Platforms |
| Android Studio | Latest | [developer.android.com](https://developer.android.com/studio) |
| MariaDB | 10.11+ | `brew install mariadb` oder IONOS Remote |
| Git | 2.x+ | `brew install git` |

### Projekt Setup

```bash
# Repository klonen
git clone https://github.com/BigLisBigger/tourneo.git
cd tourneo

# Alle Dependencies installieren (Monorepo)
npm install

# Environment-Variablen konfigurieren
cp apps/backend/.env.example apps/backend/.env
# Dann .env mit den richtigen Werten befüllen (siehe unten)
```

### .env Konfiguration (Backend)

```env
# Server
PORT=3000
NODE_ENV=development

# Datenbank (IONOS MariaDB)
DB_HOST=db5020220772.hosting-data.io
DB_PORT=3306
DB_USER=dbu3254635
DB_PASSWORD=<dein-passwort>
DB_NAME=dbs15550863
DB_PREFIX=tourneo_

# JWT
JWT_SECRET=<sicherer-zufälliger-string-min-64-zeichen>
JWT_REFRESH_SECRET=<anderer-sicherer-string-min-64-zeichen>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Apple Sign-In (für Produktion)
APPLE_CLIENT_ID=de.tourneo.app
APPLE_TEAM_ID=<dein-apple-team-id>

# Stripe (für Zahlungen)
STRIPE_SECRET_KEY=sk_test_<dein-stripe-test-key>
STRIPE_WEBHOOK_SECRET=whsec_<dein-webhook-secret>

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@tourneo.de
SMTP_PASS=<dein-smtp-passwort>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 2. Backend Tests

### Unit Tests ausführen

```bash
# In den Backend-Ordner wechseln
cd apps/backend

# Alle Tests ausführen
npm test

# Tests mit Verbose Output
npm run test:verbose

# Tests mit Coverage Report
npm run test:coverage

# Einzelne Test-Suite ausführen
npx jest --forceExit src/__tests__/validators/auth.test.ts
npx jest --forceExit src/__tests__/middleware/security.test.ts
```

### Aktueller Teststatus

| Test-Suite | Tests | Status |
|-----------|-------|--------|
| Validators: Auth | 38 | ✅ PASS |
| Validators: Events | 36 | ✅ PASS |
| Validators: Registrations | 36 | ✅ PASS |
| Validators: Users | 59 | ✅ PASS |
| Middleware: Security | 22 | ✅ PASS |
| Middleware: ErrorHandler | 18 | ✅ PASS |
| Middleware: Validate | 10 | ✅ PASS |
| **GESAMT** | **235** | **✅ 100% PASS** |

### TypeScript Compilation Check

```bash
# Backend TypeScript Check
cd apps/backend
npx tsc --noEmit

# Mobile TypeScript Check
cd apps/mobile
npx tsc --noEmit
```

Beide sollten **0 Fehler** zurückgeben.

---

## 3. Mobile App Tests

### Expo Development Server starten

```bash
cd apps/mobile

# Development Server starten
npx expo start

# Nur iOS
npx expo start --ios

# Nur Android
npx expo start --android
```

### TypeScript Überprüfung

```bash
cd apps/mobile
npx tsc --noEmit
# Erwartet: 0 Fehler
```

### Manuelle UI-Tests Checkliste

#### Auth Flow
- [ ] Registrierung mit E-Mail/Passwort
- [ ] Login mit E-Mail/Passwort
- [ ] Passwort vergessen Flow
- [ ] Apple Sign-In (nur auf physischem Gerät)
- [ ] Onboarding-Screens
- [ ] Logout
- [ ] Token-Refresh (15min warten)

#### Home Screen
- [ ] Begrüßung zeigt korrekten Zeitgruß
- [ ] Pull-to-Refresh lädt neue Daten
- [ ] Quick Actions navigieren korrekt
- [ ] Featured Events werden angezeigt
- [ ] Login-Prompt bei nicht angemeldeten Nutzern

#### Turnier-Suche (Padel Tab)
- [ ] Events werden geladen und angezeigt
- [ ] Suchleiste filtert Events
- [ ] Skill-Level Filter funktioniert
- [ ] Format Filter funktioniert
- [ ] Stadt Filter funktioniert
- [ ] Pull-to-Refresh
- [ ] Leerer Zustand bei keinen Ergebnissen

#### Event Detail
- [ ] Alle Event-Infos werden korrekt angezeigt
- [ ] Preisgeld-Anzeige
- [ ] Teilnehmer-Zähler
- [ ] Anmeldung-Button (angemeldet)
- [ ] Login-Aufforderung (nicht angemeldet)
- [ ] Wartelisten-Modus bei vollen Events

#### Anmeldung
- [ ] Solo/Duo/Team Auswahl
- [ ] Partner E-Mail bei Duo
- [ ] Team-Auswahl bei Team
- [ ] Kostenübersicht
- [ ] Mitglieder-Rabatt wird angezeigt
- [ ] Bestätigungsdialog
- [ ] Erfolgs-/Fehlermeldung

#### Community
- [ ] Team erstellen
- [ ] Team-Mitglieder einladen
- [ ] Freundesliste
- [ ] Team-Übersicht

#### Bookings
- [ ] Aktive Buchungen anzeigen
- [ ] Vergangene Buchungen
- [ ] Stornierung möglich
- [ ] Status-Badges (bestätigt, Warteliste, etc.)

#### Profil & Einstellungen
- [ ] Profilbild ändern
- [ ] Name/Bio bearbeiten
- [ ] Sprache ändern (DE/EN)
- [ ] Dark Mode Toggle
- [ ] Benachrichtigungen ein/aus
- [ ] Mitgliedschaft anzeigen
- [ ] Account löschen

---

## 4. API-Testing mit REST-Client

### Empfohlene Tools
- **Postman**: [postman.com](https://www.postman.com/)
- **Insomnia**: [insomnia.rest](https://insomnia.rest/)
- **VS Code REST Client**: Extension `humao.rest-client`

### Backend starten

```bash
cd apps/backend
npm run dev
# Server läuft auf http://localhost:3000
```

### API Endpoints testen

#### Health Check
```http
GET http://localhost:3000/api/v1/health
```

#### Registrierung
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "test@tourneo.de",
  "password": "TestPasswort123!",
  "first_name": "Max",
  "last_name": "Mustermann",
  "date_of_birth": "1990-01-15",
  "country_code": "DE",
  "consent_terms": true,
  "consent_privacy": true,
  "consent_age": true,
  "terms_version_id": 1,
  "privacy_version_id": 1
}
```

#### Login
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@tourneo.de",
  "password": "TestPasswort123!"
}
```

#### Events abrufen (Auth erforderlich)
```http
GET http://localhost:3000/api/v1/events?page=1&per_page=10
Authorization: Bearer <access_token>
```

#### Event erstellen (Auth + Organizer erforderlich)
```http
POST http://localhost:3000/api/v1/events
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Padel Championship Berlin 2025",
  "description": "Das größte Padel-Turnier in Berlin",
  "sport_category": "padel",
  "venue_id": 1,
  "start_date": "2025-08-01T09:00:00Z",
  "end_date": "2025-08-02T18:00:00Z",
  "registration_opens_at": "2025-06-01T00:00:00Z",
  "registration_closes_at": "2025-07-25T23:59:59Z",
  "max_participants": 32,
  "entry_fee_cents": 2500,
  "currency": "EUR",
  "level": "intermediate",
  "format": "doubles"
}
```

#### Für Event registrieren
```http
POST http://localhost:3000/api/v1/registrations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "event_id": 1,
  "registration_type": "solo",
  "consent_tournament_terms": true,
  "consent_age_verification": true
}
```

---

## 5. iOS Simulator Testing

### Voraussetzungen
- macOS 14+ (Sonoma oder neuer)
- Xcode 15+ aus dem App Store
- iOS 17+ Simulator Runtime

### Setup

```bash
# 1. Xcode Command Line Tools
xcode-select --install

# 2. iOS Simulator Runtime installieren
# Xcode öffnen → Settings → Platforms → iOS 17.x herunterladen

# 3. Verfügbare Simulatoren auflisten
xcrun simctl list devices available

# 4. Expo Development Build für Simulator
cd apps/mobile
npx expo start --ios
```

### EAS Development Build (empfohlen)

```bash
# EAS CLI global installieren
npm install -g eas-cli

# Bei Expo einloggen
npx eas login

# Development Build für iOS Simulator
npx eas build --profile development --platform ios

# Nach dem Build: .app auf dem Simulator installieren
# Der Build-Link wird in der Konsole angezeigt
```

### Testing auf physischem iOS-Gerät

```bash
# 1. Expo Go App aus dem App Store installieren
# 2. Development Server starten
npx expo start

# 3. QR-Code mit der Kamera scannen
# Oder: Expo Go App öffnen und URL manuell eingeben
```

---

## 6. Android Emulator Testing

### Voraussetzungen
- Android Studio (Latest)
- Android SDK 34+
- Android Emulator

### Setup

```bash
# 1. Android branch auschecken
git checkout android

# 2. Android Studio öffnen
# Tools → Device Manager → Create Virtual Device
# Pixel 7 auswählen, API 34 Image herunterladen

# 3. Emulator starten und Expo starten
cd apps/mobile
npx expo start --android
```

### EAS Build für Android

```bash
# Preview Build (APK)
npx eas build --profile preview:android --platform android

# Production Build (AAB für Play Store)
npx eas build --profile production:android --platform android
```

---

## 7. End-to-End Testing

### Empfohlenes Setup: Detox (iOS)

```bash
# Detox installieren (optional, für fortgeschrittene E2E Tests)
npm install -g detox-cli
cd apps/mobile
npm install --save-dev detox @types/detox

# Detox Konfiguration erstellen
# detox.config.js wird benötigt
```

### Manueller E2E Test-Flow

1. **Backend starten**: `cd apps/backend && npm run dev`
2. **Datenbank migrieren**: `cd apps/backend && npm run migrate`
3. **Seed-Daten laden**: `cd apps/backend && npm run seed`
4. **Mobile App starten**: `cd apps/mobile && npx expo start --ios`
5. **Kompletten Flow testen**: Registrierung → Login → Event suchen → Anmelden → Profil → Logout

---

## 8. Datenbank Testing

### Migrationen

```bash
cd apps/backend

# Alle Migrationen ausführen
npm run migrate

# Migration Status prüfen
npx knex migrate:status

# Letzte Migration rückgängig machen
npx knex migrate:rollback

# Alle Migrationen rückgängig machen
npx knex migrate:rollback --all
```

### Seed-Daten

```bash
# Testdaten laden
npm run seed

# Oder direkt mit Knex
npx knex seed:run
```

### Direkte Datenbankverbindung

```bash
# MariaDB CLI (wenn lokal installiert)
mysql -h db5020220772.hosting-data.io -u dbu3254635 -p dbs15550863

# Tabellen anzeigen
SHOW TABLES;

# Events auflisten
SELECT * FROM tourneo_events LIMIT 10;

# Benutzer auflisten
SELECT id, email, first_name, last_name, status FROM tourneo_users;
```

---

## 9. Security Testing

### Automatisierte Security Tests

Die Security Middleware wird durch 22 Unit Tests abgedeckt:

```bash
cd apps/backend
npx jest --forceExit src/__tests__/middleware/security.test.ts --verbose
```

### Getestete Sicherheitsmaßnahmen

| Schutz | Beschreibung | Test |
|--------|-------------|------|
| Input Sanitization | Null-Bytes entfernen, XSS verhindern | ✅ |
| Prototype Pollution | `__proto__`, `constructor`, `prototype` blockieren | ✅ |
| Security Headers | CSP, X-Frame-Options, HSTS, etc. | ✅ |
| Request Size Limit | Payloads > 512KB blockieren | ✅ |
| Brute Force Protection | IP-basierte Sperre nach 5 Fehlversuchen | ✅ |
| Parameter Pollution | Doppelte Query-Parameter bereinigen | ✅ |
| Rate Limiting | 100 Requests/15min pro IP | ✅ |
| CORS | Nur erlaubte Origins | ✅ |
| Helmet | Standard Security Headers | ✅ |
| JWT | Token-basierte Auth mit Refresh | ✅ |

### Manuelle Security Tests

```bash
# 1. SQL Injection Test
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.de OR 1=1 --", "password": "test"}'
# Erwartet: 400 Bad Request (Zod Validation)

# 2. XSS Test
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name": "<script>alert(1)</script>", "email": "xss@test.de", "password": "Test1234!"}'
# Erwartet: Sanitized Input

# 3. Prototype Pollution Test
curl -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"__proto__": {"isAdmin": true}, "title": "Test"}'
# Erwartet: __proto__ wird entfernt

# 4. Brute Force Test
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.de", "password": "wrong"}'
done
# Erwartet: 429 nach 5 Versuchen

# 5. Large Payload Test
python3 -c "print('{\"data\":\"' + 'A'*600000 + '\"}')" | \
  curl -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -d @-
# Erwartet: 413 Payload Too Large
```

### npm Audit

```bash
# Sicherheitslücken in Dependencies prüfen
cd /path/to/tourneo
npm audit

# Automatisch fixbare Probleme beheben
npm audit fix
```

---

## 10. Performance Testing

### Backend Load Testing mit Artillery

```bash
# Artillery installieren
npm install -g artillery

# Einfacher Load Test
artillery quick --count 50 --num 10 http://localhost:3000/api/v1/health

# Erweiterter Load Test mit Konfiguration
# artillery.yml erstellen und ausführen
```

### Mobile App Performance

- **Expo DevTools**: Performance Tab im Metro Bundler
- **React Native Debugger**: Performance Monitor aktivieren
- **Flipper** (optional): Detaillierte Performance Analyse

### Metriken

| Metrik | Zielwert |
|--------|---------|
| API Response Time (p95) | < 200ms |
| App Cold Start | < 3s |
| App Hot Start | < 1s |
| Screen Transition | < 300ms |
| FPS während Scroll | 60fps |

---

## Troubleshooting

### Häufige Probleme

**1. "Cannot connect to database"**
```bash
# Prüfe .env Konfiguration
# Stelle sicher, dass die IP in der IONOS Firewall freigeschaltet ist
```

**2. "Metro bundler not starting"**
```bash
# Cache leeren
npx expo start -c
```

**3. "iOS Simulator not found"**
```bash
# Xcode Command Line Tools neu installieren
sudo xcode-select --reset
xcode-select --install
```

**4. "Type errors in mobile app"**
```bash
# TypeScript Cache leeren
cd apps/mobile
rm -rf node_modules/.cache
npx tsc --noEmit
```

**5. "Tests failing with module not found"**
```bash
# Dependencies neu installieren
cd /path/to/tourneo
rm -rf node_modules apps/*/node_modules
npm install
```

---

## Quick-Start Checkliste

- [ ] Node.js 20.x installiert
- [ ] Repository geklont
- [ ] `npm install` ausgeführt
- [ ] `.env` konfiguriert
- [ ] Datenbank-Migration ausgeführt
- [ ] Backend Tests laufen (`npm test` in apps/backend)
- [ ] TypeScript fehlerfrei (`npx tsc --noEmit`)
- [ ] Backend Server gestartet (`npm run dev`)
- [ ] Mobile App gestartet (`npx expo start`)
- [ ] iOS Simulator / Gerät verbunden
- [ ] Kompletter Auth-Flow getestet