import { NativeEvervault } from "./__mocks__/NativeEvervault";
import { Encrypted, sdk } from "./sdk";

describe("sdk", () => {
  describe("verify", () => {
    it("should return true", () => {
      expect(sdk.verify()).toBe(true);
    });
  });

  describe("initialize", () => {
    it("throws an error if teamId is not provided", () => {
      expect(() => sdk.initialize("", "appId")).toThrow("Team ID is required.");
    });

    it("throws an error if appId is not provided", () => {
      expect(() => sdk.initialize("teamId", "")).toThrow("App ID is required.");
    });

    it("initializes the sdk", () => {
      sdk.initialize("teamId", "appId");
      expect(NativeEvervault.initialize).toHaveBeenCalledWith(
        "teamId",
        "appId"
      );
    });
  });

  describe("encrypt", () => {
    it("encrypts an undefined value", async () => {
      const result = await sdk.encrypt(undefined);
      expect(result).toBe(undefined);
      expect(NativeEvervault.encryptString).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptNumber).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptBoolean).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptObject).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptArray).not.toHaveBeenCalled();
    });

    it("encrypts a null value", async () => {
      const result = await sdk.encrypt(null);
      expect(result).toBe(null);
      expect(NativeEvervault.encryptString).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptNumber).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptBoolean).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptObject).not.toHaveBeenCalled();
      expect(NativeEvervault.encryptArray).not.toHaveBeenCalled();
    });

    it("encrypts a string", async () => {
      await sdk.encrypt("hello");
      expect(NativeEvervault.encryptString).toHaveBeenCalledWith("hello");
      assertType<Promise<string>>(sdk.encrypt("hello"));
    });

    it("encrypts a number", async () => {
      await sdk.encrypt(123);
      expect(NativeEvervault.encryptNumber).toHaveBeenCalledWith(123);
      assertType<Promise<string>>(sdk.encrypt(123));
    });

    it("encrypts a boolean", async () => {
      await sdk.encrypt(true);
      expect(NativeEvervault.encryptBoolean).toHaveBeenCalledWith(true);
      assertType<Promise<string>>(sdk.encrypt(true));
    });

    it("encrypts an object", async () => {
      await sdk.encrypt({ a: 1, b: 2 });
      expect(NativeEvervault.encryptObject).toHaveBeenCalledWith({
        a: 1,
        b: 2,
      });
      assertType<Promise<{ a: string; b: string }>>(
        sdk.encrypt({ a: 1, b: 2 })
      );
    });

    it("encrypts a deep object", async () => {
      await sdk.encrypt({ a: 1, b: { c: 2, d: 3 } });
      expect(NativeEvervault.encryptObject).toHaveBeenCalledWith({
        a: 1,
        b: { c: 2, d: 3 },
      });
      assertType<Promise<{ a: string; b: { c: string; d: string } }>>(
        sdk.encrypt({ a: 1, b: { c: 2, d: 3 } })
      );
    });

    it("encrypts an array", async () => {
      await sdk.encrypt([1, 2, 3]);
      expect(NativeEvervault.encryptArray).toHaveBeenCalledWith([1, 2, 3]);
      assertType<Promise<Array<string>>>(sdk.encrypt([1, 2, 3]));
    });

    it("throws an error if the data is not supported", async () => {
      const fn = () => {};
      await expect(() => sdk.encrypt(fn)).rejects.toThrow(
        "Unsupported data type."
      );
      assertType<() => Promise<never>>(() => sdk.encrypt(fn));

      const symbol = Symbol("test");
      await expect(() => sdk.encrypt(symbol)).rejects.toThrow(
        "Unsupported data type."
      );
      assertType<() => Promise<never>>(() => sdk.encrypt(symbol));
    });
  });
});
