import { useT } from '@/i18n';
import { Button, EmptyState } from '@/ui';

export function EmptyFeed({ onDiscover }: { onDiscover: () => void }) {
  const t = useT();
  return (
    <EmptyState
      icon="images"
      title={t('feed_empty_title')}
      body={t('feed_empty_body')}
      action={<Button title={t('go_discover')} kind="glass" size="md" icon="sparkle" onPress={onDiscover} />}
    />
  );
}
