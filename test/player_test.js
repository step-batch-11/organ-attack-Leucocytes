import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Player } from "../src/models/player.js";

describe("Testing Player Class", () => {
  it("Should Initiate player and return his details", () => {
    const player = new Player("Vivek", 1);
    const { name, id } = player.getPlayerDetails();
    assertEquals({ name, id }, { name: "Vivek", id: 1 });
  });

  it("Should Initiate one more player and return his details", () => {
    const player = new Player("Nikhil", 2);
    const { name, id } = player.getPlayerDetails();
    assertEquals({ name, id }, { name: "Nikhil", id: 2 });
  });

  it("Should fill Hand with given attack and organ cards", () => {
    const player = new Player("Vivek", 1);
    const attackCards = ["a1", "a2", "a3", "a4", "a5"];
    const organCards = ["o1", "o2", "o3", "o4"];
    player.fillHand(attackCards, organCards);
    const { attackCards: ac, organCards: oc } = player.getPlayerDetails();
    assertEquals(attackCards, ac);
    assertEquals(organCards, oc);
  });
});
