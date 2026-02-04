import { NativeEvervault } from "./src/__mocks__/NativeEvervault";
import { vi } from "vitest";

vi.mock("./src/specs/NativeEvervault", () => ({ NativeEvervault }));
vi.mock(import("react-native-webview"));
