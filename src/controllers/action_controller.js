export default class ActionController {
  #stack;
  constructor(stack) {
    this.#stack = stack;
  }

  add(action) {
    const responseActions = new Set([
      "IMMUNITY_BOOST",
      "METASTASIS",
      "CONTAGIOUS",
    ]);

    const afflictionResponses = new Set(["METASTASIS", "CONTAGIOUS"]);

    if (this.#stack.length() === 0 && responseActions.has(action.name)) {
      return { success: false, message: "response cannot be the first action" };
    }

    if (
      this.#stack.length() > 0 &&
      this.#stack.peek().name !== "AFFLICTION" &&
      afflictionResponses.has(action.name)
    ) {
      return {
        success: false,
        message: `${action.name} can only be played after affliction`,
      };
    }

    this.#stack.add(action);
    return { success: true };
  }

  resolve() {
    if (this.#stack.length() === 0) {
      return { success: false, message: "Nothing to resolve in stack" };
    }

    if (this.#stack.length() === 1) {
      return { success: true, data: this.#stack.flush() };
    }

    while (this.#stack.length() >= 0) {
      if (
        this.#stack.peek() === undefined ||
        this.#stack.peek().name !== "IMMUNITY_BOOST"
      ) {
        return { success: true, data: this.#stack.flush() };
      }

      this.#stack.consume();
      this.#stack.consume();
    }
  }
}
