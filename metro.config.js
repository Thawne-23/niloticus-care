// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'tflite' to the list of recognized asset extensions
config.resolver.assetExts.push('tflite');

// Remove 'tflite' from source extensions to prevent Metro trying to parse it as JavaScript
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'tflite'
);

module.exports = config;