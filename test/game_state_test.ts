import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import GameState from "../public/scripts/state/game_state.js";

const EMPTY_EVENT = {};

const buildState = (overrides = {}) => ({
  self: {
    id: 1,
    isSleeping: false,
    isMyTurn: true,
    attackCards: [],
    organCards: [],
  },
  players: [],
  event: EMPTY_EVENT,
  ...overrides,
});

describe("GameState#canPlayContagious", () => {
  it("returns false instead of throwing when no card has ever been played this game (regression: event.target.player.id crashed on the server's initial {} event)", () => {
    const state = new GameState(buildState());
    assertEquals(state.canPlayContagious(), false);
  });

  it("returns true when self is the target of an unresolved affliction event", () => {
    const state = new GameState(buildState({
      event: {
        name: "affliction",
        target: { player: { id: 1 } },
        resolved: false,
      },
    }));
    assertEquals(state.canPlayContagious(), true);
  });

  it("returns false when self is not the target of the event", () => {
    const state = new GameState(buildState({
      event: {
        name: "affliction",
        target: { player: { id: 2 } },
        resolved: false,
      },
    }));
    assertEquals(state.canPlayContagious(), false);
  });

  it("returns false once the event is resolved", () => {
    const state = new GameState(buildState({
      event: {
        name: "affliction",
        target: { player: { id: 1 } },
        resolved: true,
      },
    }));
    assertEquals(state.canPlayContagious(), false);
  });
});

describe("GameState#canPlayMetastasis", () => {
  it("returns false instead of throwing when no card has ever been played this game (regression: event.actor.id crashed on the server's initial {} event)", () => {
    const state = new GameState(buildState());
    assertEquals(state.canPlayMetastasis(), false);
  });

  it("returns true when self is the actor of an unresolved affliction event", () => {
    const state = new GameState(buildState({
      event: { name: "affliction", actor: { id: 1 }, resolved: false },
    }));
    assertEquals(state.canPlayMetastasis(), true);
  });

  it("returns false when self is not the actor of the event", () => {
    const state = new GameState(buildState({
      event: { name: "affliction", actor: { id: 2 }, resolved: false },
    }));
    assertEquals(state.canPlayMetastasis(), false);
  });
});

describe("GameState#canPlayImmunityBoost", () => {
  it("does not throw when no card has ever been played this game (an untargeted, unnamed event allows the boost, matching 'almost any time')", () => {
    const state = new GameState(buildState());
    assertEquals(state.canPlayImmunityBoost(), true);
  });

  it("returns false for poison and idle events regardless of target", () => {
    assertEquals(
      new GameState(buildState({ event: { name: "poison" } }))
        .canPlayImmunityBoost(),
      false,
    );
    assertEquals(
      new GameState(buildState({ event: { name: "idle" } }))
        .canPlayImmunityBoost(),
      false,
    );
  });

  it("returns false when the event targets a different player (regression: any player could cancel an attack never aimed at them)", () => {
    const state = new GameState(buildState({
      event: {
        name: "affliction",
        target: { player: { id: 2 } },
        resolved: false,
      },
    }));
    assertEquals(state.canPlayImmunityBoost(), false);
  });

  it("returns true when the event targets self", () => {
    const state = new GameState(buildState({
      event: {
        name: "affliction",
        target: { player: { id: 1 } },
        resolved: false,
      },
    }));
    assertEquals(state.canPlayImmunityBoost(), true);
  });

  it("returns true for an untargeted event (e.g. cryopreservation, which affects everyone but the attacker)", () => {
    const state = new GameState(buildState({
      event: { name: "cryopreservation", resolved: false },
    }));
    assertEquals(state.canPlayImmunityBoost(), true);
  });

  it("returns false once the event is resolved", () => {
    const state = new GameState(buildState({
      event: {
        name: "affliction",
        target: { player: { id: 1 } },
        resolved: true,
      },
    }));
    assertEquals(state.canPlayImmunityBoost(), false);
  });
});

describe("GameState#isMyTurn / #amISleeping", () => {
  it("is my turn only when the server says so and I'm not sleeping", () => {
    assertEquals(
      new GameState(buildState({ self: { isMyTurn: true, isSleeping: false } }))
        .isMyTurn(),
      true,
    );
    assertEquals(
      new GameState(buildState({ self: { isMyTurn: true, isSleeping: true } }))
        .isMyTurn(),
      false,
    );
    assertEquals(
      new GameState(
        buildState({ self: { isMyTurn: false, isSleeping: false } }),
      ).isMyTurn(),
      false,
    );
  });
});
