import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** Take a photo (falls back to the library where there is no camera, e.g. web) or pick one. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | undefined> {
  if (source === 'camera' && Platform.OS !== 'web') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.granted) {
      const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      return shot.canceled ? undefined : shot.assets[0]?.uri;
    }
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  return res.canceled ? undefined : res.assets[0]?.uri;
}
