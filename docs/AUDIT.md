# v1.2.0 Best-Practice Audit

## Scope

Feature release adding opt-in per-Tile player left-click rotation while retaining all v1.1.0 Token/Tile selection controls.

## Findings

| Area | Result | Notes |
| --- | --- | --- |
| Package identity | PASS | Existing `runyth-token-rotation` ID retained. |
| Semantic versioning | PASS | New user-facing capability released as 1.2.0. |
| Existing Token/Tile controls | PASS | v1.1.0 Scene Controls and keybindings retained. |
| Opt-in behavior | PASS | New Tile interaction is disabled by default and stored per Tile. |
| Arbitrary degree amount | PASS | Decimal values accepted and bounded to 0.1°-360°. |
| Direction | PASS | Clockwise and counter-clockwise are explicit validated values. |
| Player permissions | PASS | Players are not granted generic Tile update permission. |
| Socket authority | PASS | Only active GM performs the persistent Tile update. |
| Request trust boundary | PASS | GM ignores client-supplied angle/direction and re-reads Tile flags. |
| Request validation | PASS | Requester, Scene, Tile, hidden state, viewed Scene, and enable flag validated. |
| Multiple GMs | PASS | Uses Foundry's designated `activeGM` model so one GM acts. |
| No-GM handling | PASS | Player receives a rate-limited warning; no optimistic local rotation. |
| Hidden Tiles | PASS | Not bound/accepted for player interaction. |
| Locked Tiles | PASS | May remain explicitly interactive while locked against ordinary manipulation. |
| Rapid repeated clicks | PASS | GM-side mutations serialized through a Promise queue. |
| Persistent state | PASS | Uses normal Tile `rotation`; no shadow counter. |
| Player interaction cleanup | PASS | PIXI listeners, event mode, and cursor are restored on unbind. |
| Private Foundry API reliance | PASS | No underscore-prefixed Foundry methods are patched or invoked. |
| Localization | PASS | English/German key parity tested. |
| System independence | PASS | No dnd5e or other game-system API dependency. |
| Documentation ZIP contract | PASS | Release packaging check excludes `module.json`. |

## Residual integration risk

A browser/unit environment cannot fully reproduce Foundry v13.351's PIXI event dispatch and TileConfig DOM. The implementation uses documented public Tile mesh properties, generic ApplicationV2/Placeable hooks, module sockets, and ordinary document flags, but a live Foundry smoke test remains the final integration check.

The most important live check is that an enabled Tile mesh receives the `pointertap` event on a player client under the intended Scene layering. The module does not patch `MouseInteractionManager` or private Tile methods, deliberately preferring the lower-coupling public mesh event path.
