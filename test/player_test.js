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

  it("Should fill Hand with given attack and organ cards", () => {
    const player = new Player("Vivek", 1);
    const attackCardsExp = Array.from({ length: 5 }, (_, i) => `a${i + 1}`);
    const organCardsExp = Array.from({ length: 4 }, (_, i) => `o${i + 1}`);
    player.fillHand(attackCardsExp, organCardsExp);
    const { attackCards, organCards } = player.getPlayerDetails();
    assertEquals(attackCards, attackCardsExp);
    assertEquals(organCards, organCardsExp);
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
    player.fillHand(attackCardsExp, organCardsExp);
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
    player.fillHand(attackCardsExp, organCardsExp);
    assertEquals(player.afflictOrgan(1), { id: 1, name: "o2", health: 0 });
  });
});
