// Public entry point for screens. Swap createMockRepository for the Supabase repository later.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { useStore } from 'zustand';

import { createMockRepository } from './mock/mockRepository';
import { demoSeed } from './mock/seed';
import { createAppStore, type AppState } from './store';

export const appStore = createAppStore(createMockRepository(demoSeed), { storage: AsyncStorage });

/** Select one slice at a time; selectors must return stable values. */
export function useApp<T>(selector: (s: AppState) => T): T {
  return useStore(appStore, selector);
}

export { defaultSettings, type AppState, type Lang, type Settings } from './store';

/** Pull-to-refresh state for any list: pass to <RefreshControl refreshing onRefresh />. */
export function useRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await appStore.getState().refresh();
    setRefreshing(false);
  }, []);
  return { refreshing, onRefresh };
}

/** Stand-in photos for the camera's "sample photo" button (simulator / web without a camera). */
export { SAMPLE_PHOTOS, WALLPAPER } from './mock/photos';
export { POPULAR_PLACES } from './places';
