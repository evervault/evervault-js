import { describe, expect, it } from "vitest";
import {
  settingForInput,
  applyCardSettingsToFields,
} from "../src/Card/fieldSettings";
import { field, node, row } from "./helpers/card";

describe("settingForInput", () => {
  it("applies one value to every input", () => {
    expect(settingForInput(true, "number")).toBe(true);
    expect(settingForInput(false, "field-postcode")).toBe(false);
  });

  it("leaves an input the card says nothing about to its default", () => {
    expect(settingForInput(undefined, "cvc")).toBeUndefined();
    expect(settingForInput({ number: true }, "cvc")).toBeUndefined();
  });

  it("reads each card field by its key", () => {
    expect(settingForInput({ number: true, cvc: false }, "number")).toBe(true);
    expect(settingForInput({ number: true, cvc: false }, "cvc")).toBe(false);
  });

  it("gives an expiry half its own key before the expiry's", () => {
    const setting = { expiry: true, expiryYear: false };

    expect(settingForInput(setting, "expiry-month")).toBe(true);
    expect(settingForInput(setting, "expiry-year")).toBe(false);
  });

  it("reads the customer's fields as one value or each by name", () => {
    expect(settingForInput({ fields: true }, "field-postcode")).toBe(true);
    expect(
      settingForInput({ fields: { postcode: false } }, "field-postcode")
    ).toBe(false);
    expect(settingForInput({ fields: { email: true } }, "field-postcode")).toBe(
      undefined
    );
  });

  it("never reads a customer's field named like a card field as it", () => {
    expect(settingForInput({ number: true }, "field-number")).toBeUndefined();
  });
});

describe("applyCardSettingsToFields", () => {
  it("fills a custom field's settings in from the card", () => {
    const [settled] = applyCardSettingsToFields(
      [field("f", { name: "postcode" })],
      {
        translations: { fields: { postcode: { label: "Postcode" } } },
        validation: { fields: { postcode: { required: true, maxLength: 8 } } },
        defaultValues: { fields: { postcode: "SW1A" } },
        autoComplete: { fields: false },
        autoProgress: { fields: { postcode: true } },
      }
    );

    expect(settled.props).toEqual({
      name: "postcode",
      label: "Postcode",
      required: "",
      maxlength: "8",
      defaultvalue: "SW1A",
      autocomplete: "false",
      autoprogress: "",
    });
  });

  it("keeps a setting the field declares itself", () => {
    const [settled] = applyCardSettingsToFields(
      [field("f", { name: "postcode", label: "Mine" })],
      { translations: { fields: { postcode: { label: "Card's" } } } }
    );

    expect(settled.props.label).toBe("Mine");
  });

  it("reaches custom fields inside rows", () => {
    const [settled] = applyCardSettingsToFields(
      [row("r", [field("f", { name: "postcode" })])],
      { autoProgress: true }
    );

    expect(settled.children?.[0].props.autoprogress).toBe("");
  });

  it("returns the same tree when the card sets nothing for its fields", () => {
    const nodes = [node("number"), field("f", { name: "postcode" })];

    expect(
      applyCardSettingsToFields(nodes, { autoProgress: { number: true } })
    ).toBe(nodes);
  });
});
