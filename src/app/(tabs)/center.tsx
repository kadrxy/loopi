import { useIsFocused, useRouter } from 'expo-router';

import { useApp } from '@/data';
import { CameraScreen } from '@/features/camera/CameraScreen';
import { MapScreen } from '@/features/map/MapScreen';

/** Middle tab: the map by default, or the camera if chosen in Settings (the other opens by swiping right on Home). */
export default function Center() {
  const router = useRouter();
  const focused = useIsFocused();
  const centerTab = useApp((s) => s.settings.centerTab);
  if (centerTab === 'camera') {
    return <CameraScreen active={focused} onClose={() => router.navigate('/home')} onDone={() => router.navigate('/home')} />;
  }
  return <MapScreen />;
}
