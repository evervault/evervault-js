import { describe, it, assert, afterEach } from "vitest";
import resolveTopLevelDomain from "../lib/utils/resolveTopLevelDomain";

const originalLocation = window.location;

function makeAncestorOrigins(origins: string[]): DOMStringList {
  const indexed: Record<number, string> = {};
  origins.forEach((origin, i) => {
    indexed[i] = origin;
  });
  return {
    ...indexed,
    length: origins.length,
    item: (i: number) => origins[i] ?? null,
    contains: (s: string) => origins.includes(s),
  } as unknown as DOMStringList;
}

function mockLocation(origin: string, ancestorOrigins?: string[]): void {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      origin,
      ancestorOrigins: ancestorOrigins
        ? makeAncestorOrigins(ancestorOrigins)
        : undefined,
    },
  });
}

describe("resolveTopLevelDomain", () => {
  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("uses the current frame origin when not embedded", () => {
    mockLocation("https://widget.example.com", []);
    assert.equal(resolveTopLevelDomain(), "widget.example.com");
  });

  it("uses the current frame origin when ancestorOrigins is unavailable", () => {
    mockLocation("https://widget.example.com");
    assert.equal(resolveTopLevelDomain(), "widget.example.com");
  });

  it("uses the top-level origin when embedded one level deep", () => {
    mockLocation("https://widget.psp.example", [
      "https://store.merchant.example",
    ]);
    assert.equal(resolveTopLevelDomain(), "store.merchant.example");
  });

  it("uses the furthest ancestor (top-level) when nested multiple levels", () => {
    mockLocation("https://widget.psp.example", [
      "https://middle.example.com",
      "https://shop.example.com",
    ]);
    assert.equal(resolveTopLevelDomain(), "shop.example.com");
  });

  it("falls back to the current frame origin when the top-level origin is opaque", () => {
    mockLocation("https://widget.psp.example", ["null"]);
    assert.equal(resolveTopLevelDomain(), "widget.psp.example");
  });

  it("strips the protocol from the resolved origin", () => {
    mockLocation("http://localhost:3000", ["http://top.example.com:8080"]);
    assert.equal(resolveTopLevelDomain(), "top.example.com:8080");
  });
});
