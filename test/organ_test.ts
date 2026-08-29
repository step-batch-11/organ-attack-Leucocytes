import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Organ } from "../src/models/organ.ts";

describe("Organ#heal", () => {
  it("does not heal past maxHealth (regression: Medicine/Medical Miracle could permanently raise an organ's effective kill threshold past its intended maximum)", () => {
    const organ = new Organ("Heart", 1, 2, 2);

    organ.heal();

    assertEquals(organ.getDetails().health, 2);
  });

  it("still heals normally when below maxHealth", () => {
    const organ = new Organ("Heart", 1, 1, 2);

    organ.heal();

    assertEquals(organ.getDetails().health, 2);
  });
});
