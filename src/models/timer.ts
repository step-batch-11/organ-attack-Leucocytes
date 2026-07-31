import type { ActionResult } from "../types/game.ts";

export default class Timer {
  #duration: number;
  #reject: (reason?: unknown) => void;
  #resolve: (value: ActionResult) => void;
  #timeoutID?: ReturnType<typeof setTimeout>;
  #startTime: number;
  constructor(duration: number) {
    this.#duration = duration;
    this.#reject = () => {};
    this.#resolve = () => {};
    this.#startTime = 0;
  }

  start(): Promise<ActionResult> {
    this.#reject("rejected");
    clearTimeout(this.#timeoutID);
    this.#startTime = Date.now();
    return new Promise<ActionResult>((resolve, reject) => {
      this.#reject = reject;
      this.#resolve = resolve;
      this.#timeoutID = setTimeout(
        () => resolve({ success: true }),
        this.#duration,
      );
    });
  }

  end(): void {
    this.#resolve({ success: true });
    clearTimeout(this.#timeoutID);
    this.#startTime = 0;
  }

  remaining(): number {
    const currentTime = Date.now();
    return this.#duration -
      Math.min(currentTime - this.#startTime, this.#duration);
  }
}
