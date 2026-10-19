// Native dimensions come from this property's published image metadata.
// Forced-width transforms are permitted only when they shrink the original.
export function publishedPhotoOriginalUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const parameters = url.hostname.endsWith('.imgix.net')
    ? ['auto', 'fit', 'crop', 'w', 'h', 'q', 'fm', 'rect', 'ar', 'dpr'] : {
    'dam.melia.com': ['im'],
    'cdn-datahub.visitfinland.com': ['s'],
    'images.squarespace-cdn.com': ['format'],
    'dynamic-media-cdn.tripadvisor.com': ['w', 'h', 's'],
  }[url.hostname];
  // Keep the exact published object path. Never strip signatures, invent a
  // larger dimension, or change an unknown publisher's delivery contract.
  if (!parameters || !url.search ||
      [...url.searchParams.keys()].some(key => !parameters.includes(key))) return null;
  url.search = '';
  url.hash = '';
  return url.href;
}

export function photoSourceIdentity(value) {
  const url = new URL(publishedPhotoOriginalUrl(value) || value);
  if (['cdn.ostrovok.ru', 'cdn.worldota.net'].includes(url.hostname))
    return `ostrovok:${url.pathname.replace(/^\/t\/[^/]+\//, '/')}`;
  if (url.hostname === 'irp.cdn-website.com' && url.pathname.includes('/dms3rep/multi/')) {
    url.pathname = url.pathname.replace('/dms3rep/multi/opt/', '/dms3rep/multi/')
      .replace(/-\d+w(?=\.(?:jpe?g|png|webp)$)/i, '');
    url.search = '';
  }
  if (url.pathname.includes('/wp-content/uploads/'))
    url.pathname = url.pathname.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp)$)/i, '');
  if (url.hostname === 'images.squarespace-cdn.com') url.searchParams.delete('format');
  if (url.hostname === 'live.staticflickr.com') {
    const id = url.pathname.match(/\/(\d+)_[a-f\d]+(?:_[a-z\d]+)?\.(?:jpe?g|png)$/i)?.[1];
    if (id) return `flickr:${id}`;
  }
  if (url.hostname === 'upload.wikimedia.org') {
    const file = url.pathname.match(/^\/wikipedia\/commons\/(?:thumb\/)?[^/]+\/[^/]+\/([^/]+)/)?.[1];
    if (file) return `commons:/wiki/File:${decodeURIComponent(file).replaceAll('_', ' ').normalize('NFC')}`;
  }
  url.hash = '';
  return url.href;
}

export function selectNativePhotoSource(photo, requiredWidth, requiredHeight) {
  return selectNativePhotoSources(photo, requiredWidth, requiredHeight)[0] || null;
}

export function selectNativePhotoSources(photo, requiredWidth, requiredHeight) {
  const width = photo.publisherWidth, height = photo.publisherHeight;
  if (!Number.isInteger(width) || !Number.isInteger(height) || Math.min(width, height) <= 0) return [];
  if (width < requiredWidth || height < requiredHeight) return [];
  const variants = [
    ...(width >= 2600 ? [{ name: '2600x1240', scale: 2600 / width }] : []),
    { name: '1920x1080', scale: Math.min(1, 1920 / width, 1080 / height) },
    ...(width >= 1920 ? [{ name: '1920x', scale: 1920 / width }] : []),
    ...(height >= 1920 ? [{ name: 'x1920', scale: 1920 / height }] : []),
    { name: '2048x2048', scale: Math.min(1, 2048 / Math.max(width, height)) },
  ];
  const eligible = variants.filter(item => Math.floor(width * item.scale) >= requiredWidth &&
    Math.floor(height * item.scale) >= requiredHeight);
  const url = new URL(photo.sourcePhoto);
  if (url.protocol !== 'https:' || !['cdn.ostrovok.ru', 'cdn.worldota.net'].includes(url.hostname)) return [];
  if (!/^\/t\/[^/]+\//.test(url.pathname)) return [];
  return eligible.map(variant => {
    const selected = new URL(url);
    selected.pathname = selected.pathname.replace(/^\/t\/[^/]+\//, `/t/${variant.name}/`);
    return { ...photo, sourcePhoto: selected.href, sourceVariant: variant.name,
      sourcePolicy: 'publisher-native-bounds-v2' };
  });
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
    ['1920x1080', '2048x2048', '2600x1240', '1920x', 'x1920'].includes(row.sourceVariant) &&
    (row.sourceVariant !== '2600x1240' || row.publisherWidth >= 2600) &&
    (row.sourceVariant !== '1920x' || row.publisherWidth >= 1920) &&
    (row.sourceVariant !== 'x1920' || row.publisherHeight >= 1920);
}
