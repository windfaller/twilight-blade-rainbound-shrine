import { describe, expect, it } from "vitest";
import { bakeNav, findPath, isWalkablePoint, nearestWalkable } from "../game/systems/navigation";
import { PILLARS } from "../game/data/stages";

describe("navigation", () => {
  it("spawn and altar are walkable, pillars are not", () => {
    expect(isWalkablePoint(0, 2, false, false)).toBe(true);
    expect(isWalkablePoint(0, 56, false, false)).toBe(true);
    expect(isWalkablePoint(PILLARS[0].x, PILLARS[0].z, false, false)).toBe(false);
  });

  it("finds a path from spawn toward the keeper without insane detours", () => {
    const grid = bakeNav(false, false);
    const path = findPath(grid, 0, 2, 2.15, 33.4);
    expect(path.length).toBeGreaterThan(3);
    expect(path.length).toBeLessThan(80);
    const end = path[path.length - 1];
    expect(Math.hypot(end.x - 2.15, end.z - 33.4)).toBeLessThan(1.6);
  });

  it("sealed gate blocks the hall until opened", () => {
    expect(isWalkablePoint(0, 94, false, false)).toBe(false);
    expect(isWalkablePoint(0, 94, true, false)).toBe(true);
  });

  it("phase-2 crater is not walkable", () => {
    expect(isWalkablePoint(0, 107, true, true)).toBe(false);
    const snapped = nearestWalkable(bakeNav(true, true), 0, 107);
    expect(Math.abs(snapped.x) > 2 || snapped.z < 102 || snapped.z > 112).toBe(true);
  });
});
