import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { readyHotelCollections, hotelBookingUrl } from '../src/data/hotels.js';
import { TP_MARKER_SHORT } from '../src/data/affiliate.js';
import { addClickAttribution, createClickId } from '../src/data/monetization.js';

function elements(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.childNodes || []) elements(child, predicate, found);
  return found;
}
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
export function publishedBookings(html) {
  return elements(parse(html), n => n.tagName === 'a' && (attr(n, 'class') || '').split(/\s+/).includes('hotel-entry-book'))
    .map(node => ({ href: attr(node, 'data-go') ? Buffer.from(attr(node, 'data-go'), 'base64').toString('utf8') : attr(node, 'href'),
      name: text(node).trim(), ctaId: attr(node, 'data-cta-id'), rel: attr(node, 'rel') }));
}
export function checkHotelLanding(target, final, status) {
  const expected = new URL(target), url = new URL(final);
  const mid = expected.pathname.match(/\/mid(\d+)\//)?.[1];
  return { sameProperty: !!mid && url.hostname === 'ostrovok.ru' && url.pathname.includes(`/mid${mid}/`),
    sameLocation: expected.pathname.split('/mid')[0] === url.pathname.split('/mid')[0],
    partnerIdPreserved: (url.searchParams.get('sub_id') || '').endsWith(`-${TP_MARKER_SHORT}`),
    partnerSlug: url.searchParams.get('partner_slug'),
    eridPreserved: url.searchParams.get('erid') === '2VtzqvE1cv3', status };
}
async function fetchBounded(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
  let body = ''; let size = 0;
  const decoder = new TextDecoder();
  for await (const chunk of response.body || []) {
    size += chunk.length;
    if (size > 5 * 1024 * 1024) { await response.body?.cancel().catch(() => {}); throw new Error('HTML exceeds 5 MiB'); }
    body += decoder.decode(chunk, { stream: true });
  }
  body += decoder.decode();
  return { response, body };
}
async function audit(output) {
  const origin = 'https://traveltribe.ru';
  const before = JSON.parse((await fetchBounded(`${origin}/build-version.json`)).body);
  const rows = [];
  const now = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  for (const [country, collection] of readyHotelCollections()) {
    const { response: page, body } = await fetchBounded(`${origin}/hotels/${country}/`);
    if (page.status !== 200) throw new Error(`${country}: live page HTTP ${page.status}`);
    const links = publishedBookings(body);
    if (links.length !== 10) throw new Error(`${country}: expected 10 published booking buttons`);
    for (const hotel of collection.hotels) {
      const ctaId = `hotels_${country}_${hotel.id}`.replaceAll('-', '_');
      const link = links.find(l => l.ctaId === ctaId);
      const row = { country, id: hotel.id, expectedName: hotel.name,
        expectedVerifiedName: hotel.research?.verifiedHeading || hotel.name, expectedLocation: hotel.location, expectedTarget: hotel.booking.target,
        statisticsReadback: 'NOT_VERIFIED', result: 'HOLD', hops: [] };
      try {
        if (!link || new URL(link.href).searchParams.get('u') !== hotel.booking.target) throw new Error('Published destination differs from selected hotel');
        if (!/\bsponsored\b/.test(link.rel || '') || !/\bnoopener\b/.test(link.rel || '')) throw new Error('Missing rel attributes');
        const clickId = createClickId();
        let url = new URL(addClickAttribution(link.href, { ctaId, experimentId: 'baseline', variant: 'na', clickId }));
        const productionSubId = url.searchParams.get('sub_id');
        if (!productionSubId?.includes(clickId)) throw new Error('Click ID was lost before redirect');
        url.searchParams.set('sub_id', `qa_${now}_${productionSubId}`);
        row.subIdOnShortlink = url.searchParams.get('sub_id');
        for (let hop = 0; hop < 8; hop++) {
          if (!['ostrovok.tpk.mx', 'ostrovok.ru', 'www.ostrovok.ru'].includes(url.hostname) || url.protocol !== 'https:') throw new Error('Unexpected redirect host');
          const { response, body: landing } = await fetchBounded(url, { redirect: 'manual' });
          row.hops.push({ status: response.status, host: url.hostname, path: url.pathname });
          const location = response.headers.get('location');
          if (response.status >= 300 && response.status < 400 && location) { url = new URL(location, url); continue; }
          Object.assign(row, checkHotelLanding(hotel.booking.target, url.href, response.status));
          const root = parse(landing);
          row.heading = elements(root, n => n.tagName === 'h1').map(text).join(' ').trim();
          row.pageTitle = elements(root, n => n.tagName === 'title').map(text).join(' ').trim();
          row.result = response.status === 200 && row.sameProperty && row.sameLocation && row.partnerIdPreserved && row.eridPreserved
            && row.partnerSlug === 'travelpayouts.affiliate.9ce9' && row.heading ? 'PASS_REDIRECT' : 'NEEDS_REVIEW';
          break;
        }
        if (!row.hops.length || row.hops.length === 8) throw new Error('Redirect did not terminate');
      } catch (error) { row.error = error.message; }
      rows.push(row);
      await fs.writeFile(output, JSON.stringify({ before, rows, complete: false }, null, 2));
    }
    console.log(JSON.stringify({ checked: rows.length, passed: rows.filter(r => r.result === 'PASS_REDIRECT').length, country }));
  }
  const after = JSON.parse((await fetchBounded(`${origin}/build-version.json`)).body);
  const complete = rows.length === 700 && JSON.stringify(before) === JSON.stringify(after);
  await fs.writeFile(output, JSON.stringify({ before, after, complete, rows }, null, 2));
  if (!complete || rows.some(r => r.result !== 'PASS_REDIRECT')) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await audit(process.argv[2]);
