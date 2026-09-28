# Changelog

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
