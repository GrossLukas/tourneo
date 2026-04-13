import { useColorScheme as useRNColorScheme } from 'react-native';
import { getColors, type Colors } from '../theme/colors';

export function useAppColors(): Colors {
  const scheme = useRNColorScheme() ?? 'light';
  return getColors(scheme);
}

export function useIsDarkMode(): boolean {
  const scheme = useRNColorScheme() ?? 'light';
  return scheme === 'dark';
}