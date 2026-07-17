module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // worklets/reanimated disabled: not used by this app, and
      // babel-preset-expo otherwise auto-detects a stray nested
      // react-native-worklets copy (pulled in transitively by nativewind)
      // that isn't resolvable from the project root.
      ['babel-preset-expo', { jsxImportSource: 'nativewind', worklets: false, reanimated: false }],
      'nativewind/babel',
    ],
  };
};
