// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildResetUpdates,
  buildRotationUpdates,
  normalizeRotation,
  sanitizeRotationStep
} from "../scripts/rotation-core.js";

test("normalizeRotation keeps angles in [0, 360)", () => {
  assert.equal(normalizeRotation(0), 0);
  assert.equal(normalizeRotation(360), 0);
  assert.equal(normalizeRotation(375), 15);
  assert.equal(normalizeRotation(-15), 345);
  assert.equal(normalizeRotation(720 + 45), 45);
});

test("normalizeRotation safely handles non-finite input", () => {
  assert.equal(normalizeRotation(Number.NaN), 0);
  assert.equal(normalizeRotation(Number.POSITIVE_INFINITY), 0);
});

test("sanitizeRotationStep preserves valid values and clamps bounds", () => {
  assert.equal(sanitizeRotationStep(15), 15);
  assert.equal(sanitizeRotationStep(0), 1);
  assert.equal(sanitizeRotationStep(181), 180);
  assert.equal(sanitizeRotationStep("22.5"), 22.5);
  assert.equal(sanitizeRotationStep("invalid"), 15);
});

test("buildRotationUpdates rotates multiple documents clockwise", () => {
  const updates = buildRotationUpdates(
    [
      { id: "token-a", rotation: 0 },
      { id: "token-b", rotation: 350 }
    ],
    15
  );

  assert.deepEqual(updates, [
    { _id: "token-a", rotation: 15 },
    { _id: "token-b", rotation: 5 }
  ]);
});

test("buildRotationUpdates rotates Tiles counter-clockwise with the same math", () => {
  const updates = buildRotationUpdates(
    [
      { id: "tile-a", rotation: 10 },
      { id: "tile-b", rotation: 0 }
    ],
    -15
  );

  assert.deepEqual(updates, [
    { _id: "tile-a", rotation: 355 },
    { _id: "tile-b", rotation: 345 }
  ]);
});

test("buildRotationUpdates rejects an invalid delta", () => {
  assert.throws(
    () => buildRotationUpdates([{ id: "a", rotation: 0 }], Number.NaN),
    /finite/
  );
});

test("buildResetUpdates excludes documents already at zero", () => {
  const updates = buildResetUpdates([
    { id: "a", rotation: 0 },
    { id: "b", rotation: 360 },
    { id: "c", rotation: 15 },
    { id: "d", rotation: -15 }
  ]);

  assert.deepEqual(updates, [
    { _id: "c", rotation: 0 },
    { _id: "d", rotation: 0 }
  ]);
});
