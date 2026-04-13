import { Redirect } from 'expo-router';

// Legacy tab – redirects to the new "Profil" tab
export default function ProfileRedirect() {
  return <Redirect href="/(tabs)/profil" />;
}