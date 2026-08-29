import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import ActionController from "../src/controllers/action_controller.ts";
import ActionStack from "../src/models/action_stack.ts";
import type { ActionInput } from "../src/types/entities.ts";
import type { AttackCard } from "../src/types/cards.ts";

const buildAttackCard = (action: string): AttackCard => ({
  id: 0,
  name: action,
  type: action,
  isInstant: false,
  afflictableOrgans: [],
  removableOrgans: [],
  isWild: false,
  afflictPoints: 0,
  Desc: "",
  action,
  isBlockable: true,
});

const buildAction = (name: string, overrides: Partial<ActionInput> = {}) => ({
  name,
  card: buildAttackCard(name),
  ...overrides,
} as ActionInput);

const buildController = () => new ActionController(new ActionStack());

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

  it("still allows a legitimate response (IMMUNITY_BOOST) to join the stack while a response window is open", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));

    const result = controller.add(buildAction("IMMUNITY_BOOST"));

    assertEquals(result.success, true);
  });

  it("allows an unrelated action once the previous exchange has actually resolved", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));
    controller.resolve();

    const result = controller.add(buildAction("TRANSPLANT"));

    assertEquals(result.success, true);
  });
});

describe("ActionController#resolve", () => {
  it("fails with nothing on the stack", () => {
    const controller = buildController();

    const result = controller.resolve();

    assertEquals(result.success, false);
  });

  it("cancels an AFFLICTION against a single IMMUNITY_BOOST played in response to it", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));
    controller.add(buildAction("IMMUNITY_BOOST"));

    const result = controller.resolve();

    assertEquals(result.success, true);
    assertEquals(result.data, []);
  });

  it("leaves the AFFLICTION resolved when cancelled by a second, matching IMMUNITY_BOOST (double-cancel)", () => {
    const controller = buildController();
    controller.add(buildAction("AFFLICTION"));
    controller.add(buildAction("IMMUNITY_BOOST"));
    controller.add(buildAction("IMMUNITY_BOOST"));

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
