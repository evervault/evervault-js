/**
 * @vitest-environment jsdom
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Card } from "../src/Card";
import type { CardConfig } from "../src/Card/types";
import type { CardField } from "types";
import { settle, type } from "./helpers/card";

vi.mock("@evervault/react", () => ({
  useEvervault: () => ({ encrypt: vi.fn(async (value) => `ev:${value}`) }),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("../src/utilities/useMessaging", () => ({
  useMessaging: () => ({ send, on: () => () => {} }),
}));

// A recording of how the renderer answered the `ui.card()` field options
// before it read a node tree; re-record with RECORD_CARD_LEGACY_FIXTURE=true.
interface LegacyOptions {
  fields?: string[];
  hiddenFields?: string;
  autoProgress?: boolean;
  autoFocus?: boolean;
}

interface Input {
  type: string;
  placeholder: string;
  autocomplete: string | null;
  readOnly: boolean;
  label: string | null;
}

interface Observation {
  fields: string;
  evFields: string;
  focusedAfterMount: string | null;
  focusedAfterNumber: string | null;
  isComplete: boolean | null;
}

interface Sample {
  options: LegacyOptions;
  observation: Observation;
}

const FIXTURE = join(__dirname, "fixtures", "cardLegacyFields.jsonl");
const RECORD = process.env.RECORD_CARD_LEGACY_FIXTURE === "true";

const FIELD_ORDER: CardField[] = ["name", "number", "expiry", "cvc"];
const VALUES: Record<CardField, string> = {
  name: "Jane Doe",
  number: "4242424242424242",
  expiry: "1230",
  cvc: "123",
};

function focused() {
  const id = document.activeElement?.id;
  return id ? id : null;
}

// `ev-fields` used to echo `config.fields` as given, invalid entries and all.
// It now lists what renders, so it is compared as the set of valid fields,
// which is the only way anything in the repo reads it.
function validFields(evFields: string | null) {
  const listed = (evFields ?? "").split(",");
  return FIELD_ORDER.filter((field) => listed.includes(field)).join(",");
}

async function observe(options: LegacyOptions) {
  send.mockClear();

  const { container, unmount } = render(
    <Card config={options as CardConfig} />
  );

  await settle();

  const focusedAfterMount = focused();

  const fields = [...container.querySelectorAll("[ev-name]")]
    .map((field) => field.getAttribute("ev-name"))
    .join(",");

  const evFields = validFields(
    container.querySelector("fieldset")?.getAttribute("ev-fields") ?? null
  );

  const inputs = Object.fromEntries(
    [...container.querySelectorAll("input")].map((input): [string, Input] => [
      input.id,
      {
        type: input.type,
        placeholder: input.placeholder,
        autocomplete: input.getAttribute("autocomplete"),
        readOnly: input.readOnly,
        label:
          container.querySelector(`label[for="${input.id}"]`)?.textContent ??
          null,
      },
    ])
  );

  let focusedAfterNumber: string | null = null;
  const number = container.querySelector<HTMLInputElement>("#number");

  if (number) {
    type(number, VALUES.number);
    await settle();
    focusedAfterNumber = focused();
  }

  for (const field of FIELD_ORDER) {
    if (field === "number") continue;
    const input = container.querySelector<HTMLInputElement>(`#${field}`);
    if (input) type(input, VALUES[field]);
  }

  let isComplete: boolean | null = null;
  const typed = Object.keys(inputs).length;

  if (typed > 0) {
    // Every input typed into answers with its own change.
    const changes = () =>
      send.mock.calls.filter(([type]) => type === "EV_CHANGE");
    await waitFor(() => expect(changes().length).toBeGreaterThanOrEqual(typed));

    isComplete = changes().at(-1)?.[1].isComplete;
  }

  unmount();

  const observation: Observation = {
    fields,
    evFields,
    focusedAfterMount,
    focusedAfterNumber,
    isComplete,
  };

  return { observation, inputs };
}

// A small deterministic generator, so the recording can be reproduced.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HAND_PICKED: LegacyOptions[] = [
  {},
  { fields: [] },
  { fields: ["number", "expiry", "cvc"] },
  { fields: ["name", "number", "expiry", "cvc"] },
  { fields: ["cvc", "number", "expiry"] },
  { fields: ["cvc", "expiry", "number", "name"] },
  { fields: ["number", "number"] },
  { fields: ["number", "cvc", "number"] },
  { fields: ["foo"] },
  { fields: ["number", "foo", "cvc"] },
  { fields: ["number", "cvc"] },
  { fields: ["number", "expiry"] },
  { fields: ["expiry", "cvc"] },
  { fields: ["name"] },
  { hiddenFields: "expiry" },
  { hiddenFields: "cvc" },
  { hiddenFields: "number" },
  { hiddenFields: "expiry,cvc" },
  { hiddenFields: "number,expiry,cvc" },
  { fields: ["number", "expiry", "cvc"], hiddenFields: "expiry" },
  { fields: ["name", "number"], hiddenFields: "number" },
  { autoProgress: true },
  { autoProgress: true, fields: ["number", "cvc"] },
  { autoProgress: true, hiddenFields: "expiry" },
  { autoProgress: true, fields: ["cvc", "number"] },
  { autoProgress: true, fields: ["expiry", "number"] },
  { autoFocus: true },
  { autoFocus: true, fields: ["name", "number", "expiry", "cvc"] },
  { autoFocus: true, fields: ["cvc", "expiry"] },
  { autoFocus: true, hiddenFields: "number" },
];

function generate(count: number): LegacyOptions[] {
  const next = random(1491);
  const pool = ["name", "number", "expiry", "cvc", "foo"];
  const hideable = ["number", "expiry", "cvc"];
  const pick = (items: string[]) => items[Math.floor(next() * items.length)];
  const options: LegacyOptions[] = [];

  while (options.length < count) {
    const sample: LegacyOptions = {};

    if (next() < 0.7) {
      const length = Math.floor(next() * 6);
      sample.fields = Array.from({ length }, () => pick(pool));
    }

    if (next() < 0.4) {
      sample.hiddenFields = hideable.filter(() => next() < 0.5).join(",");
    }

    if (next() < 0.5) sample.autoProgress = true;
    if (next() < 0.3) sample.autoFocus = true;

    options.push(sample);
  }

  return options;
}

const SAMPLES = [...HAND_PICKED, ...generate(170)];

function readFixture() {
  const [inputs, ...samples] = readFileSync(FIXTURE, "utf-8")
    .trim()
    .split("\n");

  return {
    inputs: JSON.parse(inputs) as Record<string, Input>,
    samples: samples.map((line) => JSON.parse(line) as Sample),
  };
}

describe("card fields from ui.card() options", () => {
  if (RECORD) {
    it("records how the renderer answers the legacy options", async () => {
      const inputs: Record<string, Input> = {};
      const lines: string[] = [];

      for (const options of SAMPLES) {
        const observed = await observe(options);

        for (const [id, input] of Object.entries(observed.inputs)) {
          if (inputs[id]) expect(input).toEqual(inputs[id]);
          inputs[id] = input;
        }

        lines.push(
          JSON.stringify({ options, observation: observed.observation })
        );
      }

      writeFileSync(
        FIXTURE,
        `${[JSON.stringify(inputs), ...lines].join("\n")}\n`
      );
    }, 120_000);

    return;
  }

  const { inputs, samples } = readFixture();

  it("covers every sample the recording was made from", () => {
    expect(samples.map((sample) => sample.options)).toEqual(SAMPLES);
  });

  for (const { options, observation } of samples) {
    it(`renders ${JSON.stringify(options)} as recorded`, async () => {
      const observed = await observe(options);

      expect(observed.observation).toEqual(observation);

      for (const [id, input] of Object.entries(observed.inputs)) {
        expect(input).toEqual(inputs[id]);
      }
    });
  }
});
