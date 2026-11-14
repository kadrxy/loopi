# LOOPI

A photo-first social app for friends: share a moment, choose exactly who sees it, and see your
friends' moments on a home-screen widget, a feed and a social map. Black-and-white glass UI,
built with Expo and React Native.

> **Frontend only.** Everything runs on an in-memory mock backend, so the app works offline with
> demo data and resets when it restarts. The data layer sits behind a `Repository` interface
> (`src/data/repository.ts`), so a real backend can replace the mock without touching the screens.

## Features

- **Moments**: camera or gallery, caption, location tag (current location or popular places),
  audience per moment: friends (mutual follows), followers or everyone
- **Home**: Following / Discover pages that follow the finger, stories row, pull to refresh, the
  side page (camera or map) one swipe away, double-tap to like, long-press for reactions
- **Stories**: opens as a circle from the tapped ring, cube transition between people, pull down
  to dismiss
- **Social map**: moments as photo pins per place (react-native-maps; a simple stand-in on web)
- **Messages**: read receipts (sent, delivered, read), typing indicator, photo replies, profile peek
- **People**: follow requests, notifications, accent-insensitive search, two-way blocking, reports
- **Privacy rules** (pure, unit-tested functions in `src/domain/rules.ts`): private profiles,
  16-17 age protections, blocked users disappear everywhere
- **Account**: profile editing, settings, in-app privacy policy and terms, account deletion
- Turkish and English, Solar icons, haptics, Reanimated animations

## Tech stack

Expo SDK 58 · React Native 0.88 · React 19 · expo-router · Reanimated 4 · Zustand · i18next ·
expo-image · expo-camera · expo-location · react-native-maps · Jest + Testing Library

## Getting started

Requires Node.js 22+.

```bash
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your phone, or press `w` for the web
preview. On the sign-in screen, "Continue with Apple" offers a temporary "Go to home" shortcut
while there is no backend.

| Command | What it does |
| --- | --- |
| `npm test` | Unit and component tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `node scripts/build-icons.mjs` | Regenerates `src/ui/icon-data.ts` from the Solar icon set |

## Project structure

```
src/
  app/          screens (file-based routes)
  domain/       types and pure visibility rules (unit-tested)
  data/         Repository interface, in-memory mock, Zustand store
  features/     screen parts: camera, map, moment, profile, legal
  i18n/         Turkish and English strings
  ui/           design system: Glass, Icon, Segmented, BottomSheet, SwipePager…
```

## Credits

- Icons: Solar by 480 Design, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), bundled
  via [`@iconify-json/solar`](https://www.npmjs.com/package/@iconify-json/solar)
- Sample photos in `assets/photos`: [Unsplash](https://unsplash.com) (Unsplash License)
- Fonts: Be Vietnam Pro, Nunito and Playfair Display (SIL Open Font License) via `@expo-google-fonts`
- Apple and Google sign-in marks (paths from Phosphor Icons, MIT) are trademarks of their owners

## License

The code is released under the [MIT License](LICENSE). Bundled third-party assets keep their own
licenses listed above.
