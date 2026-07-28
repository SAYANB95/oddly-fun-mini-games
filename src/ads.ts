import {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const interstitialId =
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL;
const rewardedId = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || TestIds.REWARDED;

export function showInterstitial(): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = InterstitialAd.createForAdRequest(interstitialId, {
      requestNonPersonalizedAdsOnly: true,
    });
    let settled = false;
    const finish = (shown: boolean) => {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      resolve(shown);
    };
    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show().catch(() => finish(false));
    });
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () =>
      finish(true),
    );
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () =>
      finish(false),
    );
    ad.load();
    setTimeout(() => finish(false), 8000);
  });
}

export function showRewarded(): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(rewardedId, {
      requestNonPersonalizedAdsOnly: true,
    });
    let earned = false;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeReward();
      unsubscribeClosed();
      unsubscribeError();
      resolve(earned);
    };
    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show().catch(finish);
    });
    const unsubscribeReward = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
      },
    );
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, finish);
    ad.load();
    setTimeout(finish, 10000);
  });
}
