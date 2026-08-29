import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { shouldSubmitMedicalMiracle } from "../public/scripts/afflict-organ.js";

describe("shouldSubmitMedicalMiracle", () => {
  it("does not submit after 1 click when the only damaged organ still needs a 2nd heal point (regression: the old misnamed `isWild` check submitted early here, silently losing the 2nd heal point)", () => {
    const organCards = [{ id: 1, name: "Heart", health: 1, maxHealth: 2 }];
    assertEquals(shouldSubmitMedicalMiracle(organCards, 1), false);
  });

  it("submits after 1 click when that single organ only needed 1 heal point (nothing left to heal)", () => {
    const organCards = [{ id: 1, name: "Heart", health: 2, maxHealth: 2 }];
    assertEquals(shouldSubmitMedicalMiracle(organCards, 1), true);
  });

  it("submits once totalHeal reaches 2, regardless of remaining damaged organs", () => {
    const organCards = [
      { id: 1, name: "Heart", health: 1, maxHealth: 2 },
      { id: 2, name: "Kidneys", health: 1, maxHealth: 2 },
    ];
    assertEquals(shouldSubmitMedicalMiracle(organCards, 2), true);
  });

  it("does not submit after 1 click when other organs in the popup are still damaged", () => {
    const organCards = [
      { id: 1, name: "Heart", health: 2, maxHealth: 2 },
      { id: 2, name: "Kidneys", health: 1, maxHealth: 2 },
    ];
    assertEquals(shouldSubmitMedicalMiracle(organCards, 1), false);
  });

  it("submits after 1 click on a Wild organ that only needed 1 heal point, same as any other fully-healed single organ", () => {
    const organCards = [{ id: 1, name: "Wild", health: 4, maxHealth: 4 }];
    assertEquals(shouldSubmitMedicalMiracle(organCards, 1), true);
  });
});
