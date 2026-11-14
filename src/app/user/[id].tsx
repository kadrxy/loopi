import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { appStore, useApp } from '@/data';
import { canMessage } from '@/domain/rules';
import { FollowButton, ProfileView } from '@/features/profile/ProfileView';
import { useSafetyMenu } from '@/features/profile/SafetyMenu';
import { useT } from '@/i18n';
import { Button, colors, IconButton } from '@/ui';

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const router = useRouter();
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const safety = useSafetyMenu(id);
  const dmOk = canMessage(graph, meId, id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileView
        userId={id}
        bottomSpace={40}
        topRight={<IconButton name="dots" size="sm" dark label={t('more')} onPress={safety.open} />}
        actions={
          safety.blocked ? (
            <Button title={t('unblock')} kind="glass" icon="lock" size="md" onPress={() => appStore.getState().toggleBlock(id)} style={{ flex: 1 }} />
          ) : (
            <>
              <FollowButton userId={id} onPress={() => appStore.getState().toggleFollow(id)} />
              <Button
                title={t('message')}
                kind="glass"
                icon={dmOk ? 'chat' : 'lock'}
                size="md"
                disabled={!dmOk}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id } })}
                style={{ flex: 1 }}
              />
            </>
          )
        }
      />
      {safety.sheets}
    </View>
  );
}
