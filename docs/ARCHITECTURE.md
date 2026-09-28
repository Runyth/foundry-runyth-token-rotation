# Architecture - v1.2.0

## Compatibility strategy

`runyth-token-rotation` remains the package ID. The existing `rotationStep` setting ID and keybinding IDs are unchanged, preserving v1.0.0/v1.1.0 user configuration.

## Existing selected-object rotation

The target abstraction still supports both Token and Tile embedded documents:

| Target | Scene control | Canvas layer | Scene collection | Embedded document |
| --- | --- | --- | --- | --- |
| Token | `tokens` | `canvas.tokens` | `scene.tokens` | `Token` |
| Tile | `tiles` | `canvas.tiles` | `scene.tiles` | `Tile` |

Selection-based rotation uses the current document `rotation` value, permission checking, batched Scene updates, and a Promise queue.

## Per-Tile Player Click Rotation

Each Tile may carry the following module flag object:

```text
flags.runyth-token-rotation.interactiveRotation
  enabled: boolean
  degrees: number
  direction: "clockwise" | "counterClockwise"
```

Defaults are disabled, 15°, clockwise. Degree values are defensively normalized to 0.1°-360°.

## Configuration integration

The module uses the ApplicationV2 `renderTileConfig` hook to append a small localized fieldset to the standard Tile configuration form. The fields use ordinary dotted `flags.*` form names, so Foundry persists them with the Tile update rather than requiring a parallel configuration document.

The TilePalette/multi-edit subclass is intentionally excluded: the interaction is configured on an individual placed Tile.

## Player interaction binding

Core Foundry does not expose the Tiles layer to players. For enabled, non-hidden Tiles on non-GM clients, the module therefore attaches a PIXI `pointerdown`/`pointertap` listener to the Tile's public `mesh` object and temporarily sets that mesh to static event mode with a pointer cursor.

Bindings are synchronized on canvas readiness, Tile draw/refresh/update, deletion, and canvas teardown. Previous mesh `eventMode` and cursor values are preserved and restored when the module unbinds.

Only an unmodified primary-button click is consumed. The request is created on `pointertap`; `pointerdown` is consumed to keep the click from falling through to ordinary canvas handling.

## Authority and security model

The manifest requests Foundry's module socket namespace. A player click sends only:

```text
type
sceneId
tileId
requesterId
```

The request does **not** provide a trusted degree amount or direction.

Only `game.users.activeGM` is expected to act. On the designated active GM client the module validates that:

- the requester exists, is active, is a non-GM player, and is viewing the requested Scene;
- the Scene and Tile exist;
- the Tile is not hidden;
- the Tile's authoritative `interactiveRotation.enabled` flag remains true.

The active GM then re-reads the authoritative `degrees` and `direction` flags and updates the Tile. This avoids giving players generic Tile update permission and prevents a client from changing the configured angle in a socket request.

## Concurrency

Player click requests are serialized on the active GM client. This is separate from the selected-object operation queue and prevents two rapid player clicks from reading the same previous rotation.

## Lock semantics

`locked` is intentionally not treated as a denial condition for Player Click Rotation. A GM may lock an interactive prop against normal canvas manipulation while retaining the explicitly configured player action.

## State model

No click count is stored. The Tile document's normal `rotation` field remains authoritative, so manual GM edits, reconnects, Scene changes, and other modules remain coherent with this feature.
