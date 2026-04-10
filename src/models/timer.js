export default class Timer {
  #duration;
  #reject;
  #resolve;
  #timeoutID;
  #startTime;
  constructor(duration) {
    this.#duration = duration;
    this.#reject = () => {};
    this.#resolve = () => {};
    this.#startTime = 0;
  }

  start() {
    this.#reject("rejected");
    clearTimeout(this.#timeoutID);
    this.#startTime = Date.now();
    return new Promise((resolve, reject) => {
      this.#reject = reject;
      this.#resolve = resolve;
      this.#timeoutID = setTimeout(
        () => resolve({ success: true }),
        this.#duration,
      );
    });
  }

  end() {
    this.#resolve({ success: true });
    clearTimeout(this.#timeoutID);
  }

  remaining() {
    const currentTime = Date.now();
    return this.#duration -
      Math.min(currentTime - this.#startTime, this.#duration);
  }
}
