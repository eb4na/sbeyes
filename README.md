# Dohyun Kim (sbeyes)

An iPhone app (Expo / React Native) for saying hard things one at a time.
The writer adds each thing as its own card, with an emotion and a 1–5 stress
level; it autosaves as they type. The reader (admin) sees every card arrive
**hidden**, taps to reveal it, and the reveal is remembered across devices.
Revealed cards update live and keep earlier versions.

Backend: Supabase project `sbeyes` (schema in `supabase/migrations/`).

## Use it in a browser

Every push to `main` publishes the web version to **https://eb4na.github.io/sbeyes/**
(`.github/workflows/web.yml`, served from the `gh-pages` branch).

## Run it on your iPhone (fastest)

```sh
npm install
npx expo start
```

Scan the QR code with the iPhone camera; it opens in the free **Expo Go** app.


## Who is who

Accounts are a username and password, with no email. `register()` in the
database creates the account (usernames are unique), and the app signs in
with the username. Behind the scenes Supabase needs an email, so each
username maps to a placeholder `@users.sbeyes.example` address that is never
mailed.

The reader is the user with `profiles.is_admin = true`; set it by username:

```sql
update public.profiles set is_admin = true where lower(name) = lower('<username>');
```

The reader sees everyone's things and can pick which person to read.

## Upload to TestFlight

You need an Apple Developer account. First set your own bundle ID in
`app.json` (`ios.bundleIdentifier`, currently `com.sbeyes.notes`).

**Option A — EAS (builds in Expo's cloud):**

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

It asks for your Apple ID, creates the certificates, builds, and uploads to
App Store Connect. The build shows up in TestFlight after Apple processes it.

**Option B — Xcode on your Mac:**

```sh
npx expo prebuild --platform ios
open ios/*.xcworkspace
```

In Xcode pick your team under Signing & Capabilities, choose
*Any iOS Device*, then **Product → Archive → Distribute App → TestFlight**.

## Android (install from a link)

No Play Store account needed. Build an installable APK in Expo's cloud:

```sh
npx eas-cli@latest build --platform android --profile preview
```

When it finishes, EAS shows a link and QR code. Open it on the Android phone,
download the APK and install it (allow "install unknown apps" when asked).

## Automatic TestFlight builds

Every push to `main` runs `.github/workflows/testflight.yml`: it typechecks,
then builds on EAS and submits to TestFlight. One-time setup on your Mac:

```sh
npx eas-cli@latest login
npx eas-cli@latest init          # links the Expo project (adds projectId to app.json) — commit it
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

The first build is interactive: sign in with your Apple ID and let EAS create
the certificates and an App Store Connect API key. After that, builds run
unattended.

Then create a token at https://expo.dev/settings/access-tokens and add it on
GitHub → repo **Settings → Secrets and variables → Actions** as `EXPO_TOKEN`.
Until the secret exists the workflow only typechecks.

## How it works

- Sign in with email + password, so the same account works on every device.
- Notes save ~1s after typing stops; leaving the editor saves immediately.
- The database snapshots a version at most every 30s per note while editing.
- Row-level security: writers only see their own notes; admins can read all.
  The publishable key in `.env` is safe to ship because of this.
- New Supabase projects require email confirmation on sign-up. Turn it off in
  Supabase → Authentication → Sign In / Providers → Email if you don't want it.

## Develop

```sh
npm run typecheck
npx expo start --web   # quick preview in a browser
```
