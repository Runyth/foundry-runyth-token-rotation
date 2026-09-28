# v1.1.0 Best-Practice Audit

## Scope

Feature release adding Tile rotation parity to the v1.0.0 Token rotation workflow.

## Findings

| Area | Result | Notes |
| --- | --- | --- |
| Package identity | PASS | Existing `runyth-token-rotation` ID retained. |
| Semantic versioning | PASS | New user-facing capability released as 1.1.0. |
| Foundry v13 Scene Controls | PASS | Uses `getSceneControlButtons`; no DOM injection. |
| Tile support | PASS | Adds the same three controls to `controls.tiles`. |
| Token support | PASS | Existing Token behavior retained. |
| Persistent state | PASS | Uses Token/Tile document `rotation`; no shadow counter. |
| Multi-select efficiency | PASS | Batched embedded-document updates. |
| Permission handling | PASS | `canUserModify(..., "update")` checked per document. |
| Rapid repeated commands | PASS | Mutations serialized through a Promise queue. |
| Selection race handling | PASS | Scene and IDs captured at invocation time. |
| Upgrade compatibility | PASS | Setting ID and keybinding IDs retained. |
| Localization | PASS | English/German key parity is tested. |
| System independence | PASS | No dnd5e or other system API dependency. |
| Private API reliance | PASS | No private underscore-prefixed Foundry APIs used. |
| Documentation ZIP contract | PASS | Release inspection verifies `module.json` is absent. |

## Residual risk

A browser-level unit test cannot fully substitute for loading the module inside a live Foundry v13.351 World. The source is structured around documented V13 APIs and receives static syntax, contract, and pure-function test coverage, but a live Foundry smoke test remains the final integration check.
