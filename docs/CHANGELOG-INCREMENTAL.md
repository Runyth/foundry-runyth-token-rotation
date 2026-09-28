# Incremental Changelog - v1.0.0 to v1.1.0

## User-visible

- Tile Controls now receive the same rotate-left, reset, and rotate-right actions as Token Controls.
- Rotation keybindings now operate on the active supported layer instead of being Token-only.
- Rotation-step wording now explicitly covers both Tokens and Tiles.
- Tile-specific selection and permission feedback added.

## Internal

- Rotation arithmetic extracted into a pure module.
- Token-only selection/update code generalized into a target-driven implementation.
- Queue entries capture Scene and selected document IDs at click time.
- Unit and package-contract tests added.

## Compatibility

- Module ID unchanged: `runyth-token-rotation`.
- Rotation setting ID unchanged: `rotationStep`.
- Existing keybinding IDs unchanged.
