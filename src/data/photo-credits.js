// Публичная атрибуция живёт на /legal/photos/. Подписи у кадров описывают место.
// Записи _credits.json и поля новости остаются источником авторства и лицензии.
export function publicPhotoCredits(records, news = []) {
  const credits = new Map();
  for (const record of [...records, ...news.map(({ data }) => ({
    creator: data.imageCredit,
    license: data.imageLicense,
    licenseUrl: data.imageLicenseUrl,
    source: data.imageSource,
    title: data.imageTitle || data.imageAlt,
  }))]) {
    if (!record?.license) continue;
    // Исключаем только известные случаи без обязательной атрибуции. Неизвестная
    // лицензия обязана иметь публичные сведения, иначе сборка остановится.
    if (/^(?:CC0|Public domain|общественное достояние|Pixabay(?: Content License)?|Pexels License|Unsplash License|Авторская схема|Авторское фото|Собственный кадр автора|собственное фото)$/i.test(record.license.trim())) continue;
    const source = safeUrl(record.source);
    const licenseUrl = safeUrl(record.licenseUrl);
    if (!record.creator?.trim() || !source || !licenseUrl) throw new Error(`У фотографии ${record.title || record.creator || 'без названия'} неполная атрибуция`);
    const item = {
      creator: record.creator,
      title: record.title || `Снимок ${record.creator}`,
      license: record.license,
      licenseUrl,
      source,
      changes: [...new Set([record.changes, record.derivative].filter(value => typeof value === 'string' && value.trim()))],
    };
    const key = [source, item.creator, licenseUrl].join('|');
    const previous = credits.get(key);
    if (!previous) {
      credits.set(key, item);
    } else {
      if (previous.title.startsWith('Снимок ') && !item.title.startsWith('Снимок ')) previous.title = item.title;
      previous.changes = [...new Set([...previous.changes, ...item.changes])];
    }
  }
  return [...credits.values()].sort((a, b) => a.creator.localeCompare(b.creator, 'ru') || a.title.localeCompare(b.title, 'ru'));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function newsPhotoCaption(data, fallback) {
  // Архивный кадр не выдаётся за фотографию события; авторство читается в подвале.
  return data.imageCredit ? (data.imageTitle || 'Иллюстрация к теме') : fallback;
}
