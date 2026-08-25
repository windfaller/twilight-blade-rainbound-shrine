import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { MAX_LANTERN_LIGHTS, addLanternLight, bakeNightEnv, createLighting } from "../rendering/lighting";
import { rainStreakCount } from "../rendering/environment";
import { wetStoneMat } from "../rendering/wetstone";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

describe("lighting hotfix", () => {
  it("caps lantern point lights and always keeps hemi + ambient", () => {
    const scene = new THREE.Scene();
    const rig = createLighting(scene, "high");
    expect(scene.environment).toBeNull();
    expect(rig.ambient.intensity).toBeGreaterThanOrEqual(0.85);
    expect(rig.fill.intensity).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < 20; i++) addLanternLight(scene, rig, i, 0, i, "high");
    expect(MAX_LANTERN_LIGHTS).toBeLessThanOrEqual(5);
    expect(rig.lanterns.length).toBe(MAX_LANTERN_LIGHTS);
    const points = scene.children.filter((c) => c instanceof THREE.PointLight);
    expect(points.length).toBeLessThanOrEqual(MAX_LANTERN_LIGHTS + 1);
    bakeNightEnv(null as unknown as THREE.WebGLRenderer, scene);
    expect(scene.environment).toBeNull();
  });

  it("wet stone factory is Standard, not Physical", () => {
    expect(wetStoneMat.toString()).toContain("MeshStandardMaterial");
    expect(wetStoneMat.toString()).not.toContain("MeshPhysicalMaterial");
  });

  it("keeps near-camera rain sparse so it cannot form a wireframe grid", () => {
    expect(rainStreakCount("med")).toBeLessThanOrEqual(100);
    expect(rainStreakCount("high")).toBeLessThanOrEqual(160);
  });

  it("does not use a repeating-gradient rain overlay", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../index.css");
    const css = readFileSync(root, "utf8");
    expect(css).not.toMatch(/tb-rain/);
    expect(css).not.toMatch(/repeating-linear-gradient/);
  });
});
