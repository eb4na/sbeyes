import { Redirect } from 'expo-router';

// Google sign-in redirects to sbeyes://auth-callback. The browser sheet in
// signInWithGoogle() normally captures it, but if the OS opens the app via the
// link instead, send the user home rather than to a "not found" screen.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
