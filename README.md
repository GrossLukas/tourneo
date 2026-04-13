# 🎾 Turneo – Sport Events & Tournament Platform

<div align="center">

**iOS-first mobile app for sport events, Padel tournaments, community, and event discovery.**

![Version](https://img.shields.io/badge/version-1.0.0--MVP-blue)
![Platform](https://img.shields.io/badge/platform-iOS-lightgrey)
![License](https://img.shields.io/badge/license-proprietary-red)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Backend Setup](#-backend-setup)
- [Mobile App Setup](#-mobile-app-setup)
- [Testing on iOS Simulator](#-testing-on-ios-simulator)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Features](#-features)
- [Membership Tiers](#-membership-tiers)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🏆 Overview

Turneo is a comprehensive iOS-first mobile platform for discovering, organizing, and participating in Padel tournaments and sport events. Built with a "Padel first, FIFA architecture" approach, the platform is designed to expand to additional sports in the future.

### Key Highlights

- **Tournament Discovery & Registration** – Browse, filter, and sign up for Padel tournaments with real-time availability
- **Bracket System** – Automated single-elimination bracket generation with seeding, byes, and optional 3rd place matches
- **Membership Tiers** – Free, Plus (€7.99/mo), and Club (€14.99/mo) with early access, fee discounts, and waitlist priority
- **Court Finder** – Discover venues with court details and external booking links
- **Community** – Teams, friendships, and player search
- **Guaranteed Prize Money** – Transparent prize pool distribution
- **DSGVO Compliant** – Consent logging, data export, account deletion
- **German-First** – Full i18n support (DE primary, EN secondary)
- **18+ Only** – Age verification required at registration

---

## 🛠 Tech Stack

### Mobile App
| Technology | Purpose |
|---|---|
| React Native + Expo | Cross-platform framework (iOS-first) |
| Expo Router | File-based navigation |
| TypeScript | Type safety |
| Zustand | State management |
| Axios | HTTP client |
| i18next | Internationalization |
| date-fns | Date formatting |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| Knex.js | SQL query builder + migrations |
| MariaDB 10.11 | Relational database (IONOS) |
| JWT | Authentication |
| Zod | Request validation |
| Stripe | Payment processing (tournaments) |
| Firebase Admin | Push notifications (APNs) |
| bcryptjs | Password hashing |

---

## 📁 Project Structure

```
turneo/
├── package.json                    # Root monorepo config
├── README.md                       # This file
├── docs/
│   └── TURNEO_PRD.md              # Product Requirements Document
├── apps/
│   ├── backend/                    # Node.js/Express API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── src/
│   │       ├── index.ts           # Server entry point
│   │       ├── config/            # DB, environment, Knex config
│   │       ├── types/             # TypeScript type definitions
│   │       ├── middleware/        # Auth, error handler, rate limiter, validation
│   │       ├── validators/        # Zod schemas (auth, events, registrations, users)
│   │       ├── services/          # Business logic (auth, events, registrations, brackets, payments)
│   │       ├── controllers/       # Route handlers
│   │       ├── routes/            # Express route definitions
│   │       ├── migrations/        # Database migrations
│   │       └── seeds/             # Initial data (legal docs, admin, sample data)
│   └── mobile/                     # React Native/Expo app
│       ├── package.json
│       ├── app.json               # Expo config
│       ├── App.tsx                # App entry
│       ├── app/                   # Expo Router screens
│       │   ├── _layout.tsx        # Root layout
│       │   ├── index.tsx          # Entry redirect
│       │   ├── (auth)/            # Auth screens (onboarding, login, register)
│       │   ├── (tabs)/            # Tab screens (home, padel, bookings, community, profile)
│       │   ├── event/             # Event detail, registration, bracket
│       │   ├── venue/             # Venue detail
│       │   ├── legal/             # Legal pages (terms, privacy, imprint)
│       │   ├── membership.tsx     # Membership plans
│       │   ├── support.tsx        # Support tickets
│       │   └── settings.tsx       # Account settings
│       └── src/
│           ├── api/               # Axios client with auth interceptor
│           ├── components/        # Reusable UI components
│           │   ├── common/        # Design system (TButton, TCard, TInput, etc.)
│           │   ├── events/        # Event cards, filters
│           │   ├── brackets/      # Bracket visualization
│           │   └── membership/    # Membership tier cards
│           ├── hooks/             # Custom hooks
│           ├── i18n/              # Translations (de, en)
│           ├── store/             # Zustand stores
│           └── theme/             # Colors, spacing, typography
```

---

## 📦 Prerequisites

Ensure you have the following installed:

| Requirement | Version | Installation |
|---|---|---|
| **Node.js** | 18.x or 20.x | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | Comes with Node.js |
| **Xcode** | 15+ | Mac App Store |
| **Xcode Command Line Tools** | Latest | `xcode-select --install` |
| **iOS Simulator** | iOS 17+ | Included with Xcode |
| **CocoaPods** | Latest | `sudo gem install cocoapods` |
| **Expo CLI** | Latest | `npm install -g expo-cli` |
| **EAS CLI** (optional) | Latest | `npm install -g eas-cli` |

> ⚠️ **macOS required** for iOS Simulator testing. Windows/Linux users can test via Expo Go on a physical iOS device.

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/BigLisBigger/turneo.git
cd turneo

# 2. Install dependencies
npm install

# 3. Set up the backend
cd apps/backend
cp .env.example .env
# Edit .env with your database credentials and secrets
npm install
npm run migrate    # Run database migrations
npm run seed       # Seed initial data
npm run dev        # Start backend on http://localhost:3000

# 4. In a new terminal, start the mobile app
cd apps/mobile
npm install
npx expo start --ios  # Opens iOS Simulator
```

---

## 🖥 Backend Setup

### 1. Install Dependencies

```bash
cd apps/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (IONOS MariaDB)
DB_HOST=db5020220772.hosting-data.io
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=dbs15550863
DB_TABLE_PREFIX=turneo_

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe (for tournament payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Run all migrations (creates 28+ tables with turneo_ prefix)
npm run migrate

# Seed initial data (legal docs, admin user, sample venues/events)
npm run seed

# To rollback migrations
npm run migrate:rollback
```

### 4. Start the Server

```bash
# Development (with hot-reload via ts-node-dev)
npm run dev

# Production build
npm run build
npm start
```

The API will be available at `http://localhost:3000/api/v1`

### 5. Verify Backend

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Should return: { "status": "ok", "timestamp": "..." }
```

---

## 📱 Mobile App Setup

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure API Endpoint

The API URL is configured in `src/api/client.ts`. For local development, it defaults to:
- iOS Simulator: `http://localhost:3000/api/v1`

### 3. Start the Development Server

```bash
npx expo start
```

Then press `i` to open in iOS Simulator, or scan the QR code with Expo Go on a physical device.

---

## 🧪 Testing on iOS Simulator

### Step-by-Step Guide

#### 1. Open Xcode and Install Simulator

```bash
# Install Xcode from the Mac App Store
# Then install command line tools:
xcode-select --install

# Open Xcode > Settings > Platforms > Download iOS 17+ Simulator
```

#### 2. Start the Backend

```bash
cd apps/backend
npm run dev
# Verify: curl http://localhost:3000/api/v1/health
```

#### 3. Start the Expo Development Server

```bash
cd apps/mobile
npx expo start --ios
```

This will:
1. Start the Metro bundler
2. Automatically open the iOS Simulator
3. Install Expo Go on the Simulator
4. Load the Turneo app

#### 4. Testing Workflow

**Registration Flow:**
1. App opens on Onboarding screen with 3 slides
2. Tap "Registrieren" to create an account
3. Fill in all fields (display name, name, email, DOB, password)
4. Accept all consents (AGB, Datenschutz, 18+)
5. Tap "Konto erstellen"
6. You'll be redirected to the Home screen

**Login Flow:**
1. Tap "Anmelden" on Onboarding
2. Enter email and password
3. Tap "Anmelden"

**Tournament Discovery:**
1. Navigate to "Padel" tab
2. Browse available tournaments
3. Use filters (skill level, format, city)
4. Use search bar
5. Tap a tournament card for details

**Tournament Registration:**
1. Open a tournament detail
2. Tap "Jetzt anmelden"
3. Select registration type (Einzel/Duo/Team)
4. Review fee breakdown (with membership discounts)
5. Confirm registration

**Community:**
1. Navigate to "Community" tab
2. Search for players
3. Send friend requests
4. Create teams

**Profile & Membership:**
1. Navigate to "Profil" tab
2. View stats and membership status
3. Tap "Mitgliedschaft" to view plans
4. Compare Free/Plus/Club tiers

**Support:**
1. Go to Profile > Hilfe & Support
2. Select category
3. Submit a support ticket

#### 5. Test Accounts

After seeding, the following admin account is available:

| Field | Value |
|---|---|
| Email | gross.lukas01@web.de |
| Password | TurneoAdmin2025! |
| Role | superadmin |

#### 6. Common Simulator Commands

| Action | Shortcut |
|---|---|
| Reload app | `Cmd + R` in Expo terminal |
| Open developer menu | `Cmd + D` |
| Toggle dark mode | Simulator > Features > Toggle Appearance |
| Simulate location | Simulator > Features > Location |
| Take screenshot | `Cmd + S` |
| Shake gesture | `Cmd + Ctrl + Z` |

#### 7. Troubleshooting

| Issue | Solution |
|---|---|
| Simulator not opening | Run `xcrun simctl boot "iPhone 15"` |
| Metro bundler crash | Delete `node_modules`, run `npm install` |
| Pod install errors | `cd ios && pod install --repo-update` |
| Network error | Ensure backend is running on port 3000 |
| Blank screen | Check terminal for error, reload with `Cmd + R` |
| Expo Go outdated | `npx expo start --clear` |

---

## 📡 API Documentation

### Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.turneo.de/api/v1
```

### Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

### Endpoints Overview

| Group | Endpoints | Auth Required |
|---|---|---|
| **Auth** | POST /auth/register, /auth/login, /auth/refresh, /auth/forgot-password | No |
| **Events** | GET /events, GET /events/:id, POST /events (admin) | Partial |
| **Registrations** | POST /registrations, GET /registrations/my, POST /registrations/:id/cancel | Yes |
| **Brackets** | GET /brackets/event/:id, POST /brackets/:id/matches/:mid/result (admin) | Partial |
| **Payments** | POST /payments/create-intent, POST /payments/webhook | Yes |
| **Venues** | GET /venues, GET /venues/:id | No |
| **Community** | GET /community/friends, POST /community/friends/request, /community/teams | Yes |
| **Membership** | GET /membership/current, GET /membership/tiers, POST /membership/subscribe | Yes |
| **Notifications** | GET /notifications, POST /notifications/:id/read | Yes |
| **Support** | POST /support/tickets, GET /support/tickets | Yes |
| **Legal** | GET /legal/:type | No |
| **Admin** | GET /admin/stats/*, PUT /admin/users/:id/* | Admin |
| **Hall of Fame** | GET /hall-of-fame | No |

### Example Requests

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123",
    "display_name": "PadelPro",
    "first_name": "Max",
    "last_name": "Mustermann",
    "date_of_birth": "1995-06-15",
    "consent_terms": true,
    "consent_privacy": true,
    "consent_age_verification": true
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "player@example.com", "password": "SecurePass123"}'

# Get Events (with filters)
curl "http://localhost:3000/api/v1/events?sport_type=padel&skill_level=intermediate&city=München"

# Register for Event
curl -X POST http://localhost:3000/api/v1/registrations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"event_id": "<event_uuid>", "registration_type": "solo"}'
```

---

## 🗃 Database Schema

The database uses 28+ tables with the `turneo_` prefix. Key entities:

| Table | Purpose |
|---|---|
| `turneo_users` | User accounts with roles |
| `turneo_profiles` | Extended user profiles |
| `turneo_memberships` | Subscription tracking |
| `turneo_events` | Tournament/event definitions |
| `turneo_registrations` | Event sign-ups with status tracking |
| `turneo_payments` | Payment records (Stripe) |
| `turneo_brackets` | Tournament bracket structure |
| `turneo_matches` | Individual match records |
| `turneo_match_scores` | Set-by-set scoring |
| `turneo_venues` | Venue information |
| `turneo_courts` | Court details per venue |
| `turneo_teams` | Player teams |
| `turneo_friendships` | Social connections |
| `turneo_notifications` | In-app notifications |
| `turneo_consents` | DSGVO consent log |
| `turneo_audit_log` | Action audit trail |
| `turneo_legal_document_versions` | Versioned legal texts |

---

## ✨ Features

### 🏅 Tournaments
- Browse and filter by skill level, format, city
- Detailed event pages with prize pool breakdown
- Solo, Duo, and Team registration types
- Automated bracket generation (single elimination)
- Seeding system with bye handling
- Real-time bracket visualization
- Check-in system (1h before event)

### 💳 Payments
- Stripe integration for tournament fees
- Membership discounts (Plus: 10%, Club: 20%)
- Automatic refund calculation (75%/14-day policy)
- Guaranteed prize money distribution
- Apple In-App Purchase for subscriptions

### 👥 Community
- Friend system with request/accept flow
- Team creation and management
- Player search
- Profile with stats and membership badge

### 🔔 Notifications
- Push notifications via Firebase/APNs
- Tournament reminders, match updates
- Waitlist promotions, friend requests
- In-app notification center

### 🔒 Security & Compliance
- JWT authentication with refresh tokens
- Rate limiting (100 req/min general, 10/min auth)
- DSGVO: consent logging, data export, deletion
- Age verification (18+)
- Versioned legal documents

---

## ⭐ Membership Tiers

| Feature | Free | Plus (€7.99/mo) | Club (€14.99/mo) |
|---|:---:|:---:|:---:|
| Tournament participation | ✅ | ✅ | ✅ |
| Court finder | ✅ | ✅ | ✅ |
| Community features | ✅ | ✅ | ✅ |
| Early access | – | 24h | 48h |
| Fee discount | – | 10% | 20% |
| Waitlist priority | Standard | High | Highest |
| Extended stats | – | ✅ | ✅ |
| Exclusive events | – | – | ✅ |
| Profile badge | – | Purple | Gold |
| Priority support | – | – | ✅ |

### Waitlist Priority
When a tournament is full and a spot opens:
1. **Club** members are promoted first
2. **Plus** members are promoted second
3. **Free** users are promoted last
4. Within each tier, chronological order applies

---

## 🔐 Environment Variables

See `apps/backend/.env.example` for all available variables:

| Variable | Description | Required |
|---|---|---|
| `DB_HOST` | MariaDB host | ✅ |
| `DB_PORT` | MariaDB port (default: 3306) | ✅ |
| `DB_USER` | Database username | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `DB_NAME` | Database name | ✅ |
| `DB_TABLE_PREFIX` | Table prefix (default: turneo_) | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret | ✅ |
| `STRIPE_SECRET_KEY` | Stripe API key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | ✅ |
| `APPLE_SHARED_SECRET` | Apple IAP verification | For production |
| `FIREBASE_PROJECT_ID` | Firebase project for push | For push |
| `SMTP_HOST` | Email server | For emails |

---

## 🚢 Deployment

### Backend

```bash
cd apps/backend
npm run build
# Deploy dist/ to your Node.js hosting
# Set NODE_ENV=production
# Run migrations: npx knex migrate:latest
```

### Mobile App

```bash
cd apps/mobile

# Build for iOS (requires Apple Developer account)
npx eas build --platform ios

# Submit to App Store
npx eas submit --platform ios
```

---

## 👨‍💻 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 Legal

⚠️ **Important Legal Notices:**

- All legal documents (AGB, Datenschutzerklärung, Impressum) contain placeholder text marked with ⚠️ and **must be reviewed by a qualified attorney** before production use.
- Tax implications for prize money distribution, platform fees, and membership subscriptions must be reviewed by a tax advisor.
- Apple App Store Review Guidelines require subscriptions to use In-App Purchase (StoreKit 2). Tournament fees may use Stripe under the physical goods/events exemption (Guideline 3.1.3).

---

## 📞 Contact

- **Developer:** Lukas Gross
- **Email:** gross.lukas01@web.de
- **GitHub:** [@BigLisBigger](https://github.com/BigLisBigger)

---

<div align="center">

Built with ❤️ for the Padel community

**Turneo** – Dein Turnier. Dein Spiel. Deine Community.

</div>