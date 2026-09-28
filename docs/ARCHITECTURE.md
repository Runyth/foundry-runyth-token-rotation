# Architecture

## Compatibility strategy

`runyth-token-rotation` remains the package ID in v1.1.0. Changing the display title to **Runyth Token & Tile Rotation** does not break Foundry's package identity.

The v1.0.0 `rotationStep` setting ID and existing keybinding IDs are retained so user configuration remains addressable after upgrade.

## Target abstraction

The Foundry integration defines metadata for two targets:

| Target | Scene control | Canvas layer | Scene collection | Embedded document |
| --- | --- | --- | --- | --- |
| Token | `tokens` | `canvas.tokens` | `scene.tokens` | `Token` |
| Tile | `tiles` | `canvas.tiles` | `scene.tiles` | `Tile` |

The same selection, permission, update batching, reset, and queue logic is used for both.

## State model

No click count is stored. The embedded document's `rotation` field is authoritative. This avoids desynchronization after manual rotation, refresh, reconnect, Scene changes, or edits by another user.

## Concurrency

All mutations pass through a single Promise queue. A command captures its Scene and selected document IDs immediately, then executes in invocation order. This avoids lost increments under rapid repeated input and avoids accidentally applying an older click to a newly selected object.

## Database writes

A multi-selection produces one `Scene#updateEmbeddedDocuments` call per command. Reset operations skip objects already normalized to 0°, avoiding needless updates.
