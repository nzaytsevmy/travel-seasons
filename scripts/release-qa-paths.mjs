// Keep release QA on site paths; generated blog tags also use encoded UTF-8.
export function isReleaseQaPath(path) {
  if (typeof path !== 'string') return false;
  if (/^\/(?:[a-z0-9-]+\/)*$/.test(path)) return true;
  if (!/^\/blog\/tag\/(?:[a-z0-9-]|%[a-f0-9]{2})+\/$/i.test(path)) return false;
  try {
    return /^\/blog\/tag\/[\p{L}\p{N}-]+\/$/u.test(decodeURIComponent(path));
  } catch {
    return false;
  }
}
