const MODULE_ID = "runyth-token-rotation";
const SETTING_ROTATION_STEP = "rotationStep";

let operationQueue = Promise.resolve();

function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

function captureSelection() {
  const scene = canvas.scene;
  const controlled = canvas.tokens?.controlled ?? [];

  if (!scene || controlled.length === 0) {
    ui.notifications.warn(
      game.i18n.localize("RUNYTH_TOKEN_ROTATION.Notifications.NoSelection")
    );
    return null;
  }

  return {
    sceneId: scene.id,
    tokenIds: controlled.map((token) => token.document.id)
  };
}

function filterModifiableTokens(tokens) {
  return tokens.filter((token) => token.canUserModify(game.user, "update"));
}

function resolveSelection(sceneId, tokenIds) {
  const scene = game.scenes.get(sceneId);
  if (!scene) return null;

  return {
    scene,
    tokens: tokenIds
      .map((tokenId) => scene.tokens.get(tokenId))
      .filter((token) => token !== undefined)
  };
}

async function rotateTokens(sceneId, tokenIds, delta) {
  const resolved = resolveSelection(sceneId, tokenIds);
  if (!resolved) return;

  const { scene, tokens } = resolved;
  const modifiableTokens = filterModifiableTokens(tokens);

  if (modifiableTokens.length === 0) {
    ui.notifications.warn(
      game.i18n.localize("RUNYTH_TOKEN_ROTATION.Notifications.NoPermission")
    );
    return;
  }

  const updates = modifiableTokens.map((token) => ({
    _id: token.id,
    rotation: normalizeRotation(Number(token.rotation ?? 0) + delta)
  }));

  await scene.updateEmbeddedDocuments("Token", updates);
}

async function resetTokens(sceneId, tokenIds) {
  const resolved = resolveSelection(sceneId, tokenIds);
  if (!resolved) return;

  const { scene, tokens } = resolved;
  const modifiableTokens = filterModifiableTokens(tokens);
  const updates = modifiableTokens
    .filter((token) => normalizeRotation(Number(token.rotation ?? 0)) !== 0)
    .map((token) => ({ _id: token.id, rotation: 0 }));

  if (updates.length > 0) {
    await scene.updateEmbeddedDocuments("Token", updates);
  }
}

function enqueueOperation(operation) {
  const selection = captureSelection();
  if (!selection) return;

  operationQueue = operationQueue
    .then(() => operation(selection))
    .catch((error) => {
      console.error(`${MODULE_ID} | Token rotation failed.`, error);
      ui.notifications.error(
        game.i18n.localize("RUNYTH_TOKEN_ROTATION.Notifications.Error")
      );
    });
}

function getRotationStep() {
  return Number(game.settings.get(MODULE_ID, SETTING_ROTATION_STEP));
}

function rotateClockwise() {
  const delta = getRotationStep();
  enqueueOperation(({ sceneId, tokenIds }) => rotateTokens(sceneId, tokenIds, delta));
}

function rotateCounterClockwise() {
  const delta = -getRotationStep();
  enqueueOperation(({ sceneId, tokenIds }) => rotateTokens(sceneId, tokenIds, delta));
}

function resetRotation() {
  enqueueOperation(({ sceneId, tokenIds }) => resetTokens(sceneId, tokenIds));
}

Hooks.once("init", () => {
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
});

Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControl = controls.tokens;
  if (!tokenControl?.tools) return;

  let nextOrder = Math.max(
    0,
    ...Object.values(tokenControl.tools).map((tool) => Number(tool.order ?? 0))
  ) + 1;

  tokenControl.tools["runyth-rotate-counter-clockwise"] = {
    name: "runyth-rotate-counter-clockwise",
    title: "RUNYTH_TOKEN_ROTATION.Controls.CounterClockwise",
    icon: "fa-solid fa-rotate-left",
    order: nextOrder++,
    button: true,
    visible: true,
    onChange: rotateCounterClockwise
  };

  tokenControl.tools["runyth-reset-rotation"] = {
    name: "runyth-reset-rotation",
    title: "RUNYTH_TOKEN_ROTATION.Controls.Reset",
    icon: "fa-solid fa-arrow-up",
    order: nextOrder++,
    button: true,
    visible: true,
    onChange: resetRotation
  };

  tokenControl.tools["runyth-rotate-clockwise"] = {
    name: "runyth-rotate-clockwise",
    title: "RUNYTH_TOKEN_ROTATION.Controls.Clockwise",
    icon: "fa-solid fa-rotate-right",
    order: nextOrder,
    button: true,
    visible: true,
    onChange: rotateClockwise
  };
});
