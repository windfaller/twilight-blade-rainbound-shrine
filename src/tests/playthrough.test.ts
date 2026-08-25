import { describe, expect, it } from "vitest";
import { emptyInput } from "../game/input";
import { Game } from "../game/loop";
import { spawnEncounter } from "../game/systems/rewards";
import { applyDamage } from "../game/systems/combat";

describe("full slice playthrough", () => {
  it("does not end after the first kill and reaches boss phase 2 then victory", () => {
    const game = new Game();
    game.state.loading.ready = true;
    game.state.loading.progress = 1;
    game.enqueue({ type: "selectKit", id: "rin" });
    game.enqueue({ type: "confirmKit" });
    game.tick(0.05, emptyInput());
    expect(game.state.screen).toBe("explore");
    expect(game.state.player.defId).toBe("rin");

    game.state.blessing = true;
    spawnEncounter(game.state, "enc1");
    const first = game.state.actors.find((a) => a.kind === "enemy")!;
    applyDamage(game.state, game.state.player, first, 999, "moon", 0, ["aa"]);
    expect(first.dead).toBe(true);
    expect(game.state.screen).not.toBe("victory");
    expect(game.state.ended).toBe(false);
    expect(game.state.encountersCleared.includes("enc1")).toBe(false);

    for (const e of game.state.actors.filter((a) => a.kind === "enemy" && !a.dead)) {
      applyDamage(game.state, game.state.player, e, 999, "moon", 0, ["aa"]);
    }
    game.tick(0.25, emptyInput());
    expect(game.state.encountersCleared).toContain("enc1");
    expect(game.state.relicChoices?.length).toBeGreaterThan(0);
    const relic = game.state.relicChoices![0].id;
    game.enqueue({ type: "pickRelic", id: relic });
    game.tick(0.05, emptyInput());
    expect(game.state.relics).toContain(relic);
    expect(game.state.screen).toBe("explore");

    for (const id of ["enc2", "enc3", "elite"] as const) {
      spawnEncounter(game.state, id);
      for (const e of game.state.actors.filter((a) => a.kind === "enemy" && !a.dead)) {
        applyDamage(game.state, game.state.player, e, 999, "moon", 0, ["ult", "break"]);
      }
      game.tick(0.25, emptyInput());
      if (game.state.relicChoices?.[0]) {
        game.enqueue({ type: "pickRelic", id: game.state.relicChoices[0].id });
        game.tick(0.08, emptyInput());
      }
    }
    expect(game.state.gateOpen).toBe(true);
    expect(game.state.encountersCleared).toContain("elite");

    spawnEncounter(game.state, "boss");
    const boss = game.state.actors.find((a) => a.defId === "boss")!;
    boss.hp = boss.maxHp * 0.45;
    game.tick(0.2, emptyInput());
    expect(game.state.bossPhase).toBe(2);
    expect(game.state.arenaBroken).toBe(true);
    applyDamage(game.state, game.state.player, boss, 9999, "moon", 0, ["ult"]);
    game.tick(0.25, emptyInput());
    expect(game.state.screen).toBe("victory");
    expect(game.state.unlocks.clearedKits).toContain("rin");
  });
});
