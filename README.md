# Dohyun Kim (sbeyes)

An iPhone app (Expo / React Native) for saying hard things one at a time.
The writer adds each thing as its own card, with an emotion and a 1–5 stress
level; it autosaves as they type. The reader (admin) sees every card arrive
**hidden**, taps to reveal it, and the reveal is remembered across devices.
Revealed cards update live and keep earlier versions.

Backend: Supabase project `sbeyes` (schema in `supabase/migrations/`).

## Run it on your iPhone (fastest)

```sh
npm install
npx expo start
```

Scan the QR code with the iPhone camera; it opens in the free **Expo Go** app.

## Turn on Google sign-in (one-time)

The app's **Continue with Google** button needs Google enabled in Supabase:

1. **Google Cloud Console** → APIs & Services → Credentials → *Create
   credentials → OAuth client ID* → type **Web application**.
   Under *Authorized redirect URIs* add:
   `https://dnxyasgufbaztleapunj.supabase.co/auth/v1/callback`
   (If asked, set up the OAuth consent screen first; "External" is fine.)
2. **Supabase** → Authentication → Sign In / Providers → **Google**: turn it on
   and paste the Client ID and Client Secret.
3. **Supabase** → Authentication → URL Configuration → *Redirect URLs*, add:
   - `sbeyes://**` (TestFlight / real builds)
   - `exp://**` (Expo Go and the Simulator while developing)
   - `http://localhost:8081` (web preview)

## Make yourself the admin

1. Create an account in the app.
2. In the Supabase dashboard → SQL editor, run:

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```

3. Sign out and back in. You'll land on **Things to read**.

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
