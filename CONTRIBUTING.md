# Contributing to Tourneo

Thanks for helping! Tourneo is free software under the GNU AGPL v3.0.

## How to contribute

1. Open an issue or pick one, so work is not done twice.
2. Fork, create a branch (`feature/…` or `fix/…`), keep changes focused.
3. Run `npm run ci:verify` before opening a pull request – it is what the CI runs.
4. Write tests for new logic (backend: `apps/backend/src/__tests__`, app: `apps/mobile/src/__tests__`).
5. Visible app texts are German first (with real umlauts), English second (`apps/mobile/src/i18n`).

## Licensing of contributions

By submitting a contribution you confirm that you wrote it (or have the right to submit it) and agree that it is
licensed under the GNU AGPL v3.0. You additionally permit the maintainer to distribute your contribution as part of
Tourneo through app stores (Apple App Store, Google Play) under their terms. This is needed because app store terms
are not compatible with the AGPL for code the maintainer does not own.

## Data

The hall finder uses OpenStreetMap data (© OpenStreetMap contributors, ODbL). Keep the attribution visible and
respect the usage policies of the public Overpass and Nominatim services (caching, identifying User-Agent, rate limits).
