// Происхождение картинок статей. Заведено 05.09.2026 после жалобы правообладателя,
// по которой Google убрал страницу из поиска во всех странах.
//
// До этого в репозитории не было ничего, что мешало бы поставить в статью чужой кадр:
// проверка «Иллюстрации» считала их количество, но не спрашивала, чьи они. Опись показала
// 258 картинок в 52 статьях без единой записи об источнике, и у шести из них имя автора
// стояло прямо в метаданных файла — в том числе на страницах Рицы и Новоафонской пещеры,
// это второй по посещаемости раздел сайта.
//
// Что проверяется:
//   1. Полнота. Каждая растровая картинка, на которую ссылается статья, учтена: либо запись
//      о лицензии в _credits.json своей папки, либо строка в _images/_provenance.json.
//      Новый кадр без записи роняет сборку — именно этого не хватало.
//   2. Имя автора в файле. Если в метаданных стоит Artist или Copyright, у кадра обязана быть
//      запись о лицензии с именем автора: показывать чужую фотографию, зная имя автора и не
//      называя его, нельзя ни по лицензии, ни по совести.
//   3. Храповик. Тронутая в заходе статья не может использовать кадр со статусом unknown или
//      own_claimed: правишь статью — сначала подтверди происхождение её картинок.
//      Старое чинится волнами, новое не добавляется.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const BLOG = join(REPO, 'src/content/blog');
const IMAGES = join(BLOG, '_images');
const RASTER = /\.(jpe?g|png|webp)$/i;
const NEEDS_OWNER = new Set(['unknown', 'own_claimed', 'unknown_after_complaint']);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const articles = readdirSync(BLOG).filter((f) => /\.mdx?$/.test(f));

/** Картинка → статьи, которые на неё ссылаются. */
function usage() {
  const map = new Map();
  for (const a of articles) {
    const text = readFileSync(join(BLOG, a), 'utf8');
    for (const m of text.matchAll(/\.\/_images\/([A-Za-z0-9._/-]+?\.(?:jpe?g|png|webp))/g)) {
      const rel = m[1];
      if (!map.has(rel)) map.set(rel, new Set());
      map.get(rel).add(a);
    }
  }
  return map;
}

/** Записи о лицензии из всех _credits.json, ключ — путь от _images без расширения. */
function credits() {
  const out = new Map();
  for (const file of walk(IMAGES)) {
    if (!file.endsWith('_credits.json')) continue;
    const folder = relative(IMAGES, dirname(file)).replaceAll('\\', '/');
    let data;
    try { data = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
    for (const [name, rec] of Object.entries(data)) {
      out.set(folder ? `${folder}/${name}` : name, rec);
    }
  }
  return out;
}

function provenance() {
  const file = join(IMAGES, '_provenance.json');
  if (!existsSync(file)) return new Map();
  const data = JSON.parse(readFileSync(file, 'utf8'));
  return new Map(Object.entries(data).filter(([k]) => !k.startsWith('_')));
}

/** Имя автора, вшитое в сам файл: Artist (315) или Copyright (33432) в EXIF. */
function embeddedAuthor(absPath) {
  let buf;
  try { buf = readFileSync(absPath); } catch { return ''; }
  if (buf.length < 12 || buf[0] !== 0xff || buf[1] !== 0xd8) return '';   // только JPEG
  const app1 = buf.indexOf(Buffer.from('Exif\0\0'));
  if (app1 < 0) return '';
  const tiff = app1 + 6;
  if (tiff + 8 > buf.length) return '';
  const le = buf.toString('ascii', tiff, tiff + 2) === 'II';
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  let ifd;
  try { ifd = tiff + u32(tiff + 4); } catch { return ''; }
  if (ifd + 2 > buf.length) return '';
  const count = u16(ifd);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > buf.length) break;
    const tag = u16(entry);
    if (tag !== 315 && tag !== 33432) continue;
    const len = u32(entry + 4);
    const off = len > 4 ? tiff + u32(entry + 8) : entry + 8;
    if (off + len > buf.length) continue;
    const value = buf.toString('utf8', off, off + len).replace(/\0+$/, '').trim();
    if (value) return value;
  }
  return '';
}

function touchedArticles() {
  const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
  const args = [
    ['ls-files', '--others', '--exclude-standard', '--', 'src/content/blog'],
    ['diff', '--name-only', '--', 'src/content/blog'],
    ['diff', '--name-only', '--staged', '--', 'src/content/blog'],
    ['diff', '--name-only', `${base}...HEAD`, '--', 'src/content/blog'],
  ];
  const files = new Set();
  for (const a of args) {
    try {
      execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
        .split('\n').map((s) => s.trim()).filter(Boolean)
        .filter((f) => /\.mdx?$/.test(f))
        .forEach((f) => files.add(f.split('/').pop()));
    } catch { /* ветки нет — храповик просто не сработает */ }
  }
  return files;
}

test('Происхождение: у каждой картинки статьи есть запись — о лицензии или в описи', () => {
  const used = usage(); const cred = credits(); const prov = provenance();
  const bad = [];
  for (const [rel, arts] of used) {
    const noExt = rel.slice(0, rel.length - extname(rel).length);
    if (cred.has(noExt) || cred.has(rel) || prov.has(rel)) continue;
    bad.push(`${rel} — используется в ${[...arts].join(', ')}, происхождение не записано нигде`);
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('Происхождение: если имя автора стоит в самом файле, оно названо и в записи о лицензии', () => {
  const used = usage(); const cred = credits();
  const bad = [];
  for (const rel of used.keys()) {
    if (!RASTER.test(rel)) continue;
    const author = embeddedAuthor(join(IMAGES, rel));
    if (!author) continue;
    const rec = cred.get(rel.slice(0, rel.length - extname(rel).length)) || cred.get(rel);
    if (!rec || !rec.creator) {
      bad.push(`${rel} — в метаданных автор «${author}», а записи о лицензии с именем автора нет`);
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('Храповик: тронутая статья не тащит кадры с неподтверждённым происхождением', () => {
  const touched = touchedArticles();
  if (!touched.size) return;                       // нечего проверять
  const used = usage(); const cred = credits(); const prov = provenance();
  const bad = [];
  for (const [rel, arts] of used) {
    const mine = [...arts].filter((a) => touched.has(a));
    if (!mine.length) continue;
    const noExt = rel.slice(0, rel.length - extname(rel).length);
    if (cred.has(noExt) || cred.has(rel)) continue;
    const rec = prov.get(rel);
    if (rec && NEEDS_OWNER.has(rec.status)) {
      bad.push(`${rel} в статье ${mine.join(', ')} — статус «${rec.status}»: подтвердите происхождение или замените кадр`);
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});
