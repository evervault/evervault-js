import type { BaseEvervaultInputProps } from "../Input";

export interface CardFieldBaseProps extends BaseEvervaultInputProps {
  /**
   * Replaces the text of this field's error in the payload's `errors`.
   */
  errorMessage?: string;
}
