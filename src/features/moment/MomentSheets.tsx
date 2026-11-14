import { useState } from 'react';

import { appStore, useApp } from '@/data';
import type { Moment } from '@/domain/types';

import { CommentsSheet } from './CommentsSheet';
import { SendSheet } from './SendSheet';

/**
 * Comments and "send to" sheets for any list of moment cards (Home, a person's posts), opened in
 * place like Instagram instead of navigating away. Render `sheets` once in the screen.
 */
export function useMomentSheets() {
  const graph = useApp((s) => s.graph);
  // The last opened moment stays mounted while its sheet slides away; `open` drives visibility.
  const [commentsId, setCommentsId] = useState<string>();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [sendId, setSendId] = useState<string>();
  const [sendOpen, setSendOpen] = useState(false);
  // Read the live moment so new comments and likes show while the sheet is open.
  const commentsMoment = useApp((s) => (commentsId ? s.moments.find((m) => m.id === commentsId) : undefined));
  const sendMoment = useApp((s) => (sendId ? s.moments.find((m) => m.id === sendId) : undefined));

  const sheets = (
    <>
      {commentsMoment && (
        <CommentsSheet
          visible={commentsOpen}
          moment={commentsMoment}
          graph={graph}
          onClose={() => setCommentsOpen(false)}
          onComment={(body) => appStore.getState().comment(commentsMoment.id, body)}
        />
      )}
      <SendSheet moment={sendMoment} visible={sendOpen} onClose={() => setSendOpen(false)} />
    </>
  );

  return {
    openComments: (m: Moment) => {
      setCommentsId(m.id);
      setCommentsOpen(true);
    },
    openSend: (m: Moment) => {
      setSendId(m.id);
      setSendOpen(true);
    },
    sheets,
  };
}
