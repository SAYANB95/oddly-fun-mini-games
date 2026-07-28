# Monetization plan

- Banner ad on the home screen.
- Interstitial after every fourth completed run, never mid-game.
- Optional rewarded ad for 25 extra coins after a run.
- Production AdMob IDs must be supplied through the four variables documented
  in `.env.example`; the committed fallbacks are Google test IDs.
- Recommended first in-app purchase for a later release: remove ads plus one
  exclusive theme. Do not add it until retention data proves repeat use.

The game can earn only after production AdMob units are configured and real
users generate valid ad impressions. Downloads and revenue are not guaranteed.
