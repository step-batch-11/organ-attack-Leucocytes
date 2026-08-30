import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import ActionController from "../src/controllers/action_controller.ts";
import ActionStack from "../src/models/action_stack.ts";
import type { ActionInput } from "../src/types/entities.ts";
import type { AttackCard } from "../src/types/cards.ts";

// Matches real card data: IMMUNITY_BOOST/METASTASIS/CONTAGIOUS are always
// isInstant — that's what lets them join an already-open stack at all.
const REACTIVE_CARD_NAMES = new Set([
  "IMMUNITY_BOOST",
  "METASTASIS",
  "CONTAGIOUS",
]);

const buildAttackCard = (action: string, isInstant?: boolean): AttackCard => ({
  id: 0,
  name: action,
  type: action,
  isInstant: isInstant ?? REACTIVE_CARD_NAMES.has(action),
  afflictableOrgans: [],
  removableOrgans: [],
  isWild: false,
  afflictPoints: 0,
  Desc: "",
  action,
  isBlockable: true,
});

const buildAction = (
  name: string,
  overrides: Partial<ActionInput> = {},
  isInstant?: boolean,
) => ({
  name,
  card: buildAttackCard(name, isInstant),
  ...overrides,
} as ActionInput);

const buildController = () => new ActionController(new ActionStack());

const ATTACKER = 1;
const TARGET = 2;
const BYSTANDER = 3;

describe("ActionController#add", () => {
  it("rejects a response action (IMMUNITY_BOOST) as the first action on an empty stack", () => {
    const controller = buildController();

    const result = controller.add(buildAction("IMMUNITY_BOOST"));

    assertEquals(result.success, false);
  });

  it("rejects METASTASIS/CONTAGIOUS unless the action directly beneath them is an AFFLICTION", () => {
    const controller = buildController();
    controller.add(buildAction("TRANSPLANT"));

    const result = controller.add(buildAction("METASTASIS"));

    assertEquals(result.success, false);
  });

  it("allows METASTASIS/CONTAGIOUS when the action directly beneath them is an AFFLICTION", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));

    const result = controller.add(buildAction("CONTAGIOUS"));

    assertEquals(result.success, true);
  });

  it(
    "rejects a second, unrelated non-response action while one is still awaiting resolution " +
      "(regression: a concurrent double-action race used to merge two unrelated exchanges into " +
      "one resolution pass — passTurn() firing once instead of twice, and immunity-boost's " +
      "stack-adjacency cancellation pairing across the two)",
    () => {
      const controller = buildController();
      controller.add(buildAction("AFFLICTION"));

      const result = controller.add(buildAction("TRANSPLANT"));

      assertEquals(result.success, false);
      assertEquals(
        result.message,
        "another action is still awaiting resolution",
      );
    },
  );

  it(
    "allows an instant card that isn't in the reactive-only set (e.g. Cryopreservation) to join an already-open stack " +
      "(regression: a live game froze because Cryopreservation — isInstant but not one of IMMUNITY_BOOST/METASTASIS/CONTAGIOUS " +
      "— was wrongly rejected by an earlier fix's hardcoded action-name allowlist instead of checking card.isInstant)",
    () => {
      const controller = buildController();
      controller.add(buildAction("AFFLICTION"));

      const result = controller.add(
        buildAction("CRYOPRESERVATION", {}, true),
      );

      assertEquals(result.success, true);
    },
  );

  it("still rejects a second, non-instant unrelated action even though the isInstant check replaced the old allowlist", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));

    const result = controller.add(buildAction("BY_THE_BOOK", {}, false));

    assertEquals(result.success, false);
  });

  it("still allows a legitimate response (IMMUNITY_BOOST played by the affliction's own target) to join the stack while a response window is open", () => {
    const controller = buildController();
    controller.add(
      buildAction("AFFLICTION", { attackerID: ATTACKER, opponentID: TARGET }),
    );

    const result = controller.add(
      buildAction("IMMUNITY_BOOST", { attackerID: TARGET }),
    );

    assertEquals(result.success, true);
  });

  it("allows an unrelated action once the previous exchange has actually resolved", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));
    controller.resolve();

    const result = controller.add(buildAction("TRANSPLANT"));

    assertEquals(result.success, true);
  });

  it(
    "rejects an Immunity Boost from a player who is neither the action's target nor its attacker " +
      "(regression: cancellation used to be pure stack-adjacency, so any player's boost could " +
      "cancel anyone's action)",
    () => {
      const controller = buildController();
      controller.add(
        buildAction("AFFLICTION", {
          attackerID: ATTACKER,
          opponentID: TARGET,
        }),
      );

      const result = controller.add(
        buildAction("IMMUNITY_BOOST", { attackerID: BYSTANDER }),
      );

      assertEquals(result.success, false);
      assertEquals(
        result.message,
        "you are not eligible to play Immunity Boost against this action",
      );
    },
  );

  it("allows the original attacker to counter-boost after the target's boost, but rejects the target trying to boost twice in a row", () => {
    const controller = buildController();
    controller.add(
      buildAction("AFFLICTION", { attackerID: ATTACKER, opponentID: TARGET }),
    );
    controller.add(buildAction("IMMUNITY_BOOST", { attackerID: TARGET }));

    const wrongSecondBooster = controller.add(
      buildAction("IMMUNITY_BOOST", { attackerID: TARGET }),
    );
    const rightSecondBooster = controller.add(
      buildAction("IMMUNITY_BOOST", { attackerID: ATTACKER }),
    );

    assertEquals(wrongSecondBooster.success, false);
    assertEquals(rightSecondBooster.success, true);
  });
});

describe("ActionController#resolve", () => {
  it("fails with nothing on the stack", () => {
    const controller = buildController();

    const result = controller.resolve();

    assertEquals(result.success, false);
  });

  it("cancels an AFFLICTION against a single IMMUNITY_BOOST played by its own target in response to it", () => {
    const controller = buildController();
    controller.add(
      buildAction("AFFLICTION", { attackerID: ATTACKER, opponentID: TARGET }),
    );
    controller.add(buildAction("IMMUNITY_BOOST", { attackerID: TARGET }));

    const result = controller.resolve();

    assertEquals(result.success, true);
    assertEquals(result.data, []);
  });

  it("leaves the AFFLICTION resolved when the original attacker counter-boosts the target's boost (double-cancel)", () => {
    const controller = buildController();
    controller.add(
      buildAction("AFFLICTION", { attackerID: ATTACKER, opponentID: TARGET }),
    );
    controller.add(buildAction("IMMUNITY_BOOST", { attackerID: TARGET }));
    controller.add(buildAction("IMMUNITY_BOOST", { attackerID: ATTACKER }));

    const result = controller.resolve();

    assertEquals(result.success, true);
    assertEquals(result.data?.map((a) => a.name), ["AFFLICTION"]);
  });

  it("empties the stack after resolving, so a later add()/resolve() cycle starts fresh", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));
    controller.resolve();

    controller.add(buildAction("TRANSPLANT"));
    const result = controller.resolve();

    assertEquals(result.data?.map((a) => a.name), ["TRANSPLANT"]);
  });
});
