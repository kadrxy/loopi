import { Tabs } from 'expo-router';

import { useApp } from '@/data';
import { useT } from '@/i18n';
import { colors } from '@/ui';
import { GlassTabBar } from '@/ui/GlassTabBar';

export default function TabsLayout() {
  const t = useT();
  const centerTab = useApp((s) => s.settings.centerTab);
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
      <Tabs.Screen name="home" options={{ title: t('tab_home') }} />
      <Tabs.Screen name="friends" options={{ title: t('tab_friends') }} />
      <Tabs.Screen name="center" options={{ title: t(centerTab === 'map' ? 'tab_map' : 'tab_create') }} />
      <Tabs.Screen name="inbox" options={{ title: t('tab_inbox') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab_profile') }} />
    </Tabs>
  );
}
