// Minimal Reanimated stand-in for Jest: the native worklet runtime doesn't exist in Node, and the
// library's own mock crashes under jest-expo here. Tests only need components to render, so
// animations resolve straight to their final value.
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView, FlatList } = require('react-native');
  const identity = (v) => v;
  const entering = { duration: () => entering, delay: () => entering, springify: () => entering };
  const Animated = { View, Text, Image, ScrollView, FlatList, createAnimatedComponent: identity };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (value) => {
      const sv = { value, get: () => sv.value, set: (v) => (sv.value = v) };
      return sv;
    },
    useAnimatedRef: () => ({ current: null }),
    useReducedMotion: () => false,
    ReducedMotionConfig: () => null,
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    makeMutable: (value) => {
      const sv = { value, get: () => sv.value, set: (v) => (sv.value = v) };
      return sv;
    },
    useDerivedValue: (fn) => ({ value: fn(), get: fn }),
    interpolate: (v, input, output) => output[0] + ((v - input[0]) / (input[input.length - 1] - input[0])) * (output[output.length - 1] - output[0]),
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    runOnJS: (fn) => fn,
    useAnimatedScrollHandler: () => () => {},
    useAnimatedStyle: (fn) => fn(),
    withTiming: identity,
    withSpring: identity,
    withRepeat: identity,
    withDelay: (_ms, v) => v,
    withSequence: (...vals) => vals[vals.length - 1],
    Easing: { linear: identity, cubic: identity, out: () => identity, in: () => identity, inOut: () => identity, bezier: () => identity },
    FadeIn: entering,
    FadeOut: entering,
    FadeInDown: entering,
    FadeInUp: entering,
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
