import {
  fireEvent,
  render,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { vi } from "vitest";
import { encryptedValue } from "../__mocks__/NativeEvervault";
import { lastPayload, renderCard, wrapper } from "../../test/helpers/card";
import { Card } from "./Root";
import { CUSTOM_FIELD_ERRORS } from "shared/customField";
import { CardField, CardFieldProps } from "./Field";
import { CardHolder } from "./Holder";

async function renderField(props: Partial<CardFieldProps> = {}) {
  const { onChange, ...screen } = await renderCard(
    <CardField testID="postcode" name="postcode" {...props} />
  );

  return { onChange, field: screen.getByTestId("postcode"), ...screen };
}

it("reports its value encrypted under its name", async () => {
  const { onChange, field } = await renderField();

  const user = userEvent.setup();
  await user.type(field, "SW1A 1AA");

  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      fields: { postcode: encryptedValue },
      isValid: true,
      isComplete: true,
    })
  );
});

it("reports an empty field as null", async () => {
  const { onChange } = await renderField();

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fields: { postcode: null } })
    );
  });
});

it("reports no fields when the card declares none", async () => {
  const onChange = vi.fn();
  await render(
    <Card onChange={onChange}>
      <CardHolder />
    </Card>,
    { wrapper }
  );

  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(onChange.mock.lastCall?.[0]).not.toHaveProperty("fields");
});

it("holds the card back from complete while a required field is empty", async () => {
  const { onChange } = await renderField({ required: true });

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ isComplete: false, errors: {} })
    );
  });
});

it("reports a broken rule once the field has been left", async () => {
  const { onChange, field } = await renderField({
    pattern: "[A-Z0-9 ]+",
    errorMessage: "Enter a postcode",
  });

  const user = userEvent.setup();
  await user.type(field, "sw1a");
  fireEvent(field, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fields: { postcode: null },
        isValid: false,
        errors: { fields: { postcode: "Enter a postcode" } },
      })
    );
  });
});

it("reports a required field left empty with the default message", async () => {
  const { onChange, field } = await renderField({ required: true });

  fireEvent(field, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        errors: { fields: { postcode: CUSTOM_FIELD_ERRORS.required } },
      })
    );
  });
});

it("takes no more than its maximum length", async () => {
  const { field } = await renderField({ maxLength: 4 });

  expect(field).toHaveProp("maxLength", 4);
});

it("drops a field no longer declared from the payload", async () => {
  const onChange = vi.fn();
  const { rerender } = await render(
    <Card onChange={onChange}>
      <CardField name="postcode" />
      <CardField name="email" />
    </Card>,
    { wrapper }
  );

  await rerender(
    <Card onChange={onChange}>
      <CardField name="email" />
    </Card>
  );

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fields: { email: null } })
    );
  });
});

it("keeps a field's place in the payload when its rules change", async () => {
  const { onChange, rerender } = await renderCard(
    <>
      <CardField name="postcode" />
      <CardField name="email" />
    </>
  );

  await rerender(
    <Card onChange={onChange}>
      <CardField name="postcode" required />
      <CardField name="email" />
    </Card>
  );

  await waitFor(() => expect(lastPayload(onChange).isComplete).toBe(false));
  expect(Object.keys(lastPayload(onChange).fields)).toEqual([
    "postcode",
    "email",
  ]);
});

describe("rules that change", () => {
  it("drop the value typed under the old ones", async () => {
    const { onChange, getByTestId, rerender } = await renderCard(
      <CardField testID="code" name="code" pattern="\\d+" />
    );

    const user = userEvent.setup();
    await user.type(getByTestId("code"), "123");

    await rerender(
      <Card onChange={onChange}>
        <CardField testID="code" name="code" pattern="\\d{3}" />
      </Card>
    );

    expect(getByTestId("code")).toHaveDisplayValue("");
    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        fields: { code: null },
        errors: {},
      })
    );
  });

  it("drop the error shown under the old ones", async () => {
    const { onChange, getByTestId, rerender } = await renderCard(
      <CardField testID="code" name="code" pattern="\\d+" />
    );

    const user = userEvent.setup();
    await user.type(getByTestId("code"), "abc");
    await waitFor(() =>
      expect(lastPayload(onChange).errors.fields).toBeDefined()
    );

    await rerender(
      <Card onChange={onChange}>
        <CardField testID="code" name="code" pattern="[a-z]+" />
      </Card>
    );

    await waitFor(() => expect(lastPayload(onChange).errors).toEqual({}));
  });

  it("keep the value when only the message changes", async () => {
    const { getByTestId, rerender } = await renderCard(
      <CardField testID="code" name="code" pattern="\\d+" />
    );

    const user = userEvent.setup();
    await user.type(getByTestId("code"), "123");

    await rerender(
      <Card>
        <CardField
          testID="code"
          name="code"
          pattern="\\d+"
          errorMessage="Digits only"
        />
      </Card>
    );

    expect(getByTestId("code")).toHaveDisplayValue("123");
  });
});

describe("a name declared twice", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("takes the rules of the first field declaring it", async () => {
    const { onChange } = await renderCard(
      <>
        <CardField name="postcode" required />
        <CardField name="postcode" />
      </>
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(lastPayload(onChange)).toMatchObject({
      fields: { postcode: null },
      isComplete: false,
    });
  });

  it("keeps reporting the name once the other field is gone", async () => {
    const { onChange, rerender } = await renderCard(
      <>
        <CardField name="postcode" required />
        <CardField name="postcode" />
      </>
    );

    await rerender(
      <Card onChange={onChange}>
        <CardField name="postcode" required />
      </Card>
    );

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        fields: { postcode: null },
        isComplete: false,
      })
    );
  });
});
