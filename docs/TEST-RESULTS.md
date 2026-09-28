# Test Results - v1.1.0

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

### Unit and integration-contract tests

Command:

```text
npm test
```

Result: **PASS - 11/11 tests**

Covered behavior:

1. Existing `rotationStep` setting identity and user scope are retained.
2. Existing three keybinding IDs are retained.
3. Token Scene Controls receive rotate-left, reset, and rotate-right actions.
4. Tile Scene Controls receive the same three actions.
5. Manifest is version 1.1.0 and targets Foundry v13/v13.351.
6. English/German localization leaf keys have parity.
7. Rotation normalization handles wrap-around and negative values.
8. Non-finite rotation input is normalized safely.
9. Rotation-step validation/clamping is deterministic.
10. Clockwise/counter-clockwise multi-document updates use identical Token/Tile math.
11. Reset updates avoid writes for documents already at normalized 0°.

## Integration limitation

A live Foundry v13.351 runtime is not available in the test container. The release therefore has unit, syntax, manifest, localization, and mocked Foundry hook/control registration coverage, but the final in-world smoke test must still be performed in Foundry itself.
