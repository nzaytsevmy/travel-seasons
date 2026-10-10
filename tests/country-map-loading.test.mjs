import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/components/CountryMap.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/)[1];
const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture({ cached = false } = {}) {
  const nodes = [], initializations = [];
  function element(tag) {
    const attrs = {}, listeners = {};
    return { tag, sheet: null, setAttribute: (k, v) => attrs[k] = v,
      addEventListener: (event, fn) => (listeners[event] ??= []).push(fn),
      dispatch(event) { if (tag === 'link' && event === 'load') this.sheet = {}; for (const fn of listeners[event] ?? []) fn(); this['on' + event]?.(); },
      has: name => name in attrs };
  }
  const L = { map(id) { initializations.push(id); return { setView() { return this; }, fitBounds() {}, on() {}, scrollWheelZoom: { enable() {}, disable() {} } }; },
    tileLayer: () => ({ addTo() {} }), divIcon: () => ({}), marker: () => ({ addTo: () => ({ bindPopup() {} }) }) };
  const window = cached ? { L } : {};
  if (cached) { const css = element('link'); css.setAttribute('data-leaflet', '1'); css.sheet = {}; nodes.push(css); }
  const document = { getElementById: id => ({ id }),
    querySelector: selector => nodes.find(n => n.tag === (selector.startsWith('link') ? 'link' : 'script') && n.has('data-leaflet')),
    createElement: element, head: { appendChild: node => nodes.push(node) } };
  const context = vm.createContext({ window, document, mapId: 'one', pois: [{ name: 'Place', lat: 1, lng: 2 }], center: { lat: 1, lng: 2, zoom: 5 }, Promise });
  const run = id => vm.runInContext(`(function (mapId) {${script}\n})(${JSON.stringify(id)});`, context, { timeout: 1000 });
  const css = () => nodes.find(n => n.tag === 'link');
  const js = () => nodes.find(n => n.tag === 'script');
  return { run, css, js, nodes, initializations, loadJs() { window.L = L; js().dispatch('load'); } };
}
test('JavaScript arriving before CSS does not initialize an unstyled map', async () => {
  const f = fixture(); f.run('one'); f.loadJs(); await settle();
  assert.deepEqual(f.initializations, []);
  f.css().dispatch('load'); await settle(); assert.deepEqual(f.initializations, ['one']);
});
test('CSS arriving before JavaScript still initializes exactly once', async () => {
  const f = fixture(); f.run('one'); f.css().dispatch('load'); await settle(); assert.deepEqual(f.initializations, []);
  f.loadJs(); await settle(); assert.deepEqual(f.initializations, ['one']);
});
test('cached stylesheet and library initialize without duplicate downloads', async () => {
  const f = fixture({ cached: true }); f.run('one'); await settle(); assert.deepEqual(f.initializations, ['one']); assert.equal(f.nodes.length, 1);
});
test('two maps share assets and both wait for the stylesheet', async () => {
  const f = fixture(); f.run('one'); f.run('two'); f.loadJs(); await settle(); assert.deepEqual(f.initializations, []);
  f.css().dispatch('load'); await settle(); assert.deepEqual(f.initializations, ['one', 'two']); assert.equal(f.nodes.length, 2);
});
test('failed stylesheet does not create an unstyled map', async () => {
  const f = fixture(); f.run('one'); f.css().dispatch('error'); f.loadJs(); await settle(); assert.deepEqual(f.initializations, []);
});
