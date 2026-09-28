/**
 * Runyth Token & Tile Rotation
 *
 * Foundry VTT v13 module entry point.
 *
 * Public API references:
 * - https://foundryvtt.com/api/v13/functions/hookEvents.getSceneControlButtons.html
 * - https://foundryvtt.com/api/v13/classes/foundry.canvas.Canvas.html
 * - https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.TokenData.html
 * - https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.TileData.html
 */

import {
  buildResetUpdates,
  buildRotationUpdates,
  sanitizeRotationStep
} from "./rotation-core.js";
import {
  clearInteractiveTileBindings,
  configureInteractiveTile,
  injectInteractiveTileConfig,
  refreshInteractiveTileBindings,
  registerInteractiveTileSocket
} from "./interactive-tile.js";

const MODULE_ID = "runyth-token-rotation";
const SETTING_ROTATION_STEP = "rotationStep";

const TARGETS = Object.freeze({
  token: Object.freeze({
    controlKey: "tokens",
    layerProperty: "tokens",
    sceneCollection: "tokens",
    documentName: "Token",
    noSelectionKey: "RUNYTH_TOKEN_ROTATION.Notifications.NoSelection.Token",
    noPermissionKey: "RUNYTH_TOKEN_ROTATION.Notifications.NoPermission.Token",
    counterClockwiseTitle: "RUNYTH_TOKEN_ROTATION.Controls.Token.CounterClockwise",
    resetTitle: "RUNYTH_TOKEN_ROTATION.Controls.Token.Reset",
    clockwiseTitle: "RUNYTH_TOKEN_ROTATION.Controls.Token.Clockwise"
  }),
  tile: Object.freeze({
    controlKey: "tiles",
    layerProperty: "tiles",
    sceneCollection: "tiles",
    documentName: "Tile",
    noSelectionKey: "RUNYTH_TOKEN_ROTATION.Notifications.NoSelection.Tile",
    noPermissionKey: "RUNYTH_TOKEN_ROTATION.Notifications.NoPermission.Tile",
    counterClockwiseTitle: "RUNYTH_TOKEN_ROTATION.Controls.Tile.CounterClockwise",
    resetTitle: "RUNYTH_TOKEN_ROTATION.Controls.Tile.Reset",
    clockwiseTitle: "RUNYTH_TOKEN_ROTATION.Controls.Tile.Clockwise"
  })
});

let operationQueue = Promise.resolve();

/**
 * Resolve target metadata or fail fast for a programming error.
 *
 * @param {"token"|"tile"} targetId Target identifier.
 * @returns {object} Target metadata.
 */
function getTarget(targetId) {
  const target = TARGETS[targetId];

  if (!target) {
    throw new Error(`Unknown rotation target: ${targetId}`);
  }

  return target;
}

/**
 * Get the configured canvas layer for a target.
 *
 * @param {"token"|"tile"} targetId Target identifier.
 * @returns {foundry.canvas.layers.PlaceablesLayer|null} Canvas layer.
 */
function getTargetLayer(targetId) {
  const target = getTarget(targetId);
  return canvas[target.layerProperty] ?? null;
}

/**
 * Capture the current Scene and controlled object IDs at command invocation.
 *
 * Capturing immediately prevents a queued rapid-click operation from acting
 * on a later selection after the user has already changed layers or objects.
 *
 * @param {"token"|"tile"} targetId Target identifier.
 * @returns {{targetId: "token"|"tile", sceneId: string, documentIds: string[]}|null}
 */
function captureSelection(targetId) {
  const target = getTarget(targetId);
  const scene = canvas.scene;
  const layer = getTargetLayer(targetId);
  const controlled = layer?.controlled ?? [];

  if (!scene || controlled.length === 0) {
    ui.notifications.warn(game.i18n.localize(target.noSelectionKey));
    return null;
  }

  const documentIds = controlled
    .map((object) => object.document?.id)
    .filter((id) => typeof id === "string" && id.length > 0);

  if (documentIds.length === 0) {
    ui.notifications.warn(game.i18n.localize(target.noSelectionKey));
    return null;
  }

  return {
    targetId,
    sceneId: scene.id,
    documentIds
  };
}

/**
 * Resolve a captured selection against the current document collections.
 *
 * @param {{targetId: "token"|"tile", sceneId: string, documentIds: string[]}} selection Captured selection.
 * @returns {{scene: foundry.documents.Scene, target: object, documents: foundry.abstract.Document[]}|null}
 */
function resolveSelection(selection) {
  const target = getTarget(selection.targetId);
  const scene = game.scenes.get(selection.sceneId);

  if (!scene) {
    return null;
  }

  const collection = scene[target.sceneCollection];

  if (!collection) {
    return null;
  }

  const documents = selection.documentIds
    .map((documentId) => collection.get(documentId))
    .filter((document) => document !== undefined);

  return {
    scene,
    target,
    documents
  };
}

/**
 * Restrict an operation to documents the current user may update.
 *
 * @param {foundry.abstract.Document[]} documents Documents to check.
 * @returns {foundry.abstract.Document[]} Modifiable documents.
 */
function filterModifiableDocuments(documents) {
  return documents.filter((document) => document.canUserModify(game.user, "update"));
}

/**
 * Report skipped documents without producing success-notification spam.
 *
 * @param {number} skippedCount Number of skipped documents.
 */
function notifySkippedDocuments(skippedCount) {
  if (skippedCount <= 0) {
    return;
  }

  ui.notifications.warn(
    game.i18n.format("RUNYTH_TOKEN_ROTATION.Notifications.Skipped", {
      count: skippedCount
    })
  );
}

/**
 * Apply an incremental rotation to a captured Token or Tile selection.
 *
 * A single Scene#updateEmbeddedDocuments operation is used for the whole
 * selection to minimize database traffic and keep the operation atomic from
 * the user's perspective.
 *
 * @param {{targetId: "token"|"tile", sceneId: string, documentIds: string[]}} selection Captured selection.
 * @param {number} delta Rotation delta in degrees.
 * @returns {Promise<void>}
 */
async function rotateSelection(selection, delta) {
  const resolved = resolveSelection(selection);

  if (!resolved) {
    return;
  }

  const { scene, target, documents } = resolved;
  const modifiableDocuments = filterModifiableDocuments(documents);

  if (modifiableDocuments.length === 0) {
    ui.notifications.warn(game.i18n.localize(target.noPermissionKey));
    return;
  }

  const updates = buildRotationUpdates(modifiableDocuments, delta);
  await scene.updateEmbeddedDocuments(target.documentName, updates);

  notifySkippedDocuments(documents.length - modifiableDocuments.length);
}

/**
 * Reset a captured Token or Tile selection to 0°.
 *
 * @param {{targetId: "token"|"tile", sceneId: string, documentIds: string[]}} selection Captured selection.
 * @returns {Promise<void>}
 */
async function resetSelection(selection) {
  const resolved = resolveSelection(selection);

  if (!resolved) {
    return;
  }

  const { scene, target, documents } = resolved;
  const modifiableDocuments = filterModifiableDocuments(documents);

  if (modifiableDocuments.length === 0) {
    ui.notifications.warn(game.i18n.localize(target.noPermissionKey));
    return;
  }

  const updates = buildResetUpdates(modifiableDocuments);

  if (updates.length > 0) {
    await scene.updateEmbeddedDocuments(target.documentName, updates);
  }

  notifySkippedDocuments(documents.length - modifiableDocuments.length);
}

/**
 * Serialize database-changing operations.
 *
 * Without this queue, rapid button presses could read the same old rotation
 * before an earlier update finishes, causing increments to be lost.
 *
 * @param {() => Promise<void>} operation Async operation.
 */
function enqueueOperation(operation) {
  operationQueue = operationQueue
    .then(operation)
    .catch((error) => {
      console.error(`${MODULE_ID} | Rotation operation failed.`, error);
      ui.notifications.error(
        game.i18n.localize("RUNYTH_TOKEN_ROTATION.Notifications.Error")
      );
    });
}

/**
 * Read and defensively sanitize the user's shared Token/Tile rotation step.
 *
 * @returns {number} Rotation step in degrees.
 */
function getRotationStep() {
  return sanitizeRotationStep(
    game.settings.get(MODULE_ID, SETTING_ROTATION_STEP),
    15
  );
}

/**
 * Queue a clockwise or counter-clockwise target rotation.
 *
 * @param {"token"|"tile"} targetId Target identifier.
 * @param {1|-1} direction Direction multiplier.
 */
function rotateTarget(targetId, direction) {
  const selection = captureSelection(targetId);

  if (!selection) {
    return;
  }

  const delta = getRotationStep() * direction;
  enqueueOperation(() => rotateSelection(selection, delta));
}

/**
 * Queue a reset for the specified target.
 *
 * @param {"token"|"tile"} targetId Target identifier.
 */
function resetTarget(targetId) {
  const selection = captureSelection(targetId);

  if (!selection) {
    return;
  }

  enqueueOperation(() => resetSelection(selection));
}

/**
 * Determine which supported placeables layer is currently active.
 *
 * @returns {"token"|"tile"|null} Active supported target.
 */
function getActiveTargetId() {
  if (canvas.activeLayer === getTargetLayer("token")) {
    return "token";
  }

  if (canvas.activeLayer === getTargetLayer("tile")) {
    return "tile";
  }

  return null;
}

/**
 * Run a keybinding action against the active Token or Tile layer.
 *
 * @param {"counterClockwise"|"clockwise"|"reset"} action Action identifier.
 * @returns {boolean} Whether the keybinding was handled.
 */
function handleActiveLayerKeybinding(action) {
  const targetId = getActiveTargetId();

  if (!targetId) {
    ui.notifications.warn(
      game.i18n.localize("RUNYTH_TOKEN_ROTATION.Notifications.UnsupportedLayer")
    );
    return false;
  }

  if (action === "counterClockwise") {
    rotateTarget(targetId, -1);
  } else if (action === "clockwise") {
    rotateTarget(targetId, 1);
  } else {
    resetTarget(targetId);
  }

  return true;
}

/**
 * Register the per-user rotation step.
 *
 * The setting ID is intentionally unchanged from v1.0.0 so upgrades preserve
 * existing user preferences. In v1.1.0 the same step applies to both Tokens
 * and Tiles.
 */
function registerSettings() {
  game.settings.register(MODULE_ID, SETTING_ROTATION_STEP, {
    name: "RUNYTH_TOKEN_ROTATION.Settings.RotationStep.Name",
    hint: "RUNYTH_TOKEN_ROTATION.Settings.RotationStep.Hint",
    scope: "user",
    config: true,
    type: new foundry.fields.NumberField({
      nullable: false,
      integer: false,
      min: 1,
      max: 180,
      step: 1
    }),
    default: 15
  });
}

/**
 * Register configurable keybindings.
 *
 * The v1.0.0 keybinding IDs are retained for compatibility. Their behavior is
 * now target-aware: they operate on whichever of the Token or Tile layers is
 * active.
 */
function registerKeybindings() {
  game.keybindings.register(MODULE_ID, "rotateCounterClockwise", {
    name: "RUNYTH_TOKEN_ROTATION.Keybindings.CounterClockwise.Name",
    hint: "RUNYTH_TOKEN_ROTATION.Keybindings.CounterClockwise.Hint",
    editable: [],
    restricted: false,
    repeat: false,
    onDown: () => handleActiveLayerKeybinding("counterClockwise")
  });

  game.keybindings.register(MODULE_ID, "rotateClockwise", {
    name: "RUNYTH_TOKEN_ROTATION.Keybindings.Clockwise.Name",
    hint: "RUNYTH_TOKEN_ROTATION.Keybindings.Clockwise.Hint",
    editable: [],
    restricted: false,
    repeat: false,
    onDown: () => handleActiveLayerKeybinding("clockwise")
  });

  game.keybindings.register(MODULE_ID, "resetRotation", {
    name: "RUNYTH_TOKEN_ROTATION.Keybindings.Reset.Name",
    hint: "RUNYTH_TOKEN_ROTATION.Keybindings.Reset.Hint",
    editable: [],
    restricted: false,
    repeat: false,
    onDown: () => handleActiveLayerKeybinding("reset")
  });
}

/**
 * Find the next tool order within a Scene Control group.
 *
 * @param {Record<string, foundry.SceneControlTool>} tools Existing tools.
 * @returns {number} Next order value.
 */
function getNextToolOrder(tools) {
  return Math.max(
    0,
    ...Object.values(tools).map((tool) => Number(tool.order ?? 0))
  ) + 1;
}

/**
 * Add the same rotation tool set to one Scene Control group.
 *
 * @param {foundry.SceneControl|undefined} control Scene Control group.
 * @param {"token"|"tile"} targetId Target identifier.
 */
function addRotationTools(control, targetId) {
  if (!control?.tools) {
    return;
  }

  const target = getTarget(targetId);
  let nextOrder = getNextToolOrder(control.tools);

  control.tools["runyth-rotate-counter-clockwise"] = {
    name: "runyth-rotate-counter-clockwise",
    title: target.counterClockwiseTitle,
    icon: "fa-solid fa-rotate-left",
    order: nextOrder++,
    button: true,
    visible: true,
    onChange: () => rotateTarget(targetId, -1)
  };

  control.tools["runyth-reset-rotation"] = {
    name: "runyth-reset-rotation",
    title: target.resetTitle,
    icon: "fa-solid fa-arrow-up",
    order: nextOrder++,
    button: true,
    visible: true,
    onChange: () => resetTarget(targetId)
  };

  control.tools["runyth-rotate-clockwise"] = {
    name: "runyth-rotate-clockwise",
    title: target.clockwiseTitle,
    icon: "fa-solid fa-rotate-right",
    order: nextOrder,
    button: true,
    visible: true,
    onChange: () => rotateTarget(targetId, 1)
  };
}

Hooks.once("init", () => {
  registerSettings();
  registerKeybindings();
});

Hooks.on("getSceneControlButtons", (controls) => {
  addRotationTools(controls.tokens, "token");
  addRotationTools(controls.tiles, "tile");
});

Hooks.once("ready", () => {
  registerInteractiveTileSocket(MODULE_ID);
});

Hooks.on("renderTileConfig", (app, element) => {
  injectInteractiveTileConfig(app, element, MODULE_ID);
});

Hooks.on("canvasReady", () => {
  refreshInteractiveTileBindings(MODULE_ID);
});

Hooks.on("canvasTearDown", () => {
  clearInteractiveTileBindings();
});

Hooks.on("drawTile", (tile) => {
  configureInteractiveTile(tile, MODULE_ID);
});

Hooks.on("refreshTile", (tile) => {
  configureInteractiveTile(tile, MODULE_ID);
});

Hooks.on("destroyTile", (tile) => {
  if (tile?.document?.id) {
    queueMicrotask(() => refreshInteractiveTileBindings(MODULE_ID));
  }
});

Hooks.on("updateTile", () => {
  queueMicrotask(() => refreshInteractiveTileBindings(MODULE_ID));
});
