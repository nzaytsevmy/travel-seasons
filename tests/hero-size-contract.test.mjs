import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHeroFigure, mobileHeroRequiredWidth, inspectMobileHeroVariant } from '../scripts/hero-size-contract.mjs';

test('finds the real hero figure and rejects a missing or unclosed figure', () => {
  const figure = '<figure class = "wide post-cover"><img src="hero.webp"></figure>';
  assert.equal(extractHeroFigure('<style>.post-cover {}</style>' + figure), figure);
  assert.equal(extractHeroFigure('<style>.post-cover {}</style><img src="other.webp">'), null);
  assert.equal(extractHeroFigure('<figure class="post-cover"><img src="hero.webp">'), null);
});

test('cover weight gate keeps the existing conservative minimum and accounts for crop', () => {
  assert.equal(mobileHeroRequiredWidth('100vw'), 824);
  assert.equal(mobileHeroRequiredWidth('(max-width: 720px) calc(100vw - 2.8rem), 675px'), 824);
  assert.equal(mobileHeroRequiredWidth('(max-width: 720px) calc(100vw - 2rem), (max-width: 767px) calc(720px - 2rem), calc(720px - 2.8rem)', 1600, 1200), 824);
  assert.equal(mobileHeroRequiredWidth('(max-width: 720px) calc(133.4vw - 2.668rem), (max-width: 767px) calc(960.48px - 2.668rem), calc(720px - 2.8rem)', 1920, 1080), 1014);
});

test('cover weight inspection rejects oversized and missing AVIF files', () => {
  const set = '/_astro/small.avif 640w, /_astro/large.avif 1024w';
  assert.equal(inspectMobileHeroVariant(set, 900, () => 150 * 1024).problem, null);
  assert.equal(inspectMobileHeroVariant(set, 900, () => 150 * 1024 + 1).problem, 'oversized');
  assert.equal(inspectMobileHeroVariant(set, 900, () => undefined).problem, 'missing-file');
  assert.equal(inspectMobileHeroVariant('', 900, () => 1).problem, 'missing-srcset');
});

test('unknown or invalid cover sizes fail closed', () => {
  for (const value of [undefined, '100px', '(max-width: 720px) calc(1vw - 0.01rem), (max-width: 767px) calc(1px - 0.01rem), calc(1px - 0.01rem)', '(max-width: 720px) calc(100vw - 2rem), (max-width: 767px) calc(1px - 2rem), calc(720px - 2.8rem)']) {
    assert.throws(() => mobileHeroRequiredWidth(value, 1600, 1200), /hero sizes|hero size/);
  }
  assert.throws(() => mobileHeroRequiredWidth('unexpected', 0, 1200), /hero size/);
});
