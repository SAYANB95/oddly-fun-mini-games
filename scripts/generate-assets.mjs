import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

await mkdir('assets', { recursive: true });
await mkdir('store-assets', { recursive: true });

const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="230" fill="#FFDC5E"/>
  <circle cx="512" cy="512" r="330" fill="#201B2A"/>
  <circle cx="402" cy="438" r="42" fill="#FFF9ED"/>
  <circle cx="622" cy="438" r="42" fill="#FFF9ED"/>
  <path d="M355 592 C420 720 604 720 669 592" fill="none" stroke="#FFF9ED" stroke-width="48" stroke-linecap="round"/>
  <circle cx="226" cy="244" r="88" fill="#5BC0EB" stroke="#FFF9ED" stroke-width="24"/>
  <circle cx="790" cy="258" r="72" fill="#FF6B6B" stroke="#FFF9ED" stroke-width="22"/>
  <circle cx="824" cy="750" r="104" fill="#8B6DFF" stroke="#FFF9ED" stroke-width="26"/>
</svg>`;

const foregroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="270" fill="#201B2A"/>
  <circle cx="420" cy="448" r="34" fill="#FFF9ED"/>
  <circle cx="604" cy="448" r="34" fill="#FFF9ED"/>
  <path d="M382 576 C438 680 586 680 642 576" fill="none" stroke="#FFF9ED" stroke-width="42" stroke-linecap="round"/>
  <circle cx="292" cy="310" r="66" fill="#5BC0EB" stroke="#FFF9ED" stroke-width="18"/>
  <circle cx="742" cy="730" r="76" fill="#8B6DFF" stroke="#FFF9ED" stroke-width="20"/>
</svg>`;

const monochromeSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="275" fill="#000"/>
  <circle cx="420" cy="448" r="34" fill="#FFF"/>
  <circle cx="604" cy="448" r="34" fill="#FFF"/>
  <path d="M382 576 C438 680 586 680 642 576" fill="none" stroke="#FFF" stroke-width="42" stroke-linecap="round"/>
</svg>`;

const featureSvg = `
<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="500" fill="#201B2A"/>
  <circle cx="914" cy="40" r="220" fill="#8B6DFF" opacity=".42"/>
  <circle cx="82" cy="488" r="180" fill="#5BC0EB" opacity=".35"/>
  <text x="72" y="110" fill="#C8BBFF" font-family="Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="4">NO RULEBOOK. JUST TAP.</text>
  <text x="68" y="232" fill="#FFF9ED" font-family="Arial Black, Arial, sans-serif" font-size="84" font-weight="900">ODDLY FUN</text>
  <text x="72" y="292" fill="#DAD2E7" font-family="Arial, sans-serif" font-size="28" font-weight="700">Three tiny games. One big brain tickle.</text>
  <g transform="translate(845 278)">
    <circle cx="0" cy="0" r="112" fill="#FFDC5E"/>
    <circle cx="-42" cy="-22" r="14" fill="#201B2A"/>
    <circle cx="42" cy="-22" r="14" fill="#201B2A"/>
    <path d="M-58 30 C-30 82 30 82 58 30" fill="none" stroke="#201B2A" stroke-width="18" stroke-linecap="round"/>
  </g>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile('assets/icon.png');
await sharp(Buffer.from(iconSvg))
  .resize(512, 512)
  .png()
  .toFile('store-assets/play-icon-512.png');
await sharp(Buffer.from(foregroundSvg))
  .png()
  .toFile('assets/android-icon-foreground.png');
await sharp(Buffer.from(monochromeSvg))
  .png()
  .toFile('assets/android-icon-monochrome.png');
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: '#FFDC5E' },
})
  .png()
  .toFile('assets/android-icon-background.png');
await sharp(Buffer.from(foregroundSvg)).png().toFile('assets/splash-icon.png');
await sharp(Buffer.from(iconSvg))
  .resize(48, 48)
  .png()
  .toFile('assets/favicon.png');
await sharp(Buffer.from(featureSvg))
  .png()
  .toFile('store-assets/feature-graphic.png');

console.log('Generated app icon, adaptive icon, splash, favicon and Play feature graphic.');
