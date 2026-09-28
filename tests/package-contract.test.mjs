import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

function flattenKeys(value, prefix = "") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nestedPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(nestedValue, nestedPrefix);
  });
}

test("manifest declares the v1.2.0 Foundry v13 module contract", async () => {
  const manifest = await readJson("../module.json");

  assert.equal(manifest.id, "runyth-token-rotation");
  assert.equal(manifest.version, "1.2.0");
  assert.equal(manifest.compatibility.minimum, "13");
  assert.equal(manifest.compatibility.verified, "13.351");
  assert.deepEqual(manifest.esmodules, ["scripts/main.js"]);
  assert.equal(manifest.socket, true);
  assert.deepEqual(manifest.styles, ["styles/interactive-tile.css"]);
});

test("English and German localization expose identical leaf keys", async () => {
  const english = await readJson("../lang/en.json");
  const german = await readJson("../lang/de.json");

  assert.deepEqual(
    flattenKeys(english).sort(),
    flattenKeys(german).sort()
  );
});
