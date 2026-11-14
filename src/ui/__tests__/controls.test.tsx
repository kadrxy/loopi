import { fireEvent, render, screen } from '@testing-library/react-native';

import { Segmented } from '../Segmented';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('exposes its checked state and flips on press', async () => {
    const onChange = jest.fn();
    await render(<Toggle value={false} onChange={onChange} label="Private profile" />);
    const sw = screen.getByRole('switch', { name: 'Private profile' });
    expect(sw.props.accessibilityState).toMatchObject({ checked: false });
    await fireEvent.press(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Segmented', () => {
  it('marks the selected tab and reports the pressed one', async () => {
    const onChange = jest.fn();
    await render(
      <Segmented
        options={[
          { key: 'feed', label: 'Feed' },
          { key: 'discover', label: 'Discover' },
        ]}
        value="feed"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Feed' }).props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByRole('tab', { name: 'Discover' }));
    expect(onChange).toHaveBeenCalledWith('discover');
  });
});
