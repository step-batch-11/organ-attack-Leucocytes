import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Player } from "../src/models/player.ts";
import { Organ } from "../src/models/organ.ts";
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
    const cards = [
      buildAttackCard(10),
      buildAttackCard(20),
      buildAttackCard(30),
    ];
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

  it("throws instead of silently removing the last card when attackCardID doesn't match any held card (regression: findIndex(-1) used to splice the last card)", () => {
    const player = new Player("attacker", 1);
    const cards = [
      buildAttackCard(10),
      buildAttackCard(20),
      buildAttackCard(30),
    ];
    player.fillHandWithAttacks(cards);

    assertThrows(() => player.removeAttackCard(999));

    // The hand must be untouched — no card was wrongly removed.
    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [10, 20, 30],
    );
  });

  it("throws instead of silently removing the last card when an out-of-range index is given", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithAttacks([buildAttackCard(10), buildAttackCard(20)]);

    assertThrows(() => player.removeAttackCard(null, 5));

    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [10, 20],
    );
  });
});

describe("Player#removeOrgan", () => {
  it("throws instead of silently removing the last organ when the id doesn't match any held organ (regression: findIndex(-1) used to splice the last organ)", () => {
    const player = new Player("attacker", 1);
    const organs = [new Organ("Heart", 7, 2), new Organ("Kidneys", 1, 2)];
    player.fillHandWithOrgans(organs);

    assertThrows(() => player.removeOrgan(999));

    assertEquals(
      player.getPlayerDetails().organCards.map((o) => o.id),
      [7, 1],
    );
  });

  it("removes the matching organ by id", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithOrgans([
      new Organ("Heart", 7, 2),
      new Organ("Kidneys", 1, 2),
    ]);

    const removed = player.removeOrgan(7);

    assertEquals(removed.getID(), 7);
    assertEquals(
      player.getPlayerDetails().organCards.map((o) => o.id),
      [1],
    );
  });
});

describe("Player#removeAttackCardIfOrganDead", () => {
  const buildTargetedCard = (
    id: number,
    overrides: Partial<AttackCard>,
  ): AttackCard => ({ ...buildAttackCard(id), ...overrides });

  it("discards a card whose only possible target was the organ that just died", () => {
    const player = new Player("attacker", 1);
    const onlyTargetsHeart = buildTargetedCard(10, {
      afflictableOrgans: [7],
    });
    player.fillHandWithAttacks([onlyTargetsHeart]);
    const heart = new Organ("Heart", 7, 0);

    const discarded = player.removeAttackCardIfOrganDead(heart);

    assertEquals(discarded.map((c) => c.id), [10]);
    assertEquals(player.getPlayerDetails().attackCards, []);
  });

  it("keeps a card that can still target other organs, even if it listed the dead one too", () => {
    const player = new Player("attacker", 1);
    const targetsHeartAndKidneys = buildTargetedCard(10, {
      afflictableOrgans: [7, 1],
    });
    player.fillHandWithAttacks([targetsHeartAndKidneys]);
    const heart = new Organ("Heart", 7, 0);

    const discarded = player.removeAttackCardIfOrganDead(heart);

    assertEquals(discarded, []);
    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [10],
    );
  });

  it("discards a removableOrgans-only card the same way", () => {
    const player = new Player("attacker", 1);
    const onlyRemovesHeart = buildTargetedCard(10, { removableOrgans: [7] });
    player.fillHandWithAttacks([onlyRemovesHeart]);
    const heart = new Organ("Heart", 7, 0);

    const discarded = player.removeAttackCardIfOrganDead(heart);

    assertEquals(discarded.map((c) => c.id), [10]);
  });

  it("leaves an unrelated card untouched", () => {
    const player = new Player("attacker", 1);
    const unrelated = buildTargetedCard(10, { afflictableOrgans: [1] });
    player.fillHandWithAttacks([unrelated]);
    const heart = new Organ("Heart", 7, 0);

    const discarded = player.removeAttackCardIfOrganDead(heart);

    assertEquals(discarded, []);
    assertEquals(
      player.getPlayerDetails().attackCards.map((c) => c.id),
      [10],
    );
  });
});

describe("Player#applyVaccine", () => {
  it("grants 2 vaccine points, consumed one at a time by afflictOrgan", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);

    player.applyVaccine();
    const first = player.afflictOrgan(7);
    assertEquals(first.isDead, false);
    assertEquals(player.getPlayerDetails().organCards[0].health, 2);
    assertEquals(player.getPlayerDetails().vaccinePoints, 1);

    const second = player.afflictOrgan(7);
    assertEquals(second.isDead, false);
    assertEquals(player.getPlayerDetails().vaccinePoints, 0);

    // Vaccine exhausted — the next affliction actually lands.
    player.afflictOrgan(7);
    assertEquals(player.getPlayerDetails().organCards[0].health, 1);
  });
});

describe("Player#hasOrgan", () => {
  it("matches case-insensitively by organ name", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 2)]);

    assertEquals(player.hasOrgan("heart"), true);
    assertEquals(player.hasOrgan("lungs"), false);
  });
});

describe("Player#decreaseSleep", () => {
  it("decrements but never goes below 0", () => {
    const player = new Player("attacker", 1);
    player.applySleep(1);

    assertEquals(player.decreaseSleep(), 0);
    assertEquals(player.decreaseSleep(), 0);
  });
});

describe("Player#healOrgan", () => {
  it("does not throw and does nothing when the id doesn't match any held organ (regression: unguarded find+cast used to crash)", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 1, 2)]);

    player.healOrgan(999);

    assertEquals(player.getPlayerDetails().organCards[0].health, 1);
  });

  it("heals the matching organ by id", () => {
    const player = new Player("attacker", 1);
    player.fillHandWithOrgans([new Organ("Heart", 7, 1, 2)]);

    player.healOrgan(7);

    assertEquals(player.getPlayerDetails().organCards[0].health, 2);
  });
});
