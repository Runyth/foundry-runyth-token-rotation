# Runyth Token & Tile Rotation

A small, system-agnostic Foundry VTT v13 module for repeatable, configurable rotation of Tokens and Tiles, including opt-in player-clickable Tiles.

## Features

- Rotate selected Tokens clockwise or counter-clockwise by a configurable user step.
- Rotate selected Tiles with the same Scene Controls and keybindings.
- Reset selected Tokens or Tiles to 0°.
- Multi-selection support with one batched embedded-document update.
- Serialized operations so rapid repeated presses do not lose increments.
- Native Token and Tile Scene Control buttons.
- Configurable Foundry keybindings that target whichever supported layer is active.
- Per-user toolbar/keybinding rotation step, defaulting to 15°.
- Per-Tile **Player Click Rotation** configuration:
  - opt-in enable/disable toggle;
  - arbitrary 0.1°-360° amount per click;
  - clockwise or counter-clockwise direction;
  - standard unmodified player left-click interaction;
  - active-GM-authoritative Tile update over the module socket.
- Hidden Tiles cannot be triggered by players.
- Tile locking does not disable an explicitly enabled player-click interaction.
- English and German localization.
- No game-system dependency.

## Compatibility

- Minimum Foundry VTT: v13
- Verified Foundry VTT: v13.351

## Toolbar/keybinding usage

1. Enable **Runyth Token & Tile Rotation** in the World.
2. Activate either **Token Controls** or **Tile Controls**.
3. Select one or more objects.
4. Press the module's rotate-left, reset, or rotate-right button.
5. Repeated presses continue from the documents' actual current rotation.

The user-scoped toolbar/keybinding rotation step is shared by Tokens and Tiles. Existing v1.0.0/v1.1.0 user settings are retained because the module ID and `rotationStep` setting ID are unchanged.

## Player-clickable Tile usage

As GM:

1. Open the normal configuration sheet for a placed Tile.
2. In **Player Click Rotation**, enable player left-click rotation.
3. Choose the degree amount for each click.
4. Choose clockwise or counter-clockwise.
5. Save the Tile.

As a player:

1. Hover the enabled Tile; the pointer cursor indicates that it is interactive.
2. Standard left-click the Tile.
3. Each click rotates the Tile by its own configured amount and direction.

A connected active GM is required because Foundry ordinarily does not give players generic Tile-edit permission. The player sends only the Scene/Tile identity; the active GM re-reads the authoritative Tile flags and performs the update.

## Keybindings

The module registers three unassigned keybindings under Foundry's Configure Controls screen:

- Rotate Selected Objects Counter-Clockwise
- Rotate Selected Objects Clockwise
- Reset Selected Object Rotation

They operate on the active Token or Tile layer. No default keys are assigned to avoid collisions with Foundry, systems, or other modules.

## Design notes

The module treats each Token or Tile document's `rotation` field as the source of truth. It does not maintain a separate click counter or shadow rotation state.

## Licence
Copyright © 2026  [Daniel Braniewski](https://brani.dev/)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
