const candidates = [400, 600, 720, 860, 1280, 1600, 1920];

// Never manufacture pixels beyond the source; retain its original size as a cap.
export function featuredImageWidths(image) {
  const original = Number(image?.width);
  if (!Number.isFinite(original) || original <= 0) return candidates;
  const widths = candidates.filter(width => width <= original);
  if (!widths.includes(original)) widths.push(original);
  return widths;
}

// The mobile card is 16:10. Wider photos need extra pixels for object-fit:cover.
export function featuredImageSizes(image) {
  const width = Number(image?.width);
  const height = Number(image?.height);
  const aspect = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? width / height : 2.8;
  const factor = Math.max(1, aspect / (16 / 10));
  const up = n => Math.ceil(n * 1000) / 1000;
  const down = n => Math.floor(n * 1000) / 1000;
  // Desktop image width is at most about 600px and the card height at most 440px.
  const desktop = Math.ceil(Math.max(600, 440 * aspect));
  return `(max-width: 680px) calc(${up(100 * factor)}vw - ${down(2 * factor)}rem - ${down(2 * factor)}px), ${desktop}px`;
}
