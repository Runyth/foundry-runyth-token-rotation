import assert from "node:assert/strict";
import test from "node:test";

import {
  getInteractiveRotationDelta,
  isStandardLeftClick,
  normalizeInteractiveTileConfig,
  sanitizeInteractiveDegrees,
  sanitizeInteractiveDirection
} from "../scripts/interactive-tile-core.js";

test("interactive Tile config defaults to disabled 15° clockwise", () => {
  assert.deepEqual(normalizeInteractiveTileConfig(undefined), {
    enabled: false,
    degrees: 15,
    direction: "clockwise"
  });
});

test("interactive Tile degrees support decimal arbitrary values and clamp safely", () => {
  assert.equal(sanitizeInteractiveDegrees(22.5), 22.5);
  assert.equal(sanitizeInteractiveDegrees("7.25"), 7.25);
  assert.equal(sanitizeInteractiveDegrees(0), 0.1);
  assert.equal(sanitizeInteractiveDegrees(999), 360);
  assert.equal(sanitizeInteractiveDegrees("invalid"), 15);
});

test("interactive Tile direction only accepts the supported counter-clockwise sentinel", () => {
  assert.equal(sanitizeInteractiveDirection("counterClockwise"), "counterClockwise");
  assert.equal(sanitizeInteractiveDirection("clockwise"), "clockwise");
  assert.equal(sanitizeInteractiveDirection("anything-else"), "clockwise");
});

test("interactive Tile delta respects clockwise and counter-clockwise direction", () => {
  assert.equal(getInteractiveRotationDelta({ enabled: true, degrees: 15, direction: "clockwise" }), 15);
  assert.equal(getInteractiveRotationDelta({ enabled: true, degrees: 22.5, direction: "counterClockwise" }), -22.5);
});

test("only an unmodified primary-button click is accepted", () => {
  assert.equal(isStandardLeftClick({ button: 0 }), true);
  assert.equal(isStandardLeftClick({ button: 1 }), false);
  assert.equal(isStandardLeftClick({ button: 0, shiftKey: true }), false);
  assert.equal(isStandardLeftClick({ nativeEvent: { button: 0, ctrlKey: true } }), false);
});
