import { fireEvent, render, screen } from '@testing-library/react-native';

import { initI18n } from '@/i18n';

import { ReactionBar } from '../ReactionBar';

beforeAll(() => initI18n('en'));

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

describe('ReactionBar', () => {
  it('offers six named icon reactions and reports the picked kind', async () => {
    const onPick = jest.fn();
    await render(<ReactionBar selected="heart" onPick={onPick} />);
    const names = ['Love', 'Fire', 'Haha', 'Wow', 'Sad', 'Bravo'];
    for (const name of names) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Love' }).props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(screen.getByRole('button', { name: 'Fire' }));
    expect(onPick).toHaveBeenCalledWith('fire');
  });

  it('draws no emoji characters (icons render the same on every phone)', async () => {
    await render(<ReactionBar onPick={() => {}} />);
    const text = screen.queryAllByText(EMOJI);
    expect(text).toHaveLength(0);
  });
});
