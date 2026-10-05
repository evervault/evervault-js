import type { BaseEvervaultInputProps } from "../Input";

// The props every card field takes, as the React card's fields do.
export interface CardFieldBaseProps extends BaseEvervaultInputProps {
  /**
   * Replaces the text of this field's error in the payload's `errors`.
   */
  errorMessage?: string;
}
