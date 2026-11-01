// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
/**
 * Pure helpers for per-Tile player click rotation.
 */

export const INTERACTIVE_TILE_DEFAULTS = Object.freeze({
  enabled: false,
  degrees: 15,
  direction: "clockwise"
});

/**
 * Sanitize an arbitrary per-Tile rotation increment.
 *
 * @param {unknown} value Configured degree amount.
 * @param {number} fallback Fallback amount.
 * @returns {number} A finite amount between 0.1° and 360°.
 */
export function sanitizeInteractiveDegrees(value, fallback = INTERACTIVE_TILE_DEFAULTS.degrees) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(360, Math.max(0.1, numericValue));
}

/**
 * Sanitize the configured direction.
 *
 * @param {unknown} value Configured direction.
 * @returns {"clockwise"|"counterClockwise"} Supported direction.
 */
export function sanitizeInteractiveDirection(value) {
  return value === "counterClockwise" ? "counterClockwise" : "clockwise";
}

/**
 * Normalize raw module flags into a stable interaction configuration.
 *
 * @param {unknown} value Raw per-Tile flag value.
 * @returns {{enabled: boolean, degrees: number, direction: "clockwise"|"counterClockwise"}}
 */
export function normalizeInteractiveTileConfig(value) {
  const raw = value && typeof value === "object" ? value : {};

  return {
    enabled: raw.enabled === true,
    degrees: sanitizeInteractiveDegrees(raw.degrees),
    direction: sanitizeInteractiveDirection(raw.direction)
  };
}

/**
 * Convert an interaction configuration into a signed rotation delta.
 *
 * @param {unknown} value Raw or normalized interaction configuration.
 * @returns {number} Signed rotation delta in degrees.
 */
export function getInteractiveRotationDelta(value) {
  const config = normalizeInteractiveTileConfig(value);
  return config.direction === "counterClockwise"
    ? -config.degrees
    : config.degrees;
}

/**
 * Identify an unmodified primary-button pointer click.
 *
 * @param {object} event PIXI federated pointer event or a compatible test object.
 * @returns {boolean} Whether the event is a standard left click.
 */
export function isStandardLeftClick(event) {
  const nativeEvent = event?.nativeEvent ?? event?.originalEvent ?? event;
  const button = Number(event?.button ?? nativeEvent?.button ?? 0);

  if (button !== 0) {
    return false;
  }

  return !(
    event?.shiftKey
    || event?.ctrlKey
    || event?.altKey
    || event?.metaKey
    || nativeEvent?.shiftKey
    || nativeEvent?.ctrlKey
    || nativeEvent?.altKey
    || nativeEvent?.metaKey
  );
}
