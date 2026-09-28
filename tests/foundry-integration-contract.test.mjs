import assert from "node:assert/strict";
import test from "node:test";

const hookCallbacks = new Map();
const settingRegistrations = [];
const keybindingRegistrations = [];

class NumberField {
  constructor(options) {
    this.options = options;
  }
}

globalThis.Hooks = {
  once(name, callback) {
    hookCallbacks.set(name, callback);
  },
  on(name, callback) {
    hookCallbacks.set(name, callback);
  }
};

globalThis.game = {
  settings: {
    register(namespace, key, data) {
      settingRegistrations.push({ namespace, key, data });
    }
  },
  keybindings: {
    register(namespace, key, data) {
      keybindingRegistrations.push({ namespace, key, data });
    }
  }
};

globalThis.foundry = {
  fields: {
    NumberField
  }
};

await import("../scripts/main.js");

test("init retains the rotationStep setting and three keybinding IDs", () => {
  const init = hookCallbacks.get("init");
  assert.equal(typeof init, "function");

  init();

  assert.equal(settingRegistrations.length, 1);
  assert.equal(settingRegistrations[0].namespace, "runyth-token-rotation");
  assert.equal(settingRegistrations[0].key, "rotationStep");
  assert.equal(settingRegistrations[0].data.scope, "user");
  assert.equal(settingRegistrations[0].data.default, 15);

  assert.deepEqual(
    keybindingRegistrations.map(({ key }) => key).sort(),
    ["resetRotation", "rotateClockwise", "rotateCounterClockwise"].sort()
  );
});

test("Scene Controls receive matching Token and Tile rotation actions", () => {
  const getSceneControlButtons = hookCallbacks.get("getSceneControlButtons");
  assert.equal(typeof getSceneControlButtons, "function");

  const controls = {
    tokens: {
      tools: {
        select: {
          order: 1
        }
      }
    },
    tiles: {
      tools: {
        select: {
          order: 1
        }
      }
    }
  };

  getSceneControlButtons(controls);

  const expectedTools = [
    "runyth-reset-rotation",
    "runyth-rotate-clockwise",
    "runyth-rotate-counter-clockwise"
  ];

  const tokenTools = Object.keys(controls.tokens.tools)
    .filter((name) => name.startsWith("runyth-"))
    .sort();
  const tileTools = Object.keys(controls.tiles.tools)
    .filter((name) => name.startsWith("runyth-"))
    .sort();

  assert.deepEqual(tokenTools, expectedTools);
  assert.deepEqual(tileTools, expectedTools);
  assert.equal(controls.tokens.tools["runyth-rotate-clockwise"].button, true);
  assert.equal(controls.tiles.tools["runyth-rotate-clockwise"].button, true);
});

test("interactive Tile hooks are registered without changing existing control IDs", () => {
  for (const hookName of [
    "ready",
    "renderTileConfig",
    "canvasReady",
    "canvasTearDown",
    "drawTile",
    "refreshTile",
    "destroyTile",
    "updateTile"
  ]) {
    assert.equal(typeof hookCallbacks.get(hookName), "function", `${hookName} should be registered`);
  }
});
