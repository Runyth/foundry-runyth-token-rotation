# Incremental Changelog - v1.1.0 to v1.2.0

## User-visible

- Added opt-in Player Click Rotation to each placed standard Tile.
- Added a per-Tile arbitrary degree amount from 0.1° through 360°, including decimals.
- Added per-Tile clockwise/counter-clockwise direction.
- Added pointer-cursor affordance for enabled Tiles on player clients.
- Hidden Tiles do not accept player clicks.
- Locked Tiles may remain explicitly interactive.
- Existing Token and Tile Scene Controls are unchanged.

## Permission and authority model

- Players are not granted Tiles-layer access or generic Tile update permission.
- Player clicks are delegated to Foundry's designated active GM over the module socket.
- GM validates requester/Scene/Tile state and re-reads all rotation configuration from the Tile itself.
- Socket-provided angle/direction values are never trusted.

## Internal

- Added `scripts/interactive-tile-core.js`.
- Added `scripts/interactive-tile.js`.
- Added TileConfig ApplicationV2 render-hook integration.
- Added lifecycle synchronization for Tile mesh pointer listeners.
- Added a dedicated serialized GM-side socket operation queue.
- Added module stylesheet for the configuration fieldset.

## Compatibility

- Module ID unchanged: `runyth-token-rotation`.
- Rotation setting ID unchanged: `rotationStep`.
- Existing keybinding IDs unchanged.
- Existing Tiles without new flags remain non-interactive.
