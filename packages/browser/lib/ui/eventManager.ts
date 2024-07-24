export default class EventManager<EventMap> {
  #events = new EventTarget();

  public on<K extends keyof EventMap>(event: K, callback: EventMap[K]) {
    if (typeof callback !== "function") {
      throw new Error("callback must be a function");
    }

    const handler = (e: Event) => {
      callback((e as CustomEvent).detail);
    };

    this.#events.addEventListener(event as string, handler);

    return () => {
      this.#events.removeEventListener(event as string, handler);
    };
  }

  public dispatch<T>(event: string, payload?: T) {
    const e = new CustomEvent(event, { detail: payload });
    this.#events.dispatchEvent(e);
  }
}