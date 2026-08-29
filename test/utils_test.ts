import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  setLastPlayedCard,
  takePendingPlayedCard,
} from "../public/scripts/utils.js";

describe("setLastPlayedCard / takePendingPlayedCard", () => {
  it("keys pending discard-animation state per attackCardID, not a single shared slot (regression: a second card played while the first's WS round-trip was still pending used to overwrite the first's animation state)", () => {
    const cardAElement = { id: "card-a" };
    const cardARect = { left: 1, top: 1 };
    const cardBElement = { id: "card-b" };
    const cardBRect = { left: 2, top: 2 };

    setLastPlayedCard(cardAElement, cardARect, { id: 1 });
    // Card A's sendAction hasn't resolved yet (e.g. still awaiting the WS
    // round-trip) when card B is played — its setLastPlayedCard call must not
    // clobber A's still-pending entry.
    setLastPlayedCard(cardBElement, cardBRect, { id: 2 });

    const pendingA = takePendingPlayedCard(1);
    const pendingB = takePendingPlayedCard(2);

    assertEquals(pendingA, { element: cardAElement, rect: cardARect });
    assertEquals(pendingB, { element: cardBElement, rect: cardBRect });
  });

  it("returns undefined and is a no-op when there is no pending entry for that attackCardID", () => {
    assertEquals(takePendingPlayedCard(999), undefined);
  });

  it("removes the entry once taken, so a second take for the same ID returns undefined", () => {
    setLastPlayedCard({ id: "card-c" }, { left: 3, top: 3 }, { id: 3 });

    const first = takePendingPlayedCard(3);
    const second = takePendingPlayedCard(3);

    assertEquals(first, {
      element: { id: "card-c" },
      rect: { left: 3, top: 3 },
    });
    assertEquals(second, undefined);
  });
});
