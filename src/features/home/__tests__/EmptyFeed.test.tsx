import { fireEvent, render, screen } from '@testing-library/react-native';

import { initI18n } from '@/i18n';

import { EmptyFeed } from '../EmptyFeed';

beforeAll(() => initI18n('en'));

describe('EmptyFeed', () => {
  it('tells a new user the feed is empty and offers Discover', async () => {
    const onDiscover = jest.fn();
    await render(<EmptyFeed onDiscover={onDiscover} />);
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Browse Discover' }));
    expect(onDiscover).toHaveBeenCalledTimes(1);
  });
});
