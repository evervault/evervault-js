import { CUSTOM_FIELD_TYPES } from "./customField";
import type { ExpiryLayoutError } from "./expiry";
import type {
  CardSpecNode,
  CardSpecNodeType,
  ExpiryHalf,
} from "types/cardSpec";

// How a platform names the card and each node the developer declares.
export type CardNames = Record<"card" | CardSpecNodeType, string>;

// On the web, the elements' tags.
export const ELEMENT_NAMES: CardNames = {
  card: "ev-card",
  row: "ev-row",
  name: "ev-card-holder",
  number: "ev-card-number",
  expiry: "ev-card-expiry",
  expiryMonth: "ev-card-expiry-month",
  expiryYear: "ev-card-expiry-year",
  cvc: "ev-card-cvc",
  field: "ev-field",
};

// In React and React Native, the components.
export const COMPONENT_NAMES: CardNames = {
  card: "Card",
  row: "Card.Row",
  name: "Card.Holder",
  number: "Card.Number",
  expiry: "Card.Expiry",
  expiryMonth: "Card.ExpiryMonth",
  expiryYear: "Card.ExpiryYear",
  cvc: "Card.Cvc",
  field: "Card.Field",
};

// What the card logs for the developer, in the names they declared.
export function cardMessages(names: CardNames) {
  const card = `<${names.card}>`;
  const node = (type: CardSpecNodeType) => `<${names[type]}>`;

  const duplicateField = (type: CardSpecNodeType) =>
    `${card} ignored a duplicate ${node(type)}.`;

  const duplicateCustomField = (name: string) =>
    `${card} ignored a second ${node("field")} named "${name}".`;

  const namelessCustomField = `${card} ignored a field without a name. Give every ${node(
    "field"
  )} a name.`;

  const combinedExpiryWithHalf = `${card} declares ${node(
    "expiry"
  )} alongside ${node("expiryMonth")} or ${node(
    "expiryYear"
  )}. Declare the combined field or the two halves, not both.`;

  const loneExpiryHalf = (declared: ExpiryHalf) => {
    const missing = declared === "expiryMonth" ? "expiryYear" : "expiryMonth";
    return `${card} declares ${node(declared)} without ${node(
      missing
    )}. A split expiry needs both halves.`;
  };

  return {
    duplicateField,
    duplicateCustomField,
    namelessCustomField,
    combinedExpiryWithHalf,
    loneExpiryHalf,

    expiryLayoutMessage(error: ExpiryLayoutError) {
      if (error.kind === "combinedWithHalf") return combinedExpiryWithHalf;
      return loneExpiryHalf(error.declared);
    },

    // Why a declared node was left out of the card.
    skippedFieldWarning(node: CardSpecNode) {
      if (node.type !== "field") return duplicateField(node.type);

      return node.props.name
        ? duplicateCustomField(node.props.name)
        : namelessCustomField;
    },

    unsupportedFieldType(name: string | undefined, type: string) {
      const types = CUSTOM_FIELD_TYPES.map((type) => `"${type}"`).join(", ");
      return `${card} renders the ${node(
        "field"
      )} named "${name}" as a "text" field: "${type}" is not a type it supports. Types are: ${types}.`;
    },

    invalidPattern(name: string | undefined, pattern: string) {
      return `${card} ignores the pattern of the ${node(
        "field"
      )} named "${name}": "${pattern}" is not a valid regular expression.`;
    },
  };
}
