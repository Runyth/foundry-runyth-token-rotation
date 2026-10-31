// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
/**
 * Pure rotation helpers shared by the Foundry integration and unit tests.
 */

/**
 * Normalize an angle into the inclusive/exclusive range [0, 360).
 *
 * @param {number} rotation Rotation in degrees.
 * @returns {number} Normalized rotation in degrees.
 */
export function normalizeRotation(rotation) {
  const numericRotation = Number(rotation);

  if (!Number.isFinite(numericRotation)) {
    return 0;
  }

  return ((numericRotation % 360) + 360) % 360;
}

/**
 * Sanitize a configured rotation step.
 *
 * @param {number} value Configured step in degrees.
 * @param {number} fallback Fallback step when the value is invalid.
 * @returns {number} A finite step between 1 and 180 degrees.
 */
export function sanitizeRotationStep(value, fallback = 15) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(180, Math.max(1, numericValue));
}

/**
 * Build a single batch of embedded-document rotation updates.
 *
 * @param {Array<{id: string, rotation?: number}>} documents Documents to rotate.
 * @param {number} delta Rotation delta in degrees.
 * @returns {Array<{_id: string, rotation: number}>} Foundry update payloads.
 */
export function buildRotationUpdates(documents, delta) {
  const numericDelta = Number(delta);

  if (!Number.isFinite(numericDelta)) {
    throw new TypeError("Rotation delta must be finite.");
  }

  return documents.map((document) => ({
    _id: document.id,
    rotation: normalizeRotation(Number(document.rotation ?? 0) + numericDelta)
  }));
}

/**
 * Build reset updates while avoiding unnecessary writes for objects at 0°.
 *
 * @param {Array<{id: string, rotation?: number}>} documents Documents to reset.
 * @returns {Array<{_id: string, rotation: number}>} Foundry update payloads.
 */
export function buildResetUpdates(documents) {
  return documents
    .filter((document) => normalizeRotation(document.rotation ?? 0) !== 0)
    .map((document) => ({
      _id: document.id,
      rotation: 0
    }));
}
