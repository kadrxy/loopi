import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useApp } from '@/data';
import { ProfileView } from '@/features/profile/ProfileView';
import { useT } from '@/i18n';
import { Button, colors, IconButton, Sheet } from '@/ui';
import { useTabBarSpace } from '@/ui/GlassTabBar';

export default function MyProfile() {
  const t = useT();
  const router = useRouter();
  const meId = useApp((s) => s.meId);
  const bottomSpace = useTabBarSpace();
  const [soon, setSoon] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileView
        userId={meId}
        bottomSpace={bottomSpace}
        topLeft={<IconButton name="share" size="sm" dark label={t('share_profile')} onPress={() => setSoon(true)} />}
        topRight={
          <>
            <IconButton name="device" size="sm" dark label={t('widget_preview')} onPress={() => router.push('/widget')} />
            <IconButton name="gear" size="sm" dark label={t('settings')} onPress={() => router.push('/settings')} />
          </>
        }
        actions={
          <>
            <Button title={t('edit_profile')} icon="pencil" size="md" onPress={() => router.push('/profile-edit')} style={{ flex: 1 }} />
            <IconButton name="friends" label={t('tab_friends')} onPress={() => router.navigate('/friends')} />
          </>
        }
      />
      <Sheet visible={soon} title={t('not_yet')} onClose={() => setSoon(false)} />
    </View>
  );
}
