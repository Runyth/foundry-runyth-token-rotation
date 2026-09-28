import assert from "node:assert/strict";
import test from "node:test";

import { handleInteractiveTileRotationRequest } from "../scripts/interactive-tile.js";

const MODULE_ID = "runyth-token-rotation";

function createEnvironment({
  rotation = 350,
  enabled = true,
  degrees = 15,
  direction = "clockwise",
  hidden = false
} = {}) {
  const updates = [];
  const tileDocument = {
    id: "tile-1",
    rotation,
    hidden,
    getFlag(namespace, key) {
      assert.equal(namespace, MODULE_ID);
      assert.equal(key, "interactiveRotation");
      return { enabled, degrees, direction };
    }
  };
  const scene = {
    id: "scene-1",
    tiles: new Map([[tileDocument.id, tileDocument]]),
    async updateEmbeddedDocuments(documentName, payload) {
      updates.push({ documentName, payload });
    }
  };
  const requester = {
    id: "player-1",
    active: true,
    isGM: false,
    viewedScene: scene.id
  };

  globalThis.game = {
    user: { isActiveGM: true },
    users: new Map([[requester.id, requester]]),
    scenes: new Map([[scene.id, scene]])
  };

  return { updates };
}

test("active GM applies the authoritative per-Tile clockwise configuration", async () => {
  const { updates } = createEnvironment();

  await handleInteractiveTileRotationRequest({
    type: "interactiveTileRotationRequest",
    sceneId: "scene-1",
    tileId: "tile-1",
    requesterId: "player-1",
    degrees: 300,
    direction: "counterClockwise"
  }, MODULE_ID);

  assert.deepEqual(updates, [{
    documentName: "Tile",
    payload: [{ _id: "tile-1", rotation: 5 }]
  }]);
});

test("active GM applies the authoritative counter-clockwise configuration", async () => {
  const { updates } = createEnvironment({
    rotation: 10,
    degrees: 22.5,
    direction: "counterClockwise"
  });

  await handleInteractiveTileRotationRequest({
    type: "interactiveTileRotationRequest",
    sceneId: "scene-1",
    tileId: "tile-1",
    requesterId: "player-1"
  }, MODULE_ID);

  assert.deepEqual(updates[0].payload, [{ _id: "tile-1", rotation: 347.5 }]);
});

test("disabled or hidden Tiles reject player socket requests", async () => {
  let environment = createEnvironment({ enabled: false });
  await handleInteractiveTileRotationRequest({
    type: "interactiveTileRotationRequest",
    sceneId: "scene-1",
    tileId: "tile-1",
    requesterId: "player-1"
  }, MODULE_ID);
  assert.equal(environment.updates.length, 0);

  environment = createEnvironment({ hidden: true });
  await handleInteractiveTileRotationRequest({
    type: "interactiveTileRotationRequest",
    sceneId: "scene-1",
    tileId: "tile-1",
    requesterId: "player-1"
  }, MODULE_ID);
  assert.equal(environment.updates.length, 0);
});
