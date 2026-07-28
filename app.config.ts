import type { ExpoConfig } from 'expo/config';

const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config: ExpoConfig = {
  name: 'Oddly Fun: Mini Games',
  slug: 'oddly-fun-mini-games',
  owner: 'sayanb95',
  version: '1.0.0',
  platforms: ['android'],
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'oddlyfun',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.knitlly.oddlyfun',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#FFDC5E',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-status-bar',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '36.0.0',
          minSdkVersion: 24,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId:
          process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ANDROID_APP_ID,
        delayAppMeasurementInit: true,
        optimizeInitialization: true,
        optimizeAdLoading: true,
      },
    ],
  ],
};

export default config;
