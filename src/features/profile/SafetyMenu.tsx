import { useState } from 'react';

import { appStore, useApp } from '@/data';
import { useT } from '@/i18n';
import { Sheet } from '@/ui';

const REPORT_KEYS = ['report_harassment', 'report_nudity', 'report_spam', 'report_minor', 'report_other'] as const;

/**
 * The "…" menu on a person (profile, chat): block / unblock and report. Blocking asks first and
 * explains what happens. Render `sheets` once in the screen and call `open()` from the button.
 */
export function useSafetyMenu(userId: string, onBlocked?: () => void) {
  const t = useT();
  const meId = useApp((s) => s.meId);
  const blocked = useApp((s) => !!s.graph.blocks?.some((b) => b.from === s.meId && b.to === userId));
  const name = useApp((s) => s.graph.users[userId]?.name ?? '');
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [report, setReport] = useState(false);
  const [thanks, setThanks] = useState(false);

  const sheets =
    userId === meId ? null : (
      <>
        <Sheet
          visible={menu}
          title={name}
          options={[
            blocked
              ? { label: t('unblock'), icon: 'lock', onPress: () => appStore.getState().toggleBlock(userId) }
              : { label: t('block'), icon: 'lock', onPress: () => setConfirm(true) },
            { label: t('report'), icon: 'flag', onPress: () => setReport(true) },
          ]}
          onClose={() => setMenu(false)}
        />
        <Sheet
          visible={confirm}
          title={t('block_title', { name })}
          body={t('block_body')}
          options={[
            {
              label: t('block'),
              icon: 'lock',
              onPress: async () => {
                await appStore.getState().toggleBlock(userId);
                onBlocked?.();
              },
            },
          ]}
          onClose={() => setConfirm(false)}
        />
        <Sheet
          visible={report}
          title={t('report_title')}
          options={REPORT_KEYS.map((k) => ({ label: t(k), onPress: () => setThanks(true) }))}
          onClose={() => setReport(false)}
        />
        <Sheet visible={thanks} title={t('report_thanks')} onClose={() => setThanks(false)} />
      </>
    );

  return { open: () => setMenu(true), blocked, sheets };
}
