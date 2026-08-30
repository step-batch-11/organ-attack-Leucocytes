import type ActionStack from "../models/action_stack.ts";
import type { ActionInput } from "../types/entities.ts";
import type { ActionResult } from "../types/game.ts";

export default class ActionController {
  #stack: ActionStack;
  constructor(stack: ActionStack) {
    this.#stack = stack;
  }

  add(action: ActionInput): ActionResult {
    // Reactive-only cards — they have no standalone meaning as an opening
    // move, only as a response to something already on the stack (unlike
    // e.g. Cryopreservation/Situs Inversus, which are also instant but are
    // legitimate first plays too).
    const reactiveOnlyActions = new Set([
      "IMMUNITY_BOOST",
      "METASTASIS",
      "CONTAGIOUS",
    ]);

    const afflictionResponses = new Set(["METASTASIS", "CONTAGIOUS"]); // these are for the affliction,
    // so they can only be played after affliction

    const itemCount = this.#stack.length();

    if (itemCount === 0 && reactiveOnlyActions.has(action.name)) {
      return { success: false, message: "response cannot be the first action" };
    }

    // A response window is already open (something is on the stack awaiting
    // resolution) — only an instant card may join it: isInstant is exactly
    // the game's own "playable out-of-turn/reactively" flag, covering not
    // just Immunity Boost/Metastasis/Contagious but also e.g.
    // Cryopreservation and Situs Inversus (regression: an earlier fix here
    // hardcoded a 3-name allowlist instead of using isInstant, so a
    // Cryopreservation played reactively during someone else's pending
    // affliction was wrongly rejected — the client never surfaces that
    // rejection either, so it looked like the game had frozen). A second
    // non-instant action is a genuinely unrelated new exchange and must
    // still be rejected outright rather than silently merged into the same
    // resolution pass: Timer.start() would otherwise restart the window and
    // GameController#applyActions would run both exchanges' effects together
    // with passTurn() firing once instead of twice, and immunity-boost's
    // stack-adjacency cancellation could pair across the two unrelated
    // actions.
    if (itemCount > 0 && !action.card.isInstant) {
      return {
        success: false,
        message: "another action is still awaiting resolution",
      };
    }

    if (
      itemCount > 0 &&
      this.#stack.peek()?.name !== "AFFLICTION" &&
      afflictionResponses.has(action.name)
    ) {
      return {
        success: false,
        message: `${action.name} can only be played after affliction`,
      };
    }

    if (action.name === "IMMUNITY_BOOST" && itemCount > 0) {
      const { target, boostsAbove } = this.#findBoostTarget();
      // Boosts alternate ownership: the action's own target boosts first to
      // cancel it, then (if contested) the action's original attacker can
      // counter-boost to cancel that cancellation, and so on. Stack
      // adjacency alone (the pre-fix behaviour) let any player's boost
      // cancel anyone's action regardless of who they actually were.
      const expectedBooster = boostsAbove % 2 === 0
        ? target?.opponentID
        : target?.attackerID;

      if (action.attackerID !== expectedBooster) {
        return {
          success: false,
          message:
            "you are not eligible to play Immunity Boost against this action",
        };
      }
    }

    this.#stack.add(action);

    return { success: true };
  }

  /**
   * Walks down from the top of the stack past any contiguous run of
   * IMMUNITY_BOOSTs to find the non-boost action they apply against, and how
   * many boosts are already stacked on top of it.
   */
  #findBoostTarget(): { target: ActionInput | undefined; boostsAbove: number } {
    const stack = this.#stack.toArray();
    let boostsAbove = 0;
    let index = stack.length - 1;

    while (index >= 0 && stack[index].name === "IMMUNITY_BOOST") {
      boostsAbove += 1;
      index -= 1;
    }

    return { target: stack[index], boostsAbove };
  }

  resolve(): ActionResult<ActionInput[]> {
    if (this.#stack.length() === 0) {
      return { success: false, message: "Nothing to resolve in stack" };
    }

    const actions = this.#stack.flush();
    const resolvedActions: ActionInput[] = [];
    let immunityBoostCount = 0;

    for (let index = actions.length - 1; index >= 0; index--) {
      const action = actions[index];

      if (action.name === "IMMUNITY_BOOST") {
        immunityBoostCount += 1;
        continue;
      }

      if (immunityBoostCount > 0) {
        if (immunityBoostCount % 2 === 1) {
          immunityBoostCount = 0;
          continue;
        }
        immunityBoostCount = 0;
      }

      resolvedActions.push(action);
    }

    return { success: true, data: resolvedActions.reverse() };
  }
}
