import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

// popupListener reads `window.gameState` directly — polyfill with an
// isolated plain object (not `globalThis` itself, to avoid colliding with
// Deno's own native lifecycle globals) before importing.
// deno-lint-ignore no-explicit-any
(globalThis as any).window = {};

const {
  popupListener,
  popupListenerForOpponents,
} = await import("../public/scripts/listeners/setup_event_listeners.js");

const makeFakeElement = (matches: Record<string, unknown> = {}) => {
  const el: Record<string, unknown> = {
    removed: false,
    dataset: {},
    remove() {
      el.removed = true;
    },
  };
  return Object.assign(el, matches);
};

/** A fake event whose `target.closest(selector)` returns whatever `matches` maps that selector to (or null). */
const makeFakeEvent = (matches: Record<string, unknown>) => ({
  target: {
    closest: (selector: string) => matches[selector] ?? null,
  },
});

describe("popupListenerForOpponents", () => {
  it("dismisses the popup without sending a malformed action when the click misses every .player icon (regression: NaN opponentID used to be sent anyway)", () => {
    const popupArea = makeFakeElement({ dataset: { for: "10" } });
    const event = makeFakeEvent({ ".player": null });
    const state = {
      getSelfID: () => {
        throw new Error("should not be called — click missed the target");
      },
    };

    popupListenerForOpponents(state, event, popupArea);

    assertEquals(popupArea.removed, true);
  });
});

describe("popupListener", () => {
  it("does nothing when the click isn't inside an organs/players popup at all (regression: bubbled clicks from Medical Miracle's self-contained popup crashed on `popup.dataset` being null)", () => {
    const event = makeFakeEvent({
      ".players-popup": null,
      ".organs-popup": null,
    });

    // Must not throw, even with no window.gameState set up at all.
    popupListener(event);
  });

  it("dismisses the organs-popup without sending a malformed action when the click misses every .organ icon (regression: NaN organCardID used to be sent anyway)", () => {
    const popup = makeFakeElement({ dataset: { for: "10" } });
    const event = makeFakeEvent({
      ".players-popup": null,
      ".organs-popup": popup,
      ".organ": null,
    });

    popupListener(event);

    assertEquals(popup.removed, true);
  });

  it("routes a click inside a .players-popup to popupListenerForOpponents", () => {
    const popupArea = makeFakeElement({ dataset: { for: "10" } });
    const event = makeFakeEvent({
      ".players-popup": popupArea,
      ".player": null,
    });

    popupListener(event);

    // popupListenerForOpponents's miss-guard removed it, proving the route
    // was taken (and that it dismissed cleanly rather than crashing).
    assertEquals(popupArea.removed, true);
  });
});
