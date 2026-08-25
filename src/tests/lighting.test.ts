import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { rainStreakCount } from "../rendering/environment";
import { MAX_LANTERN_LIGHTS, addLanternLight, bakeNightEnv, createLighting, lanternWarmth } from "../rendering/lighting";
import { wetStoneMat } from "../rendering/wetstone";

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
    expect(rainStreakCount("med")).toBeLessThanOrEqual(80);
    expect(rainStreakCount("high")).toBeLessThanOrEqual(120);
  });

  it("warms the follow rim when standing next to a lantern", () => {
    const scene = new THREE.Scene();
    const rig = createLighting(scene, "med");
    addLanternLight(scene, rig, 0, 0, 8, "med");
    expect(lanternWarmth(rig.lanterns, 0, 8)).toBeGreaterThan(0.7);
    expect(lanternWarmth(rig.lanterns, 20, 40)).toBeLessThan(0.1);
  });
});
