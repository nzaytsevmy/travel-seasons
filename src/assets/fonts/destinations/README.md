Destination font transport subsets from the installed Fontsource packages, under the bundled OFL licenses. Families, outlines, advances, weights and CSS roles are preserved. Original faces remain available for characters outside the transport ranges.

- Golos Latin keeps the complete original Latin coverage, avoiding a second Latin download for names such as Aerolíneas.
- The ruble comes from the original Golos Latin Extended variable face.
- Old Standard TT italic merges its original Cyrillic and Latin faces.
- A separate italic digit subset serves the year in Antarctica's heading. Other italic characters retain their original fallback faces.

Regenerate manually with `python3 scripts/build-destination-fonts.py` after installing `fonttools[woff]`. Production builds do not require Python font tooling. The generator verifies outlines and advances, including variable weights 400, 600 and 900, and records source/output hashes in `manifest.json`.
