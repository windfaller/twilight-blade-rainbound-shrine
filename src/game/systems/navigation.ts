import { dist2, norm2 } from "../math";
import { KEEPER_ANCHOR, MAP_BOUNDS, OBSTACLES, PILLARS, WALK_POLYS, groundHeight } from "../data/stages";
import type { InteractionAnchor, WalkPoly } from "../types";

const CELL = 0.55;

export interface NavGrid {
  originX: number;
  originZ: number;
  cols: number;
  rows: number;
  walk: Uint8Array;
}

function pointInPoly(x: number, z: number, poly: WalkPoly): boolean {
  let inside = false;
  const pts = poly.points;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const zi = pts[i].z;
    const xj = pts[j].x;
    const zj = pts[j].z;
    const inter = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-9) + xi;
    if (inter) inside = !inside;
  }
  return inside;
}

export function isWalkablePoint(x: number, z: number, gateOpen: boolean, arenaBroken: boolean): boolean {
  if (z > 91 && z < 97 && !gateOpen) return false;
  if (arenaBroken && z > 102 && z < 112 && Math.abs(x) < 2.4) {
    return false;
  }
  let inPoly = false;
  for (const p of WALK_POLYS) {
    if (pointInPoly(x, z, p)) {
      inPoly = true;
      break;
    }
  }
  if (!inPoly) return false;
  for (const p of PILLARS) {
    if (dist2(x, z, p.x, p.z) < p.r + 0.42) return false;
  }
  for (const o of OBSTACLES) {
    if (o.kind === "pillar") continue;
    if (dist2(x, z, o.x, o.z) < o.r + 0.28) return false;
  }
  return true;
}

export function bakeNav(gateOpen: boolean, arenaBroken: boolean): NavGrid {
  const cols = Math.ceil((MAP_BOUNDS.maxX - MAP_BOUNDS.minX) / CELL);
  const rows = Math.ceil((MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ) / CELL);
  const walk = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = MAP_BOUNDS.minX + (c + 0.5) * CELL;
      const z = MAP_BOUNDS.minZ + (r + 0.5) * CELL;
      walk[r * cols + c] = isWalkablePoint(x, z, gateOpen, arenaBroken) ? 1 : 0;
    }
  }
  return { originX: MAP_BOUNDS.minX, originZ: MAP_BOUNDS.minZ, cols, rows, walk };
}

function idx(grid: NavGrid, c: number, r: number): number {
  return r * grid.cols + c;
}

function worldToCell(grid: NavGrid, x: number, z: number): { c: number; r: number } {
  return {
    c: Math.max(0, Math.min(grid.cols - 1, Math.floor((x - grid.originX) / CELL))),
    r: Math.max(0, Math.min(grid.rows - 1, Math.floor((z - grid.originZ) / CELL))),
  };
}

function cellToWorld(grid: NavGrid, c: number, r: number): { x: number; z: number } {
  return {
    x: grid.originX + (c + 0.5) * CELL,
    z: grid.originZ + (r + 0.5) * CELL,
  };
}

export function nearestWalkable(
  grid: NavGrid,
  x: number,
  z: number,
): { x: number; z: number } {
  const start = worldToCell(grid, x, z);
  if (grid.walk[idx(grid, start.c, start.r)]) return { x, z };
  for (let rad = 1; rad <= 14; rad++) {
    for (let dc = -rad; dc <= rad; dc++) {
      for (let dr = -rad; dr <= rad; dr++) {
        if (Math.abs(dc) !== rad && Math.abs(dr) !== rad) continue;
        const c = start.c + dc;
        const r = start.r + dr;
        if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) continue;
        if (grid.walk[idx(grid, c, r)]) return cellToWorld(grid, c, r);
      }
    }
  }
  return { x, z };
}

export function findPath(
  grid: NavGrid,
  sx: number,
  sz: number,
  tx: number,
  tz: number,
): { x: number; z: number }[] {
  const a = worldToCell(grid, sx, sz);
  const goalWorld = nearestWalkable(grid, tx, tz);
  const b = worldToCell(grid, goalWorld.x, goalWorld.z);
  if (!grid.walk[idx(grid, a.c, a.r)] || !grid.walk[idx(grid, b.c, b.r)]) return [];

  const open: number[] = [];
  const came = new Int32Array(grid.walk.length).fill(-1);
  const gScore = new Float32Array(grid.walk.length).fill(1e9);
  const startI = idx(grid, a.c, a.r);
  const goalI = idx(grid, b.c, b.r);
  gScore[startI] = 0;
  open.push(startI);

  const nbrs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, 1.41],
    [1, -1, 1.41],
    [-1, 1, 1.41],
    [-1, -1, 1.41],
  ];

  while (open.length) {
    let bi = 0;
    let best = 1e9;
    for (let i = 0; i < open.length; i++) {
      const id = open[i];
      const cc = id % grid.cols;
      const rr = (id / grid.cols) | 0;
      const f = gScore[id] + Math.hypot(cc - b.c, rr - b.r);
      if (f < best) {
        best = f;
        bi = i;
      }
    }
    const cur = open.splice(bi, 1)[0];
    if (cur === goalI) break;
    const cc = cur % grid.cols;
    const rr = (cur / grid.cols) | 0;
    for (const [dc, dr, cost] of nbrs) {
      const nc = cc + dc;
      const nr = rr + dr;
      if (nc < 0 || nr < 0 || nc >= grid.cols || nr >= grid.rows) continue;
      if (dc !== 0 && dr !== 0) {
        if (!grid.walk[idx(grid, cc + dc, rr)] || !grid.walk[idx(grid, cc, rr + dr)]) continue;
      }
      const ni = idx(grid, nc, nr);
      if (!grid.walk[ni]) continue;
      const tentative = gScore[cur] + cost;
      if (tentative < gScore[ni]) {
        came[ni] = cur;
        gScore[ni] = tentative;
        if (!open.includes(ni)) open.push(ni);
      }
    }
  }

  if (came[goalI] < 0 && startI !== goalI) return [];
  const cells: { c: number; r: number }[] = [];
  let cur = goalI;
  cells.push({ c: b.c, r: b.r });
  while (cur !== startI && cur >= 0) {
    cur = came[cur];
    if (cur < 0) break;
    cells.push({ c: cur % grid.cols, r: (cur / grid.cols) | 0 });
  }
  cells.reverse();
  const pts = cells.map((c) => cellToWorld(grid, c.c, c.r));
  return simplify(pts);
}

function simplify(pts: { x: number; z: number }[]): { x: number; z: number }[] {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const ab = norm2(b.x - a.x, b.z - a.z);
    const bc = norm2(c.x - b.x, c.z - b.z);
    if (ab.x * bc.x + ab.z * bc.z < 0.94) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function followPath(
  path: { x: number; z: number }[],
  index: number,
  x: number,
  z: number,
  arrive = 0.45,
): { x: number; z: number; index: number; done: boolean } {
  if (!path.length || index >= path.length) return { x: 0, z: 0, index, done: true };
  let i = index;
  while (i < path.length && dist2(x, z, path[i].x, path[i].z) < arrive) i++;
  if (i >= path.length) return { x: 0, z: 0, index: i, done: true };
  const n = norm2(path[i].x - x, path[i].z - z);
  return { x: n.x, z: n.z, index: i, done: false };
}

export function nearestAnchor(
  x: number,
  z: number,
  anchors: InteractionAnchor[] = [KEEPER_ANCHOR],
): InteractionAnchor {
  let best = anchors[0];
  let bd = Infinity;
  for (const a of anchors) {
    const d = dist2(x, z, a.x, a.z);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

export function heightAt(x: number, z: number): number {
  return groundHeight(x, z);
}

export const NAV_CELL = CELL;
