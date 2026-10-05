import userEvent from "@testing-library/user-event";
/**
 * @vitest-environment jsdom
 */

import {
  createEvent,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import {
  NAMELESS_CUSTOM_FIELD,
  duplicateCustomField,
  unsupportedFieldType,
} from "../src/Card/developerMessages";
import type { CardConfig } from "../src/Card/types";
import type { CardSpecNode } from "types";
import {
  apply,
  fieldNames,
  field,
  input,
  node,
  row,
  spec,
} from "./helpers/card";

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({ encrypt: vi.fn() }),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("../src/utilities/useMessaging", () => ({
  useMessaging: () => ({
    send,
    on: (type: string, callback: (payload: unknown) => void) => {
      if (type === "EV_SPEC_PATCH") {
        spec.patch = callback as typeof spec.patch;
      }
      return () => {};
    },
  }),
}));

const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

beforeEach(() => {
  send.mockClear();
  warn.mockClear();
});

afterEach(() => {
  document.body.innerHTML = "";
});

function card(nodes: CardSpecNode[], config: CardConfig = {}) {
  const { container } = render(<Card config={{ ...config, fields: nodes }} />);

  return container;
}

describe("<ev-field>", () => {
  it("renders an input named after the field", () => {
    const container = card([field("postcode", { name: "postcode" })]);

    const postcode = input(container, "field-postcode");

    expect(postcode.name).toBe("postcode");
    expect(postcode.type).toBe("text");
    expect(fieldNames(container)).toEqual(["field-postcode"]);
  });

  it("renders the declared label, placeholder and tooltip", () => {
    const container = card([
      field("postcode", {
        name: "postcode",
        label: "Postcode",
        placeholder: "SW1A 1AA",
        tooltip: "Where the card is billed",
      }),
    ]);

    const label = container.querySelector("label[for=field-postcode]");

    expect(label?.textContent).toBe("Postcode");
    expect(input(container, "field-postcode").placeholder).toBe("SW1A 1AA");
    expect(container.querySelector("[ev-tooltip]")?.textContent).toBe(
      "Where the card is billed"
    );
  });

  it("renders no label when none is declared", () => {
    const container = card([field("postcode", { name: "postcode" })]);

    expect(container.querySelector("label")).toBeNull();
  });

  it("renders alongside the card fields in declared order", () => {
    const container = card([
      node("number"),
      row("row", [node("cvc"), field("postcode", { name: "postcode" })]),
    ]);

    expect(fieldNames(container)).toEqual(["number", "cvc", "field-postcode"]);
  });

  it("is not one of the card's fields", () => {
    const container = card([
      node("number"),
      field("postcode", { name: "postcode" }),
    ]);

    expect(
      container.querySelector("[ev-component=card]")?.getAttribute("ev-fields")
    ).toBe("number");
  });

  it("keeps what was typed", async () => {
    const container = card([field("postcode", { name: "postcode" })]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    expect(input(container, "field-postcode").value).toBe("SW1A 1AA");
  });

  it("keeps what was typed when the tree is patched around it", async () => {
    const container = card([
      node("number"),
      field("postcode", { name: "postcode" }),
    ]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    apply([{ op: "move", id: "postcode", parentId: null, index: 0 }]);

    expect(fieldNames(container)).toEqual(["field-postcode", "number"]);
    expect(input(container, "field-postcode").value).toBe("SW1A 1AA");
  });

  it("brings its value back when declared again", async () => {
    const postcode = field("postcode", { name: "postcode" });
    const container = card([node("number"), postcode]);

    await userEvent.type(input(container, "field-postcode"), "SW1A 1AA");

    apply([{ op: "remove", id: "postcode" }]);
    expect(container.querySelector("#field-postcode")).toBeNull();

    apply([{ op: "insert", parentId: null, index: 1, node: postcode }]);
    expect(input(container, "field-postcode").value).toBe("SW1A 1AA");
  });

  it("is ignored with a warning when declared without a name", async () => {
    const container = card([node("number"), field("nameless")]);

    expect(fieldNames(container)).toEqual(["number"]);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(NAMELESS_CUSTOM_FIELD)
    );
  });

  it("renders the first of two fields with one name and warns about the second", async () => {
    const container = card([
      field("first", { name: "postcode", label: "First" }),
      field("second", { name: "postcode", label: "Second" }),
    ]);

    expect(fieldNames(container)).toEqual(["field-postcode"]);
    expect(container.querySelector("label")?.textContent).toBe("First");
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(duplicateCustomField("postcode"))
    );
  });

  it("warns once while the same fields are ignored", async () => {
    card([field("nameless")]);

    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));

    apply([{ op: "update", id: "nameless", props: { label: "Still none" } }]);

    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("<ev-field> type", () => {
  it.each(["text", "email", "tel", "url", "number", "date"])(
    "renders a %s input",
    (declared) => {
      const container = card([
        field("custom", { name: "custom", type: declared }),
      ]);

      expect(input(container, "field-custom").type).toBe(declared);
    }
  );

  it("renders an unsupported type as text, with a warning", async () => {
    const container = card([
      field("custom", { name: "custom", type: "checkbox" }),
    ]);

    expect(input(container, "field-custom").type).toBe("text");
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        unsupportedFieldType("custom", "checkbox")
      )
    );
  });
});

describe("<ev-field> input attributes", () => {
  it("carries the input attributes onto the input", () => {
    const container = card([
      field("custom", {
        name: "custom",
        type: "number",
        inputmode: "decimal",
        autocapitalize: "characters",
        enterkeyhint: "next",
        maxlength: "8",
        min: "1",
        max: "10",
        step: "0.5",
      }),
    ]);

    const custom = input(container, "field-custom");

    expect(custom.inputMode).toBe("decimal");
    expect(custom.getAttribute("autocapitalize")).toBe("characters");
    expect(custom.getAttribute("enterkeyhint")).toBe("next");
    expect(custom.maxLength).toBe(8);
    expect(custom.min).toBe("1");
    expect(custom.max).toBe("10");
    expect(custom.step).toBe("0.5");
  });

  it("drops a maxlength that is not a length", () => {
    const container = card([
      field("custom", { name: "custom", maxlength: "many" }),
    ]);

    expect(input(container, "field-custom").hasAttribute("maxlength")).toBe(
      false
    );
  });

  it("makes the input read-only when declared readonly", () => {
    const container = card([field("custom", { name: "custom", readonly: "" })]);

    expect(input(container, "field-custom").readOnly).toBe(true);
  });

  it('keeps the input editable when declared readonly="false"', () => {
    const container = card([
      field("custom", { name: "custom", readonly: "false" }),
    ]);

    expect(input(container, "field-custom").readOnly).toBe(false);
  });

  it.each([
    ["", "true"],
    ["false", "false"],
  ])('spellchecks as declared by spellcheck="%s"', (declared, expected) => {
    const container = card([
      field("custom", { name: "custom", spellcheck: declared }),
    ]);

    expect(input(container, "field-custom").getAttribute("spellcheck")).toBe(
      expected
    );
  });
});

describe("<ev-field> autocapitalize", () => {
  it("capitalises what is typed on any keyboard", async () => {
    const container = card([
      field("postcode", { name: "postcode", autocapitalize: "characters" }),
    ]);

    await userEvent.type(input(container, "field-postcode"), "sw1a 1aa");

    expect(input(container, "field-postcode").value).toBe("SW1A 1AA");
  });

  it("carries the declared autocapitalize onto the input", () => {
    const container = card([
      field("custom", { name: "custom", autocapitalize: "off" }),
    ]);

    expect(
      input(container, "field-custom").getAttribute("autocapitalize")
    ).toBe("none");
  });
});

describe("<ev-field> autocomplete", () => {
  it.each([
    ["", "on"],
    ["true", "on"],
    ["on", "on"],
    ["false", "off"],
    ["off", "off"],
    ["postal-code", "postal-code"],
    ["shipping postal-code", "shipping postal-code"],
  ])('autocompletes autocomplete="%s" as "%s"', (declared, expected) => {
    const container = card([
      field("custom", { name: "custom", autocomplete: declared }),
    ]);

    expect(input(container, "field-custom").autocomplete).toBe(expected);
  });

  it("leaves autocomplete to the browser when not declared", () => {
    const container = card([field("custom", { name: "custom" })]);

    expect(input(container, "field-custom").hasAttribute("autocomplete")).toBe(
      false
    );
  });
});

describe("<ev-field> defaultvalue", () => {
  it("fills the field with the declared default value", async () => {
    const container = card([
      field("custom", { name: "custom", defaultvalue: "Hello" }),
    ]);

    await waitFor(() =>
      expect(input(container, "field-custom").value).toBe("Hello")
    );
  });

  it("takes a new default value while the customer has typed nothing", async () => {
    const container = card([
      field("custom", { name: "custom", defaultvalue: "Hello" }),
    ]);

    await waitFor(() =>
      expect(input(container, "field-custom").value).toBe("Hello")
    );

    apply([
      {
        op: "update",
        id: "custom",
        props: { name: "custom", defaultvalue: "Goodbye" },
      },
    ]);

    await waitFor(() =>
      expect(input(container, "field-custom").value).toBe("Goodbye")
    );
  });

  it("keeps the typed value when the default value changes", async () => {
    const container = card([
      field("custom", { name: "custom", defaultvalue: "Hello" }),
    ]);

    await waitFor(() =>
      expect(input(container, "field-custom").value).toBe("Hello")
    );

    await userEvent.clear(input(container, "field-custom"));
    await userEvent.type(input(container, "field-custom"), "Typed");

    apply([
      {
        op: "update",
        id: "custom",
        props: { name: "custom", defaultvalue: "Goodbye" },
      },
    ]);

    await waitFor(() =>
      expect(input(container, "field-custom").value).toBe("Typed")
    );
  });
});

describe("<ev-field> focus", () => {
  it("is focused when declared autofocus", async () => {
    card([node("number"), field("custom", { name: "custom", autofocus: "" })]);

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("field-custom")
    );
  });

  it("is advanced into from the card field before it", async () => {
    const container = card(
      [node("number"), field("custom", { name: "custom" })],
      {
        autoProgress: true,
      }
    );

    await userEvent.type(input(container, "number"), "4242424242424242");

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("field-custom")
    );
  });

  it("steps back to the field before it on a backspace while empty", () => {
    const container = card([node("cvc"), field("custom", { name: "custom" })], {
      autoProgress: true,
    });

    const custom = input(container, "field-custom");
    custom.focus();

    const event = createEvent.keyDown(custom, { key: "Backspace" });
    fireEvent(custom, event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe("cvc");
  });
});

describe("<ev-field> events", () => {
  it.each([
    ["EV_FOCUS", fireEvent.focus],
    ["EV_BLUR", fireEvent.blur],
    ["EV_KEYDOWN", fireEvent.keyDown],
    ["EV_KEYUP", fireEvent.keyUp],
  ] as const)("names the field in %s", (message, fire) => {
    const container = card([field("postcode", { name: "postcode" })]);

    fire(input(container, "field-postcode"));

    expect(send).toHaveBeenCalledWith(message, {
      field: "field",
      name: "postcode",
    });
  });

  it("names a field called number apart from the card number", () => {
    const container = card([
      node("number"),
      field("custom", { name: "number" }),
    ]);

    fireEvent.focus(input(container, "field-number"));

    expect(send).toHaveBeenCalledWith("EV_FOCUS", {
      field: "field",
      name: "number",
    });
    expect(send).not.toHaveBeenCalledWith("EV_FOCUS", "number");
  });
});
