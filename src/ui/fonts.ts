import {
  BeVietnamPro_300Light,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { PlayfairDisplay_500Medium_Italic } from '@expo-google-fonts/playfair-display';

/** Loads every face the design system uses. Returns true once ready. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    BeVietnamPro_300Light,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
    PlayfairDisplay_500Medium_Italic,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  // On a font error, render with system fonts rather than a blank screen.
  return loaded || !!error;
}
