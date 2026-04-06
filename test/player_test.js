import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Player } from "../src/models/player.js";
import { Organ } from "../src/models/organ.js";

describe("Testing Player Class", () => {
  it("Should Initiate player and return their details", () => {
    const player = new Player("Vivek", 1);
    const { name, id } = player.getPlayerDetails();
    assertEquals({ name, id }, { name: "Vivek", id: 1 });
  });

  it("Should Initiate one more player and return their details", () => {
    const player = new Player("Nikhil", 2);
    const { name, id } = player.getPlayerDetails();
    assertEquals({ name, id }, { name: "Nikhil", id: 2 });
  });

  it("Should fill Hand with given attack cards", () => {
    const player = new Player("Vivek", 1);
    const attackCardsExp = Array.from({ length: 5 }, (_, i) => `a${i + 1}`);
    player.fillHandWithAttacks(attackCardsExp);
    const { attackCards } = player.getPlayerDetails();
    assertEquals(attackCards, attackCardsExp);
  });

  it("Should fill Hand with given organs cards", () => {
    const player = new Player("Vivek", 1);
    const organCardsExp = ["o1", "o2", "o3"].map((name, i) =>
      new Organ(name, i + 1, 2)
    );
    player.fillHandWithOrgans(organCardsExp);
    const { organCards } = player.getPlayerDetails();
    assertEquals(organCards, organCardsExp.map((organ) => organ.getDetails()));
  });

  it("Should discard all attack cards", () => {
    const player = new Player("Vivek", 1);
    const givenAttacks = Array.from({ length: 5 }, (_, i) => `a${i + 1}`);
    player.fillHandWithAttacks(givenAttacks);
    const expectedAttackCards = [...givenAttacks];
    const attackCards = player.discardAllAttackCards();
    assertEquals(attackCards, expectedAttackCards);
  });

  it("Should have wild card", () => {
    const player = new Player("Vivek", 1);
    const organCards = [new Organ("wild")];
    player.fillHandWithOrgans(organCards);

    assertEquals(player.holdsWild(), true);
  });

  it("Should return player id", () => {
    const playerID = 1;
    const player = new Player("Vivek", playerID);

    assertEquals(player.getID(), playerID);
  });

  it("Should return player details", () => {
    const id = 1;
    const name = "Vivek";
    const player = new Player(name, id);
    const organCards = [];
    const attackCards = [];
    const playerDetails = player.getPlayerDetails();
    const vaccinePoints = 0;
    assertEquals(playerDetails, {
      id,
      name,
      organCards,
      attackCards,
      vaccinePoints,
    });
  });

  it("Should remove an attack card from hand", () => {
    const player = new Player("Chiru", 1);
    const attackCardsExp = Array.from(
      { length: 5 },
      (_, i) => ({ id: i, name: `a${i + 1}` }),
    );
    const organCardsExp = Array.from(
      { length: 4 },
      (_, i) => ({ id: i, name: `o${i + 1}` }),
    );
    player.fillHandWithAttacks(attackCardsExp);
    player.fillHandWithOrgans(organCardsExp);
    assertEquals(player.removeAttackCard(1), { id: 1, name: "a2" });
  });

  it("Should remove an organ card of player since its current health is 1", () => {
    const player = new Player("Chiru", 1);
    const attackCardsExp = Array.from(
      { length: 5 },
      (_, i) => ({ id: i, name: `a${i + 1}` }),
    );
    const organCardsExp = Array.from(
      { length: 4 },
      (_, i) => (new Organ(`o${i + 1}`, i, 1)),
    );
    player.fillHandWithAttacks(attackCardsExp);
    player.fillHandWithOrgans(organCardsExp);
    const { organ } = player.afflictOrgan(1);

    assertEquals(organ.getDetails(), {
      id: 1,
      name: "o2",
      health: 0,
      maxHealth: 1,
      isWild: false,
    });
  });

  it("Should remove organ", () => {
    const player = new Player("Chiru", 1);
    const attackCardsExp = Array.from(
      { length: 5 },
      (_, i) => ({ id: i, name: `a${i + 1}` }),
    );
    const organCardsExp = Array.from(
      { length: 4 },
      (_, i) => ({ id: i, name: `o${i + 1}`, health: 1 }),
    ).map(({ name, id, health }) => new Organ(name, id, health));
    player.fillHandWithAttacks(attackCardsExp);
    player.fillHandWithOrgans(organCardsExp);
    assertEquals(player.removeOrgan(1).getDetails(), {
      id: 1,
      name: "o2",
      health: 1,
      isWild: false,
      maxHealth: 1,
    });
  });

  it("Should add organ", () => {
    const player = new Player("Chiru", 1);
    const attackCardsExp = Array.from(
      { length: 5 },
      (_, i) => ({ id: i, name: `a${i + 1}` }),
    );
    const organCardsExp = Array.from(
      { length: 4 },
      (_, i) => ({ id: i, name: `o${i + 1}`, health: 1 }),
    ).map(({ name, id, health }) => new Organ(name, id, health));
    player.fillHandWithAttacks(attackCardsExp);
    player.fillHandWithOrgans(organCardsExp);
    player.addOrgan(new Organ("", 100, 1));
    assertEquals(player.removeOrgan(100).getDetails(), {
      name: "",
      id: 100,
      health: 1,
      isWild: false,
      maxHealth: 1,
    });
  });
});
