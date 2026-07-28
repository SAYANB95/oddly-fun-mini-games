import type { ExpoConfig } from 'expo/config';

const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

const config: ExpoConfig = {
  name: 'Oddly Fun: Mini Games',
  slug: 'oddly-fun-mini-games',
  owner: 'sayanb95',
  githubUrl: 'https://github.com/SAYANB95/oddly-fun-mini-games',
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
        iosAppId: TEST_IOS_APP_ID,
        delayAppMeasurementInit: true,
        optimizeInitialization: true,
        optimizeAdLoading: true,
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '21fdaf99-2563-4b51-a02f-49213d698320',
    },
  },
};

export default config;
