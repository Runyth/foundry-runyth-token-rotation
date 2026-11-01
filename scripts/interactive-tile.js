// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
/**
 * Player-facing per-Tile click rotation integration.
 *
 * Public API references:
 * - https://foundryvtt.com/article/module-development/
 * - https://foundryvtt.com/api/v13/classes/foundry.documents.collections.Users.html
 * - https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.TileData.html
 * - https://foundryvtt.com/api/v13/functions/hookEvents.renderApplicationV2.html
 * - https://foundryvtt.com/api/v13/functions/hookEvents.drawObject.html
 */

import { buildRotationUpdates } from "./rotation-core.js";
import {
  getInteractiveRotationDelta,
  isStandardLeftClick,
  normalizeInteractiveTileConfig
} from "./interactive-tile-core.js";

const FLAG_KEY = "interactiveRotation";
const SOCKET_REQUEST_TYPE = "interactiveTileRotationRequest";
const NO_GM_NOTIFICATION_COOLDOWN_MS = 5000;

/** @type {Map<string, {mesh: object, tapHandler: Function, downHandler: Function, eventMode: unknown, cursor: unknown}>} */
const interactiveBindings = new Map();

let socketOperationQueue = Promise.resolve();
let lastNoGmNotificationAt = 0;

/**
 * Read the current interactive rotation flags from a Tile document.
 *
 * @param {foundry.documents.TileDocument} tileDocument Tile document.
 * @param {string} moduleId Module identifier.
 * @returns {{enabled: boolean, degrees: number, direction: "clockwise"|"counterClockwise"}}
 */
export function getTileInteractiveConfig(tileDocument, moduleId) {
  return normalizeInteractiveTileConfig(
    tileDocument?.getFlag?.(moduleId, FLAG_KEY)
  );
}

/**
 * Determine whether a player client should expose click interaction for a Tile.
 *
 * @param {foundry.canvas.placeables.Tile} tile Tile placeable.
 * @param {string} moduleId Module identifier.
 * @returns {boolean} Whether the Tile should be player-clickable.
 */
function shouldBindInteractiveTile(tile, moduleId) {
  if (game.user?.isGM) {
    return false;
  }

  if (!tile?.document || !tile.mesh || tile.document.hidden === true) {
    return false;
  }

  return getTileInteractiveConfig(tile.document, moduleId).enabled;
}

/**
 * Restore a previously modified Tile mesh and detach this module's listener.
 *
 * @param {string} tileId Tile document ID.
 */
function unbindInteractiveTile(tileId) {
  const binding = interactiveBindings.get(tileId);

  if (!binding) {
    return;
  }

  const { mesh, tapHandler, downHandler, eventMode, cursor } = binding;

  mesh?.off?.("pointertap", tapHandler);
  mesh?.off?.("pointerdown", downHandler);

  if (mesh?.eventMode === "static") {
    mesh.eventMode = eventMode;
  }

  if (mesh?.cursor === "pointer") {
    mesh.cursor = cursor;
  }

  interactiveBindings.delete(tileId);
}

/**
 * Show a rate-limited warning when no active GM can authorize a player click.
 */
function notifyNoActiveGm() {
  const now = Date.now();

  if (now - lastNoGmNotificationAt < NO_GM_NOTIFICATION_COOLDOWN_MS) {
    return;
  }

  lastNoGmNotificationAt = now;
  ui.notifications.warn(
    game.i18n.localize("RUNYTH_TOKEN_ROTATION.InteractiveTile.Notifications.NoActiveGM")
  );
}

/**
 * Ask the active GM client to rotate an enabled Tile.
 *
 * Players intentionally do not receive generic Tile update permission. The
 * active GM validates the stored per-Tile flags and performs the document
 * update authoritatively.
 *
 * @param {foundry.documents.TileDocument} tileDocument Tile document.
 * @param {string} moduleId Module identifier.
 */
function requestPlayerTileRotation(tileDocument, moduleId) {
  const activeGm = game.users?.activeGM;

  if (!activeGm) {
    notifyNoActiveGm();
    return;
  }

  game.socket.emit(`module.${moduleId}`, {
    type: SOCKET_REQUEST_TYPE,
    sceneId: tileDocument.parent?.id ?? canvas.scene?.id,
    tileId: tileDocument.id,
    requesterId: game.user.id
  });
}

/**
 * Bind a single player-clickable Tile mesh.
 *
 * @param {foundry.canvas.placeables.Tile} tile Tile placeable.
 * @param {string} moduleId Module identifier.
 */
export function configureInteractiveTile(tile, moduleId) {
  const tileId = tile?.document?.id;

  if (!tileId) {
    return;
  }

  const existing = interactiveBindings.get(tileId);
  const shouldBind = shouldBindInteractiveTile(tile, moduleId);

  if (!shouldBind) {
    unbindInteractiveTile(tileId);
    return;
  }

  if (existing?.mesh === tile.mesh) {
    return;
  }

  unbindInteractiveTile(tileId);

  const mesh = tile.mesh;
  const downHandler = (event) => {
    if (isStandardLeftClick(event)) {
      event?.stopPropagation?.();
    }
  };
  const tapHandler = (event) => {
    if (!isStandardLeftClick(event)) {
      return;
    }

    const config = getTileInteractiveConfig(tile.document, moduleId);

    if (!config.enabled || tile.document.hidden === true) {
      return;
    }

    event?.stopPropagation?.();
    requestPlayerTileRotation(tile.document, moduleId);
  };

  interactiveBindings.set(tileId, {
    mesh,
    tapHandler,
    downHandler,
    eventMode: mesh.eventMode,
    cursor: mesh.cursor
  });

  mesh.eventMode = "static";
  mesh.cursor = "pointer";
  mesh.on?.("pointerdown", downHandler);
  mesh.on?.("pointertap", tapHandler);
}

/**
 * Synchronize click listeners for all Tiles in the viewed Scene.
 *
 * @param {string} moduleId Module identifier.
 */
export function refreshInteractiveTileBindings(moduleId) {
  if (!canvas.ready || !canvas.tiles) {
    return;
  }

  const currentIds = new Set();

  for (const tile of canvas.tiles.placeables ?? []) {
    const tileId = tile?.document?.id;

    if (tileId) {
      currentIds.add(tileId);
    }

    configureInteractiveTile(tile, moduleId);
  }

  for (const tileId of interactiveBindings.keys()) {
    if (!currentIds.has(tileId)) {
      unbindInteractiveTile(tileId);
    }
  }
}

/**
 * Tear down all interaction listeners owned by this module.
 */
export function clearInteractiveTileBindings() {
  for (const tileId of [...interactiveBindings.keys()]) {
    unbindInteractiveTile(tileId);
  }
}

/**
 * Resolve and validate a player socket request on the active GM client.
 *
 * The rotation amount and direction are always read from the authoritative
 * Tile document; neither value is trusted from the requesting client.
 *
 * @param {object} request Socket request.
 * @param {string} moduleId Module identifier.
 * @returns {Promise<void>}
 */
export async function handleInteractiveTileRotationRequest(request, moduleId) {
  if (!game.user?.isActiveGM || request?.type !== SOCKET_REQUEST_TYPE) {
    return;
  }

  if (
    typeof request.sceneId !== "string"
    || typeof request.tileId !== "string"
    || typeof request.requesterId !== "string"
  ) {
    return;
  }

  const requester = game.users.get(request.requesterId);

  if (!requester || !requester.active || requester.isGM || requester.isBanned) {
    return;
  }

  if (requester.viewedScene !== request.sceneId) {
    return;
  }

  const scene = game.scenes.get(request.sceneId);
  const tileDocument = scene?.tiles?.get(request.tileId);

  if (!scene || !tileDocument || tileDocument.hidden === true) {
    return;
  }

  const config = getTileInteractiveConfig(tileDocument, moduleId);

  if (!config.enabled) {
    return;
  }

  const delta = getInteractiveRotationDelta(config);
  const updates = buildRotationUpdates([tileDocument], delta);
  await scene.updateEmbeddedDocuments("Tile", updates);
}

/**
 * Register the module socket receiver.
 *
 * @param {string} moduleId Module identifier.
 */
export function registerInteractiveTileSocket(moduleId) {
  game.socket.on(`module.${moduleId}`, (request) => {
    if (!game.user?.isActiveGM || request?.type !== SOCKET_REQUEST_TYPE) {
      return;
    }

    socketOperationQueue = socketOperationQueue
      .then(() => handleInteractiveTileRotationRequest(request, moduleId))
      .catch((error) => {
        console.error(`${moduleId} | Interactive Tile rotation failed.`, error);
      });
  });
}

/**
 * Inject the per-Tile click rotation settings into the standard TileConfig.
 *
 * The inputs use Foundry's ordinary dotted flag field names so the TileConfig
 * form persists them together with the rest of the Tile update.
 *
 * @param {foundry.applications.sheets.TileConfig} app Tile config application.
 * @param {HTMLElement} element Pending application HTML.
 * @param {string} moduleId Module identifier.
 */
export function injectInteractiveTileConfig(app, element, moduleId) {
  if (app?.constructor?.name !== "TileConfig" || app.document?.documentName !== "Tile") {
    return;
  }

  const form = element?.matches?.("form")
    ? element
    : element?.querySelector?.("form") ?? app.form;

  if (!form || form.querySelector?.("[data-runyth-interactive-tile]")) {
    return;
  }

  const config = getTileInteractiveConfig(app.document, moduleId);
  const fieldset = document.createElement("fieldset");
  fieldset.dataset.runythInteractiveTile = "true";
  fieldset.className = "runyth-interactive-tile-config";

  const legend = document.createElement("legend");
  legend.textContent = game.i18n.localize("RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Legend");
  fieldset.append(legend);

  const enabledGroup = document.createElement("div");
  enabledGroup.className = "form-group";

  const enabledLabel = document.createElement("label");
  enabledLabel.textContent = game.i18n.localize("RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Enabled.Name");

  const enabledFields = document.createElement("div");
  enabledFields.className = "form-fields";

  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.name = `flags.${moduleId}.${FLAG_KEY}.enabled`;
  enabledInput.checked = config.enabled;
  enabledInput.dataset.dtype = "Boolean";
  enabledFields.append(enabledInput);
  enabledGroup.append(enabledLabel, enabledFields);

  const enabledHint = document.createElement("p");
  enabledHint.className = "hint";
  enabledHint.textContent = game.i18n.localize("RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Enabled.Hint");
  enabledGroup.append(enabledHint);
  fieldset.append(enabledGroup);

  const degreesGroup = document.createElement("div");
  degreesGroup.className = "form-group";

  const degreesLabel = document.createElement("label");
  degreesLabel.textContent = game.i18n.localize("RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Degrees.Name");

  const degreesFields = document.createElement("div");
  degreesFields.className = "form-fields";

  const degreesInput = document.createElement("input");
  degreesInput.type = "number";
  degreesInput.name = `flags.${moduleId}.${FLAG_KEY}.degrees`;
  degreesInput.value = String(config.degrees);
  degreesInput.min = "0.1";
  degreesInput.max = "360";
  degreesInput.step = "0.1";
  degreesFields.append(degreesInput);
  degreesGroup.append(degreesLabel, degreesFields);

  const degreesHint = document.createElement("p");
  degreesHint.className = "hint";
  degreesHint.textContent = game.i18n.localize("RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Degrees.Hint");
  degreesGroup.append(degreesHint);
  fieldset.append(degreesGroup);

  const directionGroup = document.createElement("div");
  directionGroup.className = "form-group";

  const directionLabel = document.createElement("label");
  directionLabel.textContent = game.i18n.localize("RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Direction.Name");

  const directionFields = document.createElement("div");
  directionFields.className = "form-fields";

  const directionSelect = document.createElement("select");
  directionSelect.name = `flags.${moduleId}.${FLAG_KEY}.direction`;

  for (const [value, key] of [
    ["clockwise", "RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Direction.Clockwise"],
    ["counterClockwise", "RUNYTH_TOKEN_ROTATION.InteractiveTile.Config.Direction.CounterClockwise"]
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = game.i18n.localize(key);
    option.selected = config.direction === value;
    directionSelect.append(option);
  }

  directionFields.append(directionSelect);
  directionGroup.append(directionLabel, directionFields);
  fieldset.append(directionGroup);

  const syncDisabledState = () => {
    degreesInput.disabled = !enabledInput.checked;
    directionSelect.disabled = !enabledInput.checked;
  };

  enabledInput.addEventListener("change", syncDisabledState);
  syncDisabledState();

  const appearanceTab = form.querySelector?.('[data-tab="appearance"]');
  const target = appearanceTab ?? form;
  const footer = target.querySelector?.("footer.form-footer, .form-footer");

  if (footer) {
    footer.before(fieldset);
  } else {
    target.append(fieldset);
  }
}
