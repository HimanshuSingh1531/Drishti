const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [
      'bin',
      'txt',
      'jpg',
      'png',
      'json',
      'mp3',
      'mp4',
      'ttf',
      'otf',
      'tflite',
      'db',
    ],
    sourceExts: [
      'js',
      'jsx',
      'ts',
      'tsx',
      'json',
    ],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
