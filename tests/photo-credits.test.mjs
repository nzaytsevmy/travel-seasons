import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseFragment } from 'parse5';
import { publicPhotoCredits, newsPhotoCaption } from '../src/data/photo-credits.js';

const photo = {
  creator: 'Автор', title: 'Название кадра', license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  source: 'https://commons.wikimedia.org/wiki/File:Photo.jpg',
};

test('публичная атрибуция сохраняет автора, название, версию лицензии и оригинал', () => {
  assert.deepEqual(publicPhotoCredits([photo]), [{ ...photo, changes: [] }]);
});

test('CC0 не требует публичного авторского кредита; исходные записи не меняются', () => {
  const cc0 = { ...photo, license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' };
  const before = JSON.stringify(cc0);
  assert.deepEqual(publicPhotoCredits([cc0]), []);
  assert.equal(JSON.stringify(cc0), before);
});

test('лицензия вне CC BY тоже сохраняется; неизвестные условия не скрываются', () => {
  const special = { ...photo, license: 'Copernicus Sentinel data licence', licenseUrl: 'https://cds.climate.copernicus.eu/licences/ec-sentinel' };
  assert.deepEqual(publicPhotoCredits([special]), [{ ...special, changes: [] }]);
  assert.throws(() => publicPhotoCredits([{ ...special, license: 'Attribution', licenseUrl: '' }]));
});

test('обязательная атрибуция не теряется при пустом авторе или небезопасной ссылке', () => {
  for (const patch of [{ creator: '' }, { source: '' }, { licenseUrl: 'javascript:alert(1)' }, { source: 'data:text/html,photo' }]) {
    assert.throws(() => publicPhotoCredits([{ ...photo, ...patch }]));
  }
});

test('повтор кадра сохраняет название и все уведомления о его изменениях', () => {
  const items = publicPhotoCredits([
    { ...photo, title: '', changes: 'Уменьшено до 1920 пикселей.' },
    { ...photo, derivative: 'Кадрировано до 16:9.' },
    photo,
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, photo.title);
  assert.deepEqual(items[0].changes, ['Уменьшено до 1920 пикселей.', 'Кадрировано до 16:9.']);
});

test('новостной кадр попадает в общую атрибуцию, а подпись описывает сюжет', () => {
  const data = { imageCredit: photo.creator, imageTitle: photo.title, imageLicense: photo.license,
    imageLicenseUrl: photo.licenseUrl, imageSource: photo.source };
  assert.deepEqual(publicPhotoCredits([], [{ data }]), [{ ...photo, changes: [] }]);
  assert.equal(newsPhotoCaption(data, 'Запасное описание'), photo.title);
  assert.equal(newsPhotoCaption({ imageCredit: photo.creator }, 'Запасное описание'), 'Иллюстрация к теме');
  assert.equal(newsPhotoCaption({}, 'Иллюстрация к теме'), 'Иллюстрация к теме');
});

test('перенесённые подписи содержат только безопасную разметку и публичные адреса', () => {
  const notes = JSON.parse(fs.readFileSync(new URL('../src/data/photo-credit-notes.json', import.meta.url), 'utf8'));
  const allowed = new Set(['p', 'a', 'em', 'strong', 'br']);
  for (const article of Object.values(notes)) for (const html of article.notes) {
    const walk = node => {
      if (node.tagName) assert.ok(allowed.has(node.tagName), node.tagName);
      for (const attr of node.attrs || []) {
        assert.equal(attr.name, 'href');
        assert.ok(['https:', 'http:'].includes(new URL(attr.value).protocol), attr.value);
      }
      for (const child of node.childNodes || []) walk(child);
    };
    walk(parseFragment(html));
  }
});
