import { NativeEvervault } from "./src/__mocks__/NativeEvervault";

vi.mock("./src/specs/NativeEvervault", () => ({ NativeEvervault }));

afterEach(() => {
  vi.clearAllMocks();
});
