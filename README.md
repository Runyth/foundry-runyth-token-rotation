# Runyth Token & Tile Rotation

A small, system-agnostic Foundry VTT v13 module for repeatable, configurable rotation of selected Tokens and Tiles.

## Features

- Rotate selected Tokens clockwise or counter-clockwise by a configurable step.
- Rotate selected Tiles with the same controls and the same configured step.
- Reset selected Tokens or Tiles to 0°.
- Multi-selection support with one batched embedded-document update.
- Serialized operations so rapid repeated presses do not lose increments.
- Native Token and Tile Scene Control buttons.
- Configurable Foundry keybindings that target whichever supported layer is active.
- Per-user rotation-step setting, defaulting to 15°.
- Permission checks before document updates.
- English and German localization.
- No game-system dependency.

## Compatibility

- Minimum Foundry VTT: v13
- Verified Foundry VTT: v13.351

## Usage

1. Enable **Runyth Token & Tile Rotation** in the World.
2. Activate either **Token Controls** or **Tile Controls**.
3. Select one or more objects.
4. Press the module's rotate-left, reset, or rotate-right button.
5. Repeated presses continue from the documents' actual current rotation.

The configured rotation step is shared by Tokens and Tiles. Existing v1.0.0 user settings are retained because the module ID and `rotationStep` setting ID are unchanged.

## Keybindings

The module registers three unassigned keybindings under Foundry's Configure Controls screen:

- Rotate Selected Objects Counter-Clockwise
- Rotate Selected Objects Clockwise
- Reset Selected Object Rotation

They operate on the active Token or Tile layer. No default keys are assigned to avoid collisions with Foundry, systems, or other modules.

## Design notes

The module deliberately treats each Token or Tile document's `rotation` field as the source of truth. It does not maintain a separate click counter or shadow state.
