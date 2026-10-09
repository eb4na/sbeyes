# Notes (sbeyes)

An iPhone app (Expo / React Native) where people write notes that autosave and
sync across devices. Admins get an **All notes** screen showing every writer's
notes live, with saved versions so you can see how each note progressed.

Backend: Supabase project `sbeyes` (schema in `supabase/migrations/`).

## Run it on your iPhone (fastest)

```sh
npm install
npx expo start
```

Scan the QR code with the iPhone camera; it opens in the free **Expo Go** app.

## Make yourself the admin

1. Create an account in the app.
2. In the Supabase dashboard → SQL editor, run:

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```

3. Sign out and back in. An **All notes** button appears top-right.

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
