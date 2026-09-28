# Runyth Token & Tile Rotation v1.1.0 - User Guide

## Token workflow

1. Open Token Controls.
2. Select one or more Tokens.
3. Use rotate-left, reset, or rotate-right.
4. Each additional click applies the configured step to the Tokens' current rotation.

## Tile workflow

1. Open Tile Controls.
2. Select one or more Tiles.
3. Use the same rotate-left, reset, or rotate-right controls.
4. Each additional click applies the configured step to the Tiles' current rotation.

## Rotation step

The user-scoped `Rotation Step` setting defaults to 15°. It accepts values from 1° through 180° and is shared by Token and Tile rotation.

## Keybindings

Three keybindings are registered but intentionally unassigned. Configure them in Foundry's Configure Controls screen. They operate on the active Token or Tile layer.

## Permissions

The module checks `canUserModify(game.user, "update")` on every selected embedded document before updating it. Documents without update permission are skipped. Foundry ordinarily restricts access to the Tile layer itself; the module does not bypass Foundry's access model.

## Rapid input

Rotation commands are serialized. This means repeatedly pressing +15° rapidly produces +30°, +45°, +60°, and so forth instead of allowing overlapping asynchronous document writes to lose an increment.
