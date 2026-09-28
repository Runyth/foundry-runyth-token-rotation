# Runyth Token & Tile Rotation v1.2.0 - User Guide

## Token workflow

1. Open Token Controls.
2. Select one or more Tokens.
3. Use rotate-left, reset, or rotate-right.
4. Each additional click applies the configured user step to the Tokens' current rotation.

## Tile toolbar workflow

1. Open Tile Controls.
2. Select one or more Tiles.
3. Use the same rotate-left, reset, or rotate-right controls.
4. Each additional click applies the configured user step to the Tiles' current rotation.

## Player Click Rotation

Player Click Rotation is configured independently on each placed standard Tile.

### GM setup

1. Double-right-click or otherwise open the normal Tile configuration sheet.
2. Find **Player Click Rotation**.
3. Enable **player left-click rotation**.
4. Set **Degrees per click**. Valid values are 0.1° through 360° and may be decimal values.
5. Set **Direction** to Clockwise or Counter-clockwise.
6. Save the Tile.

The default per-Tile values are disabled, 15°, clockwise.

### Player use

Enabled Tiles show a pointer cursor to non-GM players. A standard, unmodified left-click requests exactly one rotation step. Modified clicks such as Shift+click or Ctrl+click are ignored by the feature so they remain available to Foundry/system workflows.

The feature works without granting a player the Tiles layer or generic Tile modification permission. A connected active GM validates the request and applies the Tile update.

### Hidden and locked Tiles

- Hidden Tiles cannot be triggered by players.
- A locked Tile can still be player-clickable when Player Click Rotation is explicitly enabled. Locking therefore remains useful for preventing accidental GM repositioning while retaining the Tile as an interactive prop.

### Active GM requirement

Foundry normally prevents players from interacting with or editing Tiles. Therefore a connected active GM is required to authorize and persist player click rotation. If there is no active GM, a rate-limited warning is shown to the player and no rotation is applied.

## Rotation step setting

The user-scoped `Rotation Step` setting defaults to 15°. It accepts values from 1° through 180° and is used only by the selection toolbar/keybinding workflow. Player Click Rotation uses each Tile's own degree value instead.

## Keybindings

Three keybindings are registered but intentionally unassigned. Configure them in Foundry's Configure Controls screen. They operate on the active Token or Tile layer.

## Rapid input

Both selected-object commands and GM-side player click requests are serialized. Rapid repeated actions therefore advance from the latest persisted rotation rather than racing concurrent document writes.
