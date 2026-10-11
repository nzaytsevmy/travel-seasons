import { readFileSync, existsSync } from 'node:fs';
import { basename, dirname, extname } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = 'src/content/blog/_images/';
const provenance = JSON.parse(readFileSync(ROOT + '_provenance.json', 'utf8'));
const existingAssetCredits = JSON.parse(readFileSync('src/assets/destinations/_credits.json', 'utf8'));
const credits = new Map();
const digest = value => createHash('sha256').update(value).digest('hex');

// Разные размеры/кропы одного оригинала не становятся новыми фотографиями.
export function photoSourceKey(sha256, credit, record) {
  if (credit?.originalPath) return digest(`owner:${credit.creator}:${credit.originalPath.normalize('NFC')}`);
  if (credit?.source && !/авторское|собственн/i.test(credit.license || '')) return digest(`source:${new URL(credit.source).href}`);
  const original = record?.evidence?.match(/Кадр\s+(DSCF\d+)/)?.[1];
  const archive = record?.evidence?.match(/https:\/\/yadi\.sk\/d\/[\w-]+/)?.[0];
  return original && archive ? digest(`owner:${archive}:${original}`) : sha256;
}

export function homePhotoProvenance(file) {
  // Сохранённый кадр прежней главной: принимаем только зарегистрированный
  // файл с теми же байтами и лицензией, не открываем всю папку assets.
  if (file.startsWith('src/assets/destinations/')) {
    const credit = existingAssetCredits[basename(file, extname(file))];
    const sha256 = digest(readFileSync(file));
    if (credit?.license !== 'Pexels License' || !/^https:\/\/www\.pexels\.com\/photo\/\d+\/$/.test(credit.source || '') || credit.sha256 !== sha256) {
      throw new Error(`Происхождение существующего кадра не подтверждено: ${file}`);
    }
    return { id: photoSourceKey(sha256, credit), sha256, credit, record: null };
  }
  if (!file.startsWith(ROOT)) throw new Error(`Кадр вне проверенной библиотеки: ${file}`);
  const relative = file.slice(ROOT.length);
  const folder = dirname(file);
  if (!credits.has(folder)) {
    const source = folder + '/_credits.json';
    credits.set(folder, existsSync(source) ? JSON.parse(readFileSync(source, 'utf8')) : {});
  }
  const credit = credits.get(folder)[basename(file, extname(file))];
  const record = provenance[relative];
  if (record?.status !== 'own' && !(credit?.creator && credit?.license && /^https:\/\//.test(credit?.source || ''))) {
    throw new Error(`Происхождение кадра не подтверждено: ${file}`);
  }
  const sha256 = digest(readFileSync(file));
  return { id: photoSourceKey(sha256, credit, record), sha256, credit, record };
}
