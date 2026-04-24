# Handoff: Tourneo — Night Court Mobile Redesign

## Overview

High-fidelity redesign of the Tourneo mobile app (padel/sport tournament platform). Six core screens, all built on the existing "Night Court" dark-first design system already defined in `apps/mobile/src/theme/`. The prototype demonstrates the visual language, component system, interaction patterns, and motion design the developer should recreate natively.

**Target codebase:** `BigLisBigger/turneo` — specifically `apps/mobile/` which is an **Expo + React Native + TypeScript** app using `expo-router`, Zustand, `react-i18next`, and a `StyleSheet`-based theming system.

## About the Design Files

The files in `prototype/` are **design references created in HTML** — React-via-Babel inline JSX, rendered in the browser. They are NOT production code to copy directly.

- `<div>` / `<button>` / `<span>` → must become React Native `<View>` / `<Pressable>` / `<Text>`
- Inline JS style objects (camelCase) → should become `StyleSheet.create({...})` blocks in each screen file
- CSS `background: linear-gradient(...)` → use `expo-linear-gradient`
- CSS `backdropFilter: blur(...)` → use `expo-blur` `<BlurView>`
- SVG sparkline/bracket → use `react-native-svg` (already common in Expo projects; add if missing)

The task is to **recreate these designs inside the existing Expo app** at `apps/mobile/`, following the patterns already present in `apps/mobile/app/(tabs)/home.tsx`, `turniere.tsx`, `profil.tsx`, etc. Reuse the existing `useTheme()` hook, `colors.ts` tokens, `spacing.ts` scale, and i18n keys.

## Fidelity

**High-fidelity (hifi).** Pixel-perfect mocks with final colors, typography, spacing, gradients, animations, and interactions. Recreate faithfully.

---

## Design Tokens

All tokens are lifted from or aligned with the existing `apps/mobile/src/theme/colors.ts`. Prefer that file as the source of truth; this table is for reference and for any tokens the prototype added.

### Colors (hex / rgba)

```
# Backgrounds (dark-first)
bg              #0A0A14        # app background
bgElev          #0D0D1A        # elevated surface
bgCard          #111127        # cards, tiles
bgInput         #16162A        # text inputs
bgHover         #1A1A33
bgPressed       #1F1F3D

# Primary (Electric Indigo)
primary         #6366F1
primaryDark     #4F46E5
primaryLight    #818CF8
primaryBg       rgba(99,102,241,0.12)
primaryGlow     rgba(99,102,241,0.35)    # used for shadow/glow

# Accents
gold            #F59E0B   # prize money
goldLight       #FCD34D
goldBg          rgba(245,158,11,0.12)
coral           #FF4757   # LIVE indicator, urgent states
coralBg         rgba(255,71,87,0.12)

# Sport
padel           #10B981
fifa            #6366F1

# Text
textPrimary     #FFFFFF
textSecondary   rgba(255,255,255,0.60)
textTertiary    rgba(255,255,255,0.35)
textDisabled    rgba(255,255,255,0.20)

# Strokes
border          rgba(255,255,255,0.08)
borderStrong    rgba(255,255,255,0.15)
divider         rgba(255,255,255,0.06)

# Membership tiers
tierFree        #888780
tierPlus        #818CF8
tierClub        #F59E0B
```

### Typography

Three families. Load via `expo-font` (all three are on Google Fonts):

```
Display:   Outfit          (weights 600, 700, 800)  - headings, numbers
UI:        Inter           (weights 500, 600, 700)  - body, labels
Mono:      JetBrains Mono  (weights 500, 700)       - scores, ELO, numeric
```

### Type scale (actual sizes used)

| Role               | Family  | Size | Weight | Letter-spacing |
|--------------------|---------|------|--------|----------------|
| H1 / Hero          | Outfit  | 28   | 800    | -0.7           |
| Screen title       | Outfit  | 22   | 800    | -0.5           |
| Card title         | Outfit  | 20   | 700    | -0.4           |
| Section header     | Outfit  | 19   | 700    | -0.4           |
| List item title    | Outfit  | 15   | 600    | -0.2           |
| Big numeric (ELO)  | Mono    | 38   | 700    | -1.5           |
| Score digit        | Mono    | 17   | 700    |  0             |
| Body               | Inter   | 13   | 500    |  0             |
| Meta / caption     | Inter   | 12   | 500    |  0.2           |
| Micro / label      | Inter   | 10–11| 600    |  0.5–1 (uppercase) |

### Spacing scale

`4 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28`  — matches `apps/mobile/src/theme/spacing.ts`.

Standard screen horizontal padding: **20**. Card inner padding: **14–18**.

### Radius

`6` (chip), `10` (small), `12` (medium), `14` (tile), `18` (card), `999` (pill / avatar).

### Shadows & glow

Shadows on dark BG don't read — **use colored glows** instead:

```js
shadowColor: '#6366F1',
shadowOpacity: 0.35,
shadowRadius: 24,
shadowOffset: { width: 0, height: 10 },
elevation: 12,   // Android
```

---

## Screens

Six screens shown side-by-side on the design canvas. Each is an iPhone-sized artboard (**402 × 874**, iPhone 15 Pro logical viewport). All share the bottom tab bar and top bar patterns.

Map to your existing routes:

| Prototype file  | Your file (approx.)                     |
|-----------------|-----------------------------------------|
| `home.jsx`      | `apps/mobile/app/(tabs)/home.tsx`       |
| `turniere.jsx`  | `apps/mobile/app/(tabs)/turniere.tsx`   |
| `event.jsx`     | `apps/mobile/app/event/[id].tsx` (new)  |
| `live.jsx`      | `apps/mobile/app/live/[id].tsx` + RegisterSheet |
| `profile.jsx`   | `apps/mobile/app/(tabs)/profil.tsx`     |
| `profile.jsx` (Membership sub-screen) | `apps/mobile/app/settings/membership.tsx` |

### Shared primitives (build these first)

Located in `ui.jsx`. Port to `apps/mobile/src/components/`:

- **`<Card>`** — `bgCard`, 18px radius, 1px `border` stroke. Optional `glow` prop = indigo `shadow`.
- **`<Pill>`** — uppercase 10px text, 600 weight, 6px vertical / 10px horizontal, radius 999. Optional leading dot (4×4 coral, pulsing if LIVE).
- **`<LivePulse>`** — coral dot (7×7) with an outer ring that scales/fades on a 1.2s loop + "LIVE" label. (Use `Animated.loop` with a scale 1→2 + opacity 0.5→0 ring.)
- **`<Avatar name hue size ring>`** — gradient circle (two stops at hue, hue−20), initials centered in Outfit 600. `ring` prop adds a 2px indigo ring.
- **`<Button variant="primary|secondary|ghost" size="md|lg" icon full>`**
  - Primary = gradient `linear-gradient(135deg, primary, primaryDark)` + indigo glow
  - Secondary = `bgCard` + `borderStrong`
  - Heights: md=44, lg=54. Radius 14.
  - Pressed state: `transform: scale(0.97)` via `Animated.spring`
- **`<Section title action actionLabel="Alle">`** — 19px Outfit 700 title, right-aligned action button "Alle →" in `primaryLight`. Title nowrap+ellipsis, action `flex-shrink: 0`.
- **`<TopBar greeting name badge>`** — 62px top padding for notch, 42px avatar + 2-line greeting/name (both nowrap+ellipsis), bell button right with coral dot if `badge > 0`.
- **`<BottomTabs active onChange>`** — 88px tall, bottom 26 safe-area, `rgba(10,10,20,0.75)` + `backdropFilter: blur(24px)`. Five tabs; middle one is a floating 54px indigo gradient FAB that sits −18 above the bar ("Matchmaking").
- **`<Icon name size color strokeWidth>`** — stroke-based, 24×24 viewBox. Names used: `home, trophy, users, user, play, bolt, bell, arrowR, arrowU, chevron, chevronL, calendar, pin, crown, flame, medal, sparkle, shield, plus, check, close`. Use `react-native-svg` `<Svg>`+`<Path>`.

### 1. Home (`home.jsx`)

**Purpose:** Morning dashboard. Sees ELO, live matches, next tournament, upcoming fixtures, quick actions.

**Layout (top→bottom):**
1. **TopBar** — "Guten Morgen, {name}" + avatar + bell w/ badge (62px top padding)
2. **ELO Card** (`bgCard` → indigo-tinted gradient):
   - Row: "DEINE WERTUNG" 11px/600/uppercase on left; gold "Rang A" pill (rounded 10, gold/8% bg, gold border) on right
   - Big ELO number: `Mono 38/700, tracking -1.5`, next to green "↑ +24" delta
   - **Sparkline SVG**: 310×50, 12 data points, indigo line + linear-gradient fill fading to transparent. Final point = indigo dot with animated pulsing ring (r 4→10, opacity 0.4→0, 2s loop).
   - Bottom stats row (border-top divider, 12px pad): Siege · Niederlagen · Winrate · Streak 🔥. Mono 17/700 for numbers, Inter 10.5/500 uppercase labels.
3. **Section "Live jetzt"** (shown only if live matches exist)
   - Horizontal-scroll row of `<LiveMatchCard width=280>`:
     - Header: LivePulse + "HALBFINALE · COURT 3" (12px secondary)
     - Two `<MatchRow>`: server dot (4×4 coral if serving) + name (ellipsis) + 3 mono score cells (active player brighter)
     - Footer: "Satz 3 · aktuell" + coral mono "40-30"
4. **Section "Nächstes Turnier"** — Hero card:
   - 160px tall image region with **animated gradient placeholder** (two radial-gradients — indigo top-left, gold bottom-right — over dark base). Faint 0.22-opacity padel court SVG diagram overlay.
   - Top-left: two pills ("NÄCHSTES TURNIER" indigo bg, "MEMBER −10%" gold bg)
   - Bottom-right: "GARANTIERT" mono 10 label + prize `3.500€` gold 24/800
   - Body: Title Outfit 20/700, subtitle Inter 13/textS, meta row with 📅 icon+date and 📍 icon+venue
   - **Capacity bar**: 6px tall, 999 radius, `bgInput` track + indigo gradient fill (switches to **coral gradient when >85%** full). Label "Plätze" + "28/32" mono 11.5/700
   - CTA row: price block (Outfit 20/700, strikethrough original Inter 12) + `<Button>` Anmelden
5. **Section "Deine Termine"** — List of upcoming fixtures:
   - Each row: 54×54 date tile (indigo tinted bg, primaryLight border, big day number + "MAI" label) + event name + "⏱ 10:00 · Partner: M. Kramer" + chevron
6. **Section "Schnellzugriff"** — 2×2 grid of `<QuickTile>`:
   - 94px min-height tile, each with a 34×34 colored-gradient square containing an icon. Gradients by `hue`: Matchmaking (260/indigo), Team (140/green), Courts (200/teal), Leaderboard (40/gold).

### 2. Turniere (`turniere.jsx`)

**Purpose:** Tournament discovery.

**Layout:**
1. Screen title "Turniere" (Outfit 22/800) + search icon button
2. Search field (bgInput, 14 radius, 48 height) with magnifier icon
3. Horizontal filter chips: `Alle · Beginner · Intermediate · Advanced · Pro` — active chip = indigo bg, inactive = `bgCard` + border. 12.5px Inter 600 text.
4. List of `<TournamentCard>`:
   - 14px padding, 18 radius, row layout
   - Left: 64×64 **date tile** (indigo gradient, big day Outfit 28/800, month text, uppercase) with optional status tag overlaid (`FEATURED` indigo, `NEW` green, `CLUB+` gold)
   - Middle: Title 16/700, city pill, level pill, fee/prize row (gold prize)
   - Bottom: mini capacity bar (4px tall) + "28/32" count

### 3. Event Detail (`event.jsx`)

**Purpose:** Full event spec before registering.

**Layout:**
1. **Hero image** (280px tall): same gradient+court-diagram treatment as home hero, taller. Top overlay: back chevron button (40×40 glass-blur circle) + bookmark/share icons. Bottom-left overlay: event title Outfit 26/800 + meta.
2. Body (scrolling, padding 20):
   - Meta row with icons: Date, Venue, Level, Spots
   - **Prize breakdown** — 3 `<PrizeRow>` cards side by side (flex 1 each): 1st gold `#F59E0B`, 2nd silver `#94A3B8`, 3rd bronze `#B45309`. Each shows `#1` / `#2` / `#3` pill + amount (`1.750€` etc.)
   - **Bracket SVG** — stylized 4-QF → 2-SF → 1-F tree, muted indigo lines. Static preview.
   - Rules, format, partner info sections
3. **Sticky footer** (absolute bottom, 14px top / 28px bottom pad, gradient fade to bg):
   - Price block (fixed width, `flex-shrink: 0`): "PLUS-PREIS" mini label + "40,50€" Outfit 22/800 + strikethrough "45€"
   - `<Button full size="lg">` Anmelden, taking remaining space

### 4. Live Match (`live.jsx`)

**Purpose:** Watch a live match.

**Layout:**
1. Back + "Live Match" title + viewer count badge
2. Venue / round / court pill row
3. **Big scorecard** — two `<LiveRow>` stacked:
   - Each row: gradient avatar (by hue) + name (Outfit 18/700) + 3 set-score mono cells (32/700) + current game score (coral mono 20/700)
   - Active server shown by 8×8 coral dot left of name, row bg tinted indigo 5%
4. Micro-stats strip: Aces, Winners, UE, Break pts (centered columns)
5. Secondary actions: 📺 Watch, 📣 Cheer

### 5. Registration Bottom Sheet (in `live.jsx`)

**3-step modal** — slides up from bottom (0.35s ease-out, 80% screen height, top-radius 28):

- **Step 0: Type** — "Solo" vs "Duo" selector cards (tap to pick, selected = indigo border + primaryBg fill)
- **Step 1: Pay** — summary lines (Gebühr, Plus Rabatt, Gesamt bold) + two Apple-Pay-style buttons (black "Apple Pay" / indigo gradient "Karte"). Primary CTA "40,50 € bezahlen" full-width, lg
- **Step 2: Done** — animated green check circle (scale-in spring), "Anmeldung bestätigt", ticket summary card, "Fertig" button

### 6. Profile (`profile.jsx`)

**Purpose:** Identity + achievements + friends + membership entry.

**Layout:**
1. Big header `<Card>`: 96×96 avatar (gradient hue 250, ring), name Outfit 28/800, `@handle` mono textS, **TOURNEO PLUS** badge pill (primaryBg, sparkle icon, primaryLight text)
2. Stats grid 2×2: ELO · Rang · Wins · Winrate (`<StatBig>` cards, centered content)
3. **Achievements shelf** — horizontal scroll, 64×64 colored-gradient circles with icon + label below
4. **Freunde** — list of 5 friends with avatar + name + "1920 ELO" mono + green online dot if `online: true`
5. Settings-style list: Mitgliedschaft · Benachrichtigungen · Sprache · Datenschutz · Abmelden (row icon + label + chevron)

### 7. Membership (sub-screen in `profile.jsx`)

**Purpose:** Compare + upgrade.

**Layout:**
1. Back + "Mitgliedschaft" title
2. **Tier toggle** — 3 segmented buttons: `Free · Plus · Club`. Selected = indigo bg on Plus, gold gradient bg on Club.
3. **Hero tier card** — swaps content based on selection:
   - Big icon circle (64×64 gradient, crown/sparkle/user by tier)
   - "Tourneo Plus" Outfit 28/800, price "4,99€ / Monat" mono
   - Perks list with check icons (different list per tier)
4. `<Button full size="lg">` "Upgrade auf Plus" (indigo) or "Club beitreten" (gold gradient)

---

## Interactions & Animations

All timings snappy. Default easing `cubic-bezier(0.2, 0.8, 0.2, 1)` (iOS feel).

| Element | Behavior | Timing |
|---|---|---|
| Tab bar FAB | Scale 1 → 0.94 on press-in, spring back | 120ms in, spring out |
| `<Button>` | Scale 1 → 0.97 on press | 100ms |
| `<Card onClick>` | Opacity 1 → 0.85 on press | 80ms |
| Sparkline last-point ring | r 4↔10, opacity 0.4↔0 loop | 2000ms, infinite |
| `<LivePulse>` outer ring | scale 1→2, opacity 0.5→0 | 1200ms loop |
| Registration sheet enter | translateY 100% → 0 | 350ms ease-out |
| Registration sheet backdrop | opacity 0 → 1 | 250ms |
| Step transitions in sheet | Cross-fade 200ms |
| Capacity bar fill | Width animates on mount | 600ms ease-out |
| Screen→event navigation | Shared-element-ish: fade + scale 0.96→1 | 280ms |
| Accent swap (Tweaks) | Instant token swap, primitives re-render |

**Haptics:** on FAB tap, on Button primary, on success check (`Haptics.impactAsync` — medium / light / success).

---

## State Management

Continue using the existing Zustand stores in `apps/mobile/src/store/`. For the new screens:

- **Home**: read `user`, `eloHistory`, `liveMatches`, `heroEvent`, `upcoming` from stores. Replace the hardcoded `data.js` with API calls to existing endpoints in `apps/mobile/src/api/`.
- **Tournament list**: search + filter are local component state; the list itself comes from an API query.
- **Event detail**: fetched by route param `id`. Register opens the sheet.
- **Registration sheet**: local `step` state (0/1/2), `type` state (solo|duo). On "Pay" trigger, call existing payment endpoint; on success advance to step 2.
- **Live match**: subscribe to live score (websocket if available, polling otherwise).
- **Membership**: selected tier is local state; purchase goes through your existing in-app-purchase flow.

---

## Copy (German, as used in prototype)

Reuse exact strings — or wire to your existing `apps/mobile/src/i18n/` keys. Key strings:

- Greetings: "Guten Morgen", "Guten Abend"
- Section titles: "Live jetzt", "Nächstes Turnier", "Deine Termine", "Schnellzugriff"
- Stats: "Deine Wertung", "Siege", "Niederlagen", "Winrate", "Streak"
- Tournaments: "Turniere", "Alle", "Beginner", "Intermediate", "Advanced", "Pro", "Plätze"
- Event: "Plus-Preis", "Anmelden", "Gebühr", "Mitglied −10%"
- Registration: "Solo", "Duo", "Apple Pay", "Karte", "Anmeldung bestätigt"
- Profile tabs: "Mitgliedschaft", "Benachrichtigungen", "Sprache", "Datenschutz", "Abmelden"
- Tiers: "Tourneo Free", "Tourneo Plus", "Tourneo Club"

---

## Assets

No external images or illustrations — the hero image areas are **gradient placeholders** with subtle court-diagram SVG overlays. When real event imagery is available, render it behind the same gradient scrim (gradient acts as both placeholder and image overlay for legibility).

Icons are stroke-based SVGs in `icons.jsx`. Port to `react-native-svg` equivalents or use `lucide-react-native` (the icon set is very close to Lucide — names match in most cases: `home, trophy, users, bell, chevron-right`, etc.).

Fonts: load `Outfit`, `Inter`, `JetBrains Mono` via `expo-font`.

---

## Files in This Bundle

```
prototype/
├── Turneo.html           # entry point — open in a browser to view all screens
├── tokens.js             # design tokens (mirrors apps/mobile/src/theme/colors.ts)
├── data.js               # sample data
├── ui.jsx                # shared primitives (Card, Button, Pill, TopBar, BottomTabs, …)
├── icons.jsx             # stroke-based icon set
├── home.jsx              # Home screen
├── turniere.jsx          # Tournament discovery
├── event.jsx             # Event detail + prize + bracket
├── live.jsx              # Live match + Registration sheet
├── profile.jsx           # Profile + Membership
├── ios-frame.jsx         # iPhone bezel (design-time only)
├── design-canvas.jsx     # Pan/zoom canvas host (design-time only)
└── tweaks-panel.jsx      # In-design tweak controls (design-time only)
```

**Ignore** `ios-frame.jsx`, `design-canvas.jsx`, `tweaks-panel.jsx` — they are browser-only scaffolding for viewing the mocks side-by-side. Nothing in them should make it into the Expo app.

**To view:** open `prototype/Turneo.html` in any modern browser. Pan with drag, zoom with scroll. Click the "Tweaks" toolbar toggle to swap accent colors (Indigo / Violet / Teal / Coral).

---

## Suggested Implementation Order

1. **Tokens + typography** — update `apps/mobile/src/theme/colors.ts` with any missing tokens, load the 3 Google Fonts via `expo-font`. Create `apps/mobile/src/theme/typography.ts` with the role→style map above.
2. **Shared primitives** — `Card`, `Pill`, `Button`, `Avatar`, `Section`, `LivePulse`, `TopBar`, `BottomTabs` in `apps/mobile/src/components/`.
3. **Home screen** — port `home.jsx` into `home.tsx`. Wire to existing data.
4. **Turniere** — straightforward list.
5. **Event detail** — new route `app/event/[id].tsx`.
6. **Registration sheet** — reusable bottom-sheet component, 3 steps.
7. **Live match** — new route.
8. **Profile + Membership** — update existing `profil.tsx`, add `settings/membership.tsx`.
9. **Polish pass** — animations, haptics, accessibility labels.
