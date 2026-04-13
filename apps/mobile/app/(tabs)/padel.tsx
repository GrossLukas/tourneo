import { Redirect } from 'expo-router';

// Legacy tab – redirects to the unified "Spielen" tab
export default function PadelRedirect() {
  return <Redirect href="/(tabs)/spielen" />;
}