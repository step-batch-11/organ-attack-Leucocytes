import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Organ } from "../src/models/organ.js";

describe("organ class", () => {
  let organ;
  beforeEach(() => organ = new Organ("wild", 1, 2, 2));
  describe("Get details", () => {
    it(" organDetails", () => {
      assertEquals(organ.getDetails(), {
        name: "wild",
        id: 1,
        health: 2,
        maxHealth: 2,
        isWild: true,
      });
    });

    it("Afflict", () => {
      organ.afflict(1);
      assertEquals(organ.getDetails().health, 1);
    });

    it("Cure", () => {
      organ.heal();
      assertEquals(organ.getDetails().health, 3);
    });

    it("Is wild", () => {
      assertEquals(organ.isWild(), true);
    });

    it("Is dead", () => {
      assertEquals(organ.isDead(), false);
    });
  });
});
