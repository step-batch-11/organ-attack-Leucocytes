import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

// game.js does `window.onload = () => {...}` at module scope — polyfill with
// an isolated plain object (not `globalThis` itself) before importing, so
// the module loads outside a real browser without colliding with Deno's own
// native `globalThis.onload` lifecycle event.
// deno-lint-ignore no-explicit-any
const fakeWindow: any = {};
// deno-lint-ignore no-explicit-any
(globalThis as any).window = fakeWindow;

const { attachEventListener } = await import("../public/scripts/game.js");

const makeFakeCardElement = (id: number) => ({
  dataset: { id: String(id) },
  style: { pointerEvents: "none" },
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
});

const makeFakeEvent = (element: unknown) => ({
  target: { closest: () => element },
});

describe("attachEventListener", () => {
  it("restores pointer-events and does not throw when the clicked card isn't actually in the player's hand (regression: an unscoped query could sweep up a stray element not in player.attackCards)", async () => {
    fakeWindow.gameState = { amISleeping: () => false };
    const element = makeFakeCardElement(999);
    const player = { attackCards: [{ id: 1, action: "affliction" }] };

    await attachEventListener(makeFakeEvent(element), player, [], false, []);

    assertEquals(element.style.pointerEvents, "");
  });

  it("restores pointer-events when the card's action isn't a recognized dispatch key", async () => {
    fakeWindow.gameState = { amISleeping: () => false };
    const element = makeFakeCardElement(1);
    const player = {
      attackCards: [{ id: 1, action: "totally-unknown-action" }],
    };

    await attachEventListener(makeFakeEvent(element), player, [], false, []);

    assertEquals(element.style.pointerEvents, "");
  });

  it("restores pointer-events when the player is asleep, even for a recognized action", async () => {
    fakeWindow.gameState = { amISleeping: () => true };
    const element = makeFakeCardElement(1);
    const player = { attackCards: [{ id: 1, action: "affliction" }] };

    await attachEventListener(makeFakeEvent(element), player, [], false, []);

    assertEquals(element.style.pointerEvents, "");
  });

  it("catches a thrown error from the dispatched handler and restores pointer-events instead of leaving the card stuck disabled forever (regression: no try/catch existed around the ACTION_HANDLERS dispatch)", async () => {
    // Deliberately incomplete gameState — the real "affliction" handler
    // calls gameState.isMyTurn() first, which throws since it's missing.
    fakeWindow.gameState = { amISleeping: () => false };
    const element = makeFakeCardElement(1);
    const player = { attackCards: [{ id: 1, action: "affliction" }] };

    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      await attachEventListener(makeFakeEvent(element), player, [], false, []);
    } finally {
      console.error = originalConsoleError;
    }

    assertEquals(element.style.pointerEvents, "");
  });
});
