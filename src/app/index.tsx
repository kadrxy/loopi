import { Redirect } from 'expo-router';

import { useApp } from '@/data';

/** Entry: the sign-in hub first, then the launch screen the user chose (camera or home). */
export default function Index() {
  const onboarded = useApp((s) => s.onboarded);
  const launch = useApp((s) => s.settings.launch);
  if (!onboarded) return <Redirect href="/auth" />;
  return <Redirect href={launch === 'camera' ? '/camera' : '/home'} />;
}
