# Release Report - Runyth Token & Tile Rotation v1.1.0

## Release type

Feature release (minor SemVer increment from 1.0.0 to 1.1.0).

## Requested capability

Provide the same repeatable rotation functionality for Tiles that is already available for Tokens.

## Delivered capability

- Token Controls: rotate counter-clockwise, reset to 0°, rotate clockwise.
- Tile Controls: rotate counter-clockwise, reset to 0°, rotate clockwise.
- Both use the same user-configurable rotation step, default 15°.
- Both support multi-selection, permissions, batched updates, and rapid repeated input.
- Existing keybindings are now active-layer aware and work on either Token or Tile Controls.

## Upgrade behavior

No package migration is required. The package ID remains `runyth-token-rotation`; the user-scoped `rotationStep` setting and three keybinding IDs remain unchanged.

## API basis

The implementation is based on Foundry VTT v13 public APIs, including `getSceneControlButtons`, Canvas layers, embedded document updates, and the documented Token/Tile `rotation` fields.
