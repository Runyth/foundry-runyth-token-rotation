# Test Results - v1.2.0

Date: 2026-09-28

## Automated checks

### JavaScript syntax

Command:

```text
npm run check
```

Result: **PASS**

- `scripts/main.js`: syntax valid
- `scripts/rotation-core.js`: syntax valid
- `scripts/interactive-tile-core.js`: syntax valid
- `scripts/interactive-tile.js`: syntax valid

### Unit and integration-contract tests

Command:

```text
npm test
```

Result: **PASS - 20/20 tests**

Covered behavior includes:

1. Existing `rotationStep` setting identity and scope remain unchanged.
2. Existing three keybinding IDs remain unchanged.
3. Token and Tile Scene Controls retain their three rotation actions.
4. New interactive Tile Foundry hooks are registered.
5. Per-Tile interaction defaults to disabled, 15°, clockwise.
6. Decimal arbitrary degree values are preserved.
7. Degree values are defensively bounded to 0.1°-360°.
8. Direction validation accepts the supported clockwise/counter-clockwise values.
9. Direction produces the expected signed rotation delta.
10. Only unmodified primary-button clicks qualify.
11. Active-GM handling applies authoritative Tile flags.
12. Client-supplied fake degree/direction data does not override authoritative Tile flags.
13. Counter-clockwise wrap-around is correct.
14. Disabled Tiles reject player requests.
15. Hidden Tiles reject player requests.
16. Manifest version is 1.2.0 and Foundry v13/v13.351 compatibility is retained.
17. Module socket namespace is enabled in the manifest.
18. New stylesheet is declared in the manifest.
19. English/German localization leaf keys have parity.
20. Existing rotation/reset arithmetic continues to pass its prior regression coverage.

## Integration limitation

A live Foundry v13.351 runtime is not available in the build container. The release therefore has syntax, pure-function, mocked hook/control, manifest, localization, and GM-authority tests. A final in-world smoke test should verify TileConfig placement and PIXI click delivery on an actual player client.
