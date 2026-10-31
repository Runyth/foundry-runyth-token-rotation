# Changelog

## 1.2.0 - 2026-09-28

### Published

- Licensed the program under AGPL-3.0-or-later.
- Published install, source, and documentation archives as `-mod`, `-src`, and `-doc`.

### Feat

- Add opt-in **Player Click Rotation** to each placed standard Tile.
- Add per-Tile degree amount from 0.1° through 360°, including decimal values.
- Add per-Tile clockwise/counter-clockwise direction.
- Add a pointer cursor for player-clickable Tiles.
- Add GM-authoritative socket handling so players can trigger enabled Tiles without receiving generic Tile edit permission.
- Keep explicitly interactive locked Tiles usable while rejecting hidden Tiles.
- Add English and German Tile configuration UI and notifications.

### Struct

- Add `interactive-tile-core.js` for deterministic configuration, direction, degree, and click validation logic.
- Add `interactive-tile.js` for TileConfig integration, PIXI interaction binding, socket validation, and serialized GM updates.
- Enable the package-specific Foundry socket namespace in `module.json`.

### Test

- Add pure tests for degree bounds, decimal amounts, direction handling, default flags, and standard-left-click detection.
- Add GM-side request tests proving request-supplied angle/direction values are ignored in favor of authoritative Tile flags.
- Add rejection coverage for disabled and hidden Tiles.
- Add integration-contract coverage for all new Foundry hooks.

## 1.1.0 - 2026-09-28

### Feat

- Add the full rotate-left, rotate-right, and reset workflow to the Tile Scene Controls.
- Generalize the rotation engine to support both `Token` and `Tile` embedded documents.
- Make the existing keybindings target-aware so they operate on the active Token or Tile layer.
- Add Tile-specific selection and permission notifications.
- Preserve the existing module ID and `rotationStep` setting ID for upgrade compatibility.
- Keep the configured rotation step shared between Tokens and Tiles.

### Struct

- Extract pure rotation math and update construction into `scripts/rotation-core.js`.
- Generalize selection capture, permission filtering, batching, and operation serialization.

### Test

- Add unit coverage for normalization, clamping, incremental rotation, reset filtering, negative rotation, and invalid input.
- Add manifest and localization contract tests.

## 1.0.0

- Initial Token rotation controls.
