// Shared, animation-thread values that let one screen drive chrome owned by another.
import { makeMutable } from 'react-native-reanimated';

/** Home pager position: 0 = left page (camera or map), 1 = Following, 2 = Discover. The tab bar hides below 1. */
export const homeProgress = makeMutable(1);
