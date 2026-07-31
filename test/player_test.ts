import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Player } from "../src/models/player.ts";
import type { AttackCard } from "../src/types/cards.ts";

const buildAttackCard = (id: number): AttackCard => ({
  id,
  name: `card-${id}`,
  type: "affliction",
  isInstant: false,
  afflictableOrgans: [],
  removableOrgans: [],
  isWild: false,
  afflictPoints: 0,
  Desc: "",
  action: "affliction",
  isBlockable: true,
});

describe("Player#removeAttackCard", () => {
  it("removes the card at index 0, not the last card (regression: `index || fallback` treated a valid index of 0 as falsy)", () => {
    const player = new Player("attacker", 1);
    const cards = [buildAttackCard(10), buildAttackCard(20), buildAttackCard(30)];
    player.fillHandWithAttacks(cards);

    const removed = player.removeAttackCard(null, 0);

    assertEquals(removed.id, 10);
    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [20, 30],
    );
  });

  it("still removes by id when no index is given", () => {
    const player = new Player("attacker", 1);
    const cards = [buildAttackCard(10), buildAttackCard(20)];
    player.fillHandWithAttacks(cards);

    const removed = player.removeAttackCard(20);

    assertEquals(removed.id, 20);
    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [10],
    );
  });
});
