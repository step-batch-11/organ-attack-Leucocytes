export default class Timer {
  #duration;
  #reject;
  #timeoutID;
  #startTime;
  constructor(duration) {
    this.#duration = duration;
    this.#reject = () => {};
    this.#startTime = 0;
  }

  start() {
    this.#reject("rejected");
    clearTimeout(this.#timeoutID);
    this.#startTime = Date.now();
    return new Promise((resolve, reject) => {
      this.#reject = reject;
      this.#timeoutID = setTimeout(
        () => resolve({ success: true }),
        this.#duration,
      );
    });
  }

  remaining() {
    const currentTime = Date.now();
    return this.#duration -
      Math.min(currentTime - this.#startTime, this.#duration);
  }
}
