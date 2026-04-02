import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Player } from "../src/models/player.js";

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
    const organCardsExp = Array.from({ length: 4 }, (_, i) => `o${i + 1}`);
    player.fillHandWithOrgans(organCardsExp);
    const { organCards } = player.getPlayerDetails();
    assertEquals(organCards, organCardsExp);
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
    const organCards = [{ isWild: true }];
    player.fillHandWithOrgans(organCards);

    assertEquals(player.holdsWild(), true);
  });

  it("Should return player id", () => {
    const playerId = 1;
    const player = new Player("Vivek", playerId);

    assertEquals(player.getId(), playerId);
  });

  it("Should return player details", () => {
    const id = 1;
    const name = "Vivek";
    const player = new Player(name, id);
    const organCards = [];
    const attackCards = [];
    const playerDetails = player.getPlayerDetails();
    assertEquals(playerDetails, {
      id,
      name,
      organCards,
      attackCards,
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
      (_, i) => ({ id: i, name: `o${i + 1}`, health: 1 }),
    );
    player.fillHandWithAttacks(attackCardsExp);
    player.fillHandWithOrgans(organCardsExp);
    assertEquals(player.afflictOrgan(1), { id: 1, name: "o2", health: 0 });
  });
});
