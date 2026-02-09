import { NativeEvervault } from "./src/__mocks__/NativeEvervault";
import { TextInput } from "react-native";

vi.mock("./src/specs/NativeEvervault", () => ({ NativeEvervault }));

// TODO: remove this with proper mocking
vi.mock("react-native-mask-input", () => ({ MaskInput: TextInput }));
