// Native dimensions come from this property's published image metadata.
// Forced-width transforms are permitted only when they shrink the original.
export function selectNativePhotoSource(photo, requiredWidth, requiredHeight) {
  const width = photo.publisherWidth, height = photo.publisherHeight;
  if (!Number.isInteger(width) || !Number.isInteger(height) || Math.min(width, height) <= 0) return null;
  if (width < requiredWidth || height < requiredHeight) return null;
  const variants = [
    ...(width >= 2600 ? [{ name: '2600x1240', scale: 2600 / width }] : []),
    { name: '1920x1080', scale: Math.min(1, 1920 / width, 1080 / height) },
    { name: '2048x2048', scale: Math.min(1, 2048 / Math.max(width, height)) },
  ];
  const variant = variants.find(item => Math.floor(width * item.scale) >= requiredWidth &&
    Math.floor(height * item.scale) >= requiredHeight);
  if (!variant) return null;
  const url = new URL(photo.sourcePhoto);
  if (url.protocol !== 'https:' || !['cdn.ostrovok.ru', 'cdn.worldota.net'].includes(url.hostname)) return null;
  if (!/^\/t\/[^/]+\//.test(url.pathname)) return null;
  url.pathname = url.pathname.replace(/^\/t\/[^/]+\//, `/t/${variant.name}/`);
  return { ...photo, sourcePhoto: url.href, sourceVariant: variant.name,
    sourcePolicy: 'publisher-native-bounds-v2' };
}

export function sourceDoesNotEnlarge(row) {
  let source;
  try { source = new URL(row.sourcePhoto); } catch { return false; }
  const provider = ['cdn.ostrovok.ru', 'cdn.worldota.net'].includes(source.hostname);
  if (row.sourcePolicy === 'native-safe2048-v1')
    return source.protocol === 'https:' && (!provider || source.pathname.startsWith('/t/2048x2048/'));
  if (row.sourcePolicy !== 'publisher-native-bounds-v2') return false;
  return source.protocol === 'https:' && provider && source.pathname.startsWith(`/t/${row.sourceVariant}/`) &&
    Number.isInteger(row.publisherWidth) && Number.isInteger(row.publisherHeight) &&
    row.publisherWidth >= row.width && row.publisherHeight >= row.height &&
    ['1920x1080', '2048x2048', '2600x1240'].includes(row.sourceVariant) &&
    (row.sourceVariant !== '2600x1240' || row.publisherWidth >= 2600);
}
