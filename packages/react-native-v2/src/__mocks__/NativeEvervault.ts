import type { Spec } from "../specs/NativeEvervault";

export const encryptedValue =
  "ev:W98t:uu98aas09udya863ty9372y7y23h97rg6gfs678987";

export const NativeEvervault: Spec = {
  initialize: vi.fn(),
  encryptString: vi.fn(() => Promise.resolve(encryptedValue)),
  encryptNumber: vi.fn(() => Promise.resolve(encryptedValue)),
  encryptBoolean: vi.fn(() => Promise.resolve(encryptedValue)),
  encryptObject: vi.fn(),
  encryptArray: vi.fn(),
};
