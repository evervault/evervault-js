/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultFrameSize,
  profilingFrameSize,
} from "../src/ThreeDSecure/frameSize";

function screenOf(width: number, height: number) {
  vi.spyOn(window.screen, "width", "get").mockReturnValue(width);
  vi.spyOn(window.screen, "height", "get").mockReturnValue(height);
}

function viewportOf(width: number, height: number) {
  vi.spyOn(window, "innerWidth", "get").mockReturnValue(width);
  vi.spyOn(window, "innerHeight", "get").mockReturnValue(height);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("defaultFrameSize", () => {
  it("uses 500×600 in a large viewport", () => {
    viewportOf(1440, 900);

    expect(defaultFrameSize()).toEqual({ width: "500px", height: "600px" });
  });

  it("fits a small viewport with CSS units", () => {
    viewportOf(390, 700);

    expect(defaultFrameSize()).toEqual({
      width: "96vw",
      height: "calc(100vh - 100px)",
    });
  });
});

describe("profilingFrameSize", () => {
  it("uses the 3DS window's default size on a large screen", () => {
    screenOf(1440, 900);

    expect(profilingFrameSize()).toEqual({ width: 500, height: 600 });
  });

  it("uses the default size on a screen of exactly 500×600", () => {
    screenOf(500, 600);

    expect(profilingFrameSize()).toEqual({ width: 500, height: 600 });
  });

  it("fits the 3DS window to a phone screen", () => {
    screenOf(390, 844);

    expect(profilingFrameSize()).toEqual({ width: 374, height: 744 });
  });

  it("fits the 3DS window to a short screen", () => {
    screenOf(800, 500);

    expect(profilingFrameSize()).toEqual({ width: 768, height: 400 });
  });

  it("gives whole pixels", () => {
    screenOf(393, 851.5);

    const { width, height } = profilingFrameSize();

    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
  });

  it("never gives a height below 0", () => {
    screenOf(320, 80);

    expect(profilingFrameSize().height).toBe(0);
  });
});
