import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { decideFlashScreenAction } from "../public/scripts/renderer/response_timer.js";

const KNOWN_NAMES = ["affliction", "immunity-boost"];

describe("decideFlashScreenAction", () => {
  it("clears when the event name isn't a known flash-screen type and one is currently showing", () => {
    const action = decideFlashScreenAction(
      { name: "idle", id: 5 },
      1,
      KNOWN_NAMES,
    );

    assertEquals(action, "clear");
  });

  it("skips (does nothing) when the event name is unknown and nothing is currently showing", () => {
    const action = decideFlashScreenAction(
      { name: "idle", id: 5 },
      null,
      KNOWN_NAMES,
    );

    assertEquals(action, "skip");
  });

  it("skips when the incoming event is the same one already being shown (regression: re-broadcasts unrelated to this event used to restart the countdown from full duration)", () => {
    const action = decideFlashScreenAction(
      { name: "affliction", id: 3 },
      3,
      KNOWN_NAMES,
    );

    assertEquals(action, "skip");
  });

  it("replaces when a genuinely new event (different id) arrives, even with the same name", () => {
    const action = decideFlashScreenAction(
      { name: "affliction", id: 4 },
      3,
      KNOWN_NAMES,
    );

    assertEquals(action, "replace");
  });

  it("replaces on the very first event of the game (nothing tracked yet)", () => {
    const action = decideFlashScreenAction(
      { name: "affliction", id: 1 },
      null,
      KNOWN_NAMES,
    );

    assertEquals(action, "replace");
  });

  it("handles a missing event object the same as an unknown name", () => {
    const action = decideFlashScreenAction(undefined, 1, KNOWN_NAMES);

    assertEquals(action, "clear");
  });
});
