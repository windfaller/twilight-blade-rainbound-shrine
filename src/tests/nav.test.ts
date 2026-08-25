import { describe, expect, it } from "vitest";
import { bakeNav, findPath, isWalkablePoint, nearestWalkable } from "../game/systems/navigation";
import { PILLARS, SPAWN, STAIR_STEPS, groundHeight } from "../game/data/stages";

describe("navigation", () => {
  it("spawn and altar are walkable, pillars are not", () => {
    expect(isWalkablePoint(SPAWN.x, SPAWN.z, false, false)).toBe(true);
    expect(isWalkablePoint(0, 56, false, false)).toBe(true);
    expect(isWalkablePoint(PILLARS[0].x, PILLARS[0].z, false, false)).toBe(false);
  });

  it("finds a path from spawn toward the keeper without insane detours", () => {
    const grid = bakeNav(false, false);
    const path = findPath(grid, SPAWN.x, SPAWN.z, 2.15, 33.4);
    expect(path.length).toBeGreaterThan(3);
    expect(path.length).toBeLessThan(80);
    const end = path[path.length - 1];
    expect(Math.hypot(end.x - 2.15, end.z - 33.4)).toBeLessThan(1.6);
  });

  it("sealed gate blocks the hall until opened", () => {
    expect(isWalkablePoint(0, 94, false, false)).toBe(false);
    expect(isWalkablePoint(0, 94, true, false)).toBe(true);
  });

  it("stair collision uses many shallow treads, not 10 giant boxes", () => {
    expect(STAIR_STEPS).toBeGreaterThanOrEqual(20);
    expect(groundHeight(0, 8.2)).toBe(0);
    expect(groundHeight(0, 12)).toBeGreaterThan(0);
    expect(groundHeight(0, 12)).toBeLessThan(2);
    const a = groundHeight(0, 12.1);
    const b = groundHeight(0, 12.9);
    expect(b - a).toBeLessThan(0.4);
  });

  it("phase-2 crater is not walkable", () => {
    expect(isWalkablePoint(0, 107, true, true)).toBe(false);
    const snapped = nearestWalkable(bakeNav(true, true), 0, 107);
    expect(Math.abs(snapped.x) > 2 || snapped.z < 102 || snapped.z > 112).toBe(true);
  });
});
