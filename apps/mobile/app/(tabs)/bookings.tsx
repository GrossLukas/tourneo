import { Redirect } from 'expo-router';

// Legacy tab – redirects to the "Turniere" tab
export default function BookingsRedirect() {
  return <Redirect href="/(tabs)/turniere" />;
}