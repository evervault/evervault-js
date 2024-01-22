export type SdkContext = "inputs" | "default";

export default function getContext(
  origin: string,
  inputsUrl: string
): SdkContext {
  if (origin === inputsUrl) {
    return "inputs";
  }
  return "default";
}
