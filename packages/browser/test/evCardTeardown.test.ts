import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EV_CARD_TAG_NAME,
  EvCard,
  registerEvCard,
} from "../lib/ui/elements/evCard";
import type EvervaultClient from "../lib/main";
import { countMessageListeners } from "./helpers/messageListeners";

// The real card frame, so the count is of what the element actually leaves
// behind on the window.
const client = {
  config: {
    teamId: "team_test123",
    appId: "app_test123",
    components: { url: "https://ui-components.evervault.com" },
  },
} as unknown as EvervaultClient;

beforeAll(() => {
  registerEvCard(() => client);
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function append() {
  const element = document.createElement(EV_CARD_TAG_NAME) as EvCard;
  document.body.append(element);
  element.mountCard(client);
  return element;
}

describe("<ev-card> teardown", () => {
  it("releases every window listener when removed from the DOM", () => {
    const listeners = countMessageListeners();
    const element = append();

    expect(listeners()).toBe(10);

    element.remove();

    expect(listeners()).toBe(0);
  });

  it("holds no listeners after repeated moves in the DOM", () => {
    const listeners = countMessageListeners();
    const element = append();
    const other = document.createElement("div");
    document.body.append(other);

    for (let i = 0; i < 20; i += 1) {
      (i % 2 === 0 ? other : document.body).append(element);
    }

    expect(listeners()).toBe(10);

    element.remove();

    expect(listeners()).toBe(0);
  });
});
