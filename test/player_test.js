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
});
