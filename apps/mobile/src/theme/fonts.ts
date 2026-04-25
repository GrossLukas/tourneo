/**
 * Night Court font loading.  Wraps expo-font's `useFonts` and pulls every
 * weight referenced in `typography.ts`.  The hook returns `loaded` as soon
 * as all three families are ready; while loading the app keeps rendering
 * with the system font so there is never a blank screen.
 */
import { useFonts } from 'expo-font';
import {
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

export function useNightCourtFonts() {
  const [loaded] = useFonts({
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });
  return loaded;
}
