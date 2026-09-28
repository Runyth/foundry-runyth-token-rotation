# Release Report - Runyth Token & Tile Rotation v1.2.0

## Release type

Feature release (minor SemVer increment from 1.1.0 to 1.2.0).

## Requested capability

Extend placed standard Tiles so that, when explicitly enabled, a player can standard-left-click the Tile and rotate it by a designated arbitrary number of degrees in a designated clockwise or counter-clockwise direction.

## Delivered capability

- Individual placed Tiles now expose **Player Click Rotation** in their standard Tile configuration.
- The feature is disabled by default.
- Each Tile independently stores:
  - enabled/disabled;
  - 0.1°-360° degrees per click, including decimals;
  - clockwise/counter-clockwise direction.
- Non-GM players receive a pointer cursor on enabled visible Tiles.
- A standard unmodified left-click requests one rotation step.
- An active GM authoritatively validates and updates the Tile via Foundry's module socket namespace.
- The socket request cannot override the Tile's configured angle/direction.
- Hidden Tiles reject interaction.
- Locked Tiles can remain explicitly player-clickable.
- Rapid requests are serialized on the active GM to preserve every increment.

## Existing functionality retained

- Token selection rotate-left/reset/rotate-right.
- Tile selection rotate-left/reset/rotate-right.
- Shared user-scoped toolbar/keybinding rotation step.
- Existing keybinding IDs and module ID.
- Multi-selection batching and permission checks.

## Upgrade behavior

No data migration is required. Existing Worlds simply gain new optional Tile flags when the GM configures Player Click Rotation. Unconfigured Tiles behave exactly as before.
