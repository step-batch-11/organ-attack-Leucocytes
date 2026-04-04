import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Player } from "../src/models/player.js";
import { Organ } from "../src/models/organ.js";

describe("Game model test", () => {
  describe("* GetPlayers test", () => {
    it("=> should increase vaccine pts to 2 when I played vaccine card", () => {
      const player = new Player("user1", 1, "non-host");
      player.applyVaccine();

      const { vaccinePoints } = player.getPlayerDetails();
      assertEquals(vaccinePoints, 2);
    });
    it("=> should increase vaccine pts to 4 when I played vaccine card twice", () => {
      const player = new Player("user1", 1, "non-host");
      player.applyVaccine();
      player.applyVaccine();

      const { vaccinePoints } = player.getPlayerDetails();
      assertEquals(vaccinePoints, 4);
    });
    it("=> should decrease vaccine pts by 1 when someone hit me once", () => {
      const organ1 = new Organ("organ1", 1, 2);
      const organ2 = new Organ("organ2", 2, 2);
      const player = new Player("user1", 1, "non-host");
      player.applyVaccine();
      player.fillHandWithOrgans([organ1, organ2]);
      player.afflictOrgan(1);

      const { vaccinePoints } = player.getPlayerDetails();
      assertEquals(vaccinePoints, 1);
    });
    it("=> should decrease vaccine pts by 2 when someone hit me twice", () => {
      const organ1 = new Organ("organ1", 1, 2);
      const organ2 = new Organ("organ2", 2, 2);
      const player = new Player("user1", 1, "non-host");
      player.applyVaccine();
      player.fillHandWithOrgans([organ1, organ2]);
      player.afflictOrgan(1);
      player.afflictOrgan(1);

      const { vaccinePoints } = player.getPlayerDetails();
      assertEquals(vaccinePoints, 0);
    });
    it("=> should affilct my organ when some one hit me thrice after i got vaccinated", () => {
      const organ1 = new Organ("organ1", 1, 2);
      const organ2 = new Organ("organ2", 2, 2);
      const player = new Player("user1", 1, "non-host");
      player.fillHandWithOrgans([organ1, organ2]);
      player.applyVaccine();

      player.afflictOrgan(1);
      player.afflictOrgan(1);
      const { organ, isDead } = player.afflictOrgan(1);
      assertEquals(isDead, false);
      assertEquals(player.isVaccinated(), false);
      assertEquals(organ.getDetails().health, 1);
    });
  });
});
