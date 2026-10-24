"""Rebuild lossless transport subsets from the installed Fontsource packages.

Manual tooling only; production builds use committed WOFF2 files.
Requires fonttools[woff]. Run from any directory after npm ci.
"""
from hashlib import sha256
from pathlib import Path
import json

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/assets/fonts/destinations"
MODULES = ROOT / "node_modules"
SOURCES = {
    "latin": MODULES / "@fontsource-variable/golos-text/files/golos-text-latin-wght-normal.woff2",
    "extended": MODULES / "@fontsource-variable/golos-text/files/golos-text-latin-ext-wght-normal.woff2",
    "italic_latin": MODULES / "@fontsource/old-standard-tt/files/old-standard-tt-latin-400-italic.woff2",
    "italic_cyrillic": MODULES / "@fontsource/old-standard-tt/files/old-standard-tt-cyrillic-400-italic.woff2",
}


def save(font, characters, name):
    options = subset.Options()
    options.hinting = False
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=characters)
    worker.subset(font)
    font.flavor = "woff2"
    font.recalcTimestamp = False
    font.save(OUT / name)


def verify_glyphs(original, result, characters):
    """Compare actual outlines and advances, including composite glyphs."""
    for character in characters:
        left = original.getBestCmap()[character]
        right = result.getBestCmap()[character]
        assert original["hmtx"][left][0] == result["hmtx"][right][0], hex(character)
        a = original["glyf"][left].getCoordinates(original["glyf"])
        b = result["glyf"][right].getCoordinates(result["glyf"])
        assert list(a[0]) == list(b[0]) and list(a[1]) == list(b[1]), hex(character)


OUT.mkdir(parents=True, exist_ok=True)
latin = TTFont(SOURCES["latin"])
latin_characters = list(latin.getBestCmap())
save(latin, latin_characters, "golos-latin.woff2")
save(TTFont(SOURCES["extended"]), [0x20BD], "golos-ruble.woff2")

italic_sources = [TTFont(SOURCES[key]) for key in ("italic_cyrillic", "italic_latin")]
characters = set().union(*(font.getBestCmap() for font in italic_sources))
italic = Merger().merge([str(SOURCES[key]) for key in ("italic_cyrillic", "italic_latin")])
save(italic, characters, "old-standard-italic.woff2")
save(TTFont(SOURCES["italic_latin"]), range(48, 58), "year-italic.woff2")

for original in italic_sources:
    verify_glyphs(original, TTFont(OUT / "old-standard-italic.woff2"), original.getBestCmap())
verify_glyphs(TTFont(SOURCES["italic_latin"]), TTFont(OUT / "year-italic.woff2"), range(48, 58))
for source, output, characters in [
    (SOURCES["latin"], "golos-latin.woff2", latin_characters),
    (SOURCES["extended"], "golos-ruble.woff2", [0x20BD]),
]:
    for weight in (400, 600, 900):
        original = instantiateVariableFont(TTFont(source), {"wght": weight}, inplace=False)
        result = instantiateVariableFont(TTFont(OUT / output), {"wght": weight}, inplace=False)
        verify_glyphs(original, result, characters)

manifest = {
    "verification": "Original outlines and advances preserved; variable weights 400, 600, 900 checked.",
    "sources": {str(path.relative_to(ROOT)): sha256(path.read_bytes()).hexdigest() for path in SOURCES.values()},
    "outputs": {path.name: {"bytes": path.stat().st_size, "sha256": sha256(path.read_bytes()).hexdigest()}
                for path in sorted(OUT.glob("*.woff2"))},
}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps(manifest, indent=2))
