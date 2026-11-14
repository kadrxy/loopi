import { useRouter } from 'expo-router';

import { CameraScreen } from '@/features/camera/CameraScreen';

/** Full-screen camera opened from anywhere (story ring "+", empty states). */
export default function CameraRoute() {
  const router = useRouter();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  return <CameraScreen onClose={close} onDone={close} />;
}
