import { fireEvent, userEvent, waitFor } from "@testing-library/react-native";
import { encryptedValue } from "../__mocks__/NativeEvervault";
import { lastPayload, renderCard } from "../../test/helpers/card";
import { CUSTOM_FIELD_ERRORS } from "shared/customField";
import { CardField, CardFieldProps } from "./Field";
import { CardHolder } from "./Holder";

async function renderField(props: Partial<CardFieldProps> = {}) {
  const { onChange, ...screen } = await renderCard(
    <CardField testID="postcode" name="postcode" {...props} />
  );

  return { onChange, field: screen.getByTestId("postcode"), ...screen };
}

describe("Card.Field", () => {
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
    const { onChange } = await renderCard(<CardHolder />);

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(lastPayload(onChange)).not.toHaveProperty("fields");
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
    await fireEvent(field, "blur");

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

  it("clears the error as soon as the value is valid", async () => {
    const { onChange, field } = await renderField({ pattern: "[A-Z0-9 ]+" });

    const user = userEvent.setup();
    await user.type(field, "sw1a");
    await fireEvent(field, "blur");
    await waitFor(() =>
      expect(lastPayload(onChange).errors.fields).toBeDefined()
    );

    await user.clear(field);
    await user.type(field, "SW1A", { skipBlur: true });

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        fields: { postcode: encryptedValue },
        errors: {},
      })
    );
  });

  it("reports a required field left empty with the default message", async () => {
    const { onChange, field } = await renderField({ required: true });

    await fireEvent(field, "blur");

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
    const { onChange, rerenderCard } = await renderCard(
      <>
        <CardField name="postcode" />
        <CardField name="email" />
      </>
    );

    await rerenderCard(<CardField name="email" />);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ fields: { email: null } })
      );
    });
  });

  it("keeps a field's place in the payload when its rules change", async () => {
    const { onChange, rerenderCard } = await renderCard(
      <>
        <CardField name="postcode" />
        <CardField name="email" />
      </>
    );

    await rerenderCard(
      <>
        <CardField name="postcode" required />
        <CardField name="email" />
      </>
    );

    await waitFor(() => expect(lastPayload(onChange).isComplete).toBe(false));
    expect(Object.keys(lastPayload(onChange).fields)).toEqual([
      "postcode",
      "email",
    ]);
  });

  describe("rules that change", () => {
    it("drop the value typed under the old ones", async () => {
      const { onChange, getByTestId, rerenderCard } = await renderCard(
        <CardField testID="code" name="code" pattern="\\d+" />
      );

      const user = userEvent.setup();
      await user.type(getByTestId("code"), "123");

      await rerenderCard(
        <CardField testID="code" name="code" pattern="\\d{3}" />
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
      const { onChange, getByTestId, rerenderCard } = await renderCard(
        <CardField testID="code" name="code" pattern="\\d+" />
      );

      const user = userEvent.setup();
      await user.type(getByTestId("code"), "abc");
      await waitFor(() =>
        expect(lastPayload(onChange).errors.fields).toBeDefined()
      );

      await rerenderCard(
        <CardField testID="code" name="code" pattern="[a-z]+" />
      );

      await waitFor(() => expect(lastPayload(onChange).errors).toEqual({}));
    });

    it("keep the value when only the message changes", async () => {
      const { getByTestId, rerenderCard } = await renderCard(
        <CardField testID="code" name="code" pattern="\\d+" />
      );

      const user = userEvent.setup();
      await user.type(getByTestId("code"), "123");

      await rerenderCard(
        <CardField
          testID="code"
          name="code"
          pattern="\\d+"
          errorMessage="Digits only"
        />
      );

      expect(getByTestId("code")).toHaveDisplayValue("123");
    });
  });

  describe("a name the payload object already knows", () => {
    it.each(["constructor", "toString", "__proto__", "name", "number"])(
      "reports %s under exactly that name",
      async (name) => {
        const { onChange, getByTestId } = await renderCard(
          <>
            <CardHolder testID="holder" />
            <CardField testID="custom" name={name} />
          </>
        );

        const user = userEvent.setup();
        await user.type(getByTestId("holder"), "Jo");
        await user.type(getByTestId("custom"), "value");

        await waitFor(() =>
          expect(Object.keys(lastPayload(onChange).fields ?? {})).toEqual([
            name,
          ])
        );
        const { card, fields } = lastPayload(onChange);
        expect(Object.prototype.hasOwnProperty.call(fields, name)).toBe(true);
        expect(Object.getOwnPropertyDescriptor(fields, name)?.value).toBe(
          encryptedValue
        );
        expect(card).toMatchObject({ name: "Jo", number: null });
      }
    );
  });

  describe("its error, shown when the card's validationMode shows a card field's", () => {
    // Whether the holder and the field show an error after each step: typing
    // an invalid value, leaving, typing a valid one, typing an invalid one.
    it.each([
      ["onBlur", [false, true, true, true]],
      ["onChange", [false, false, false, true]],
      ["onTouched", [false, true, false, true]],
      ["all", [false, true, false, true]],
    ] as const)("%s", async (validationMode, shown) => {
      const { onChange, getByTestId } = await renderCard(
        <>
          <CardHolder testID="holder" pattern="[A-Z ]+" />
          <CardField testID="postcode" name="postcode" pattern="[A-Z0-9 ]+" />
        </>,
        { validationMode }
      );

      const fields = [getByTestId("holder"), getByTestId("postcode")];
      const steps = [
        (field: (typeof fields)[number]) => fireEvent.changeText(field, "ab"),
        (field: (typeof fields)[number]) => fireEvent(field, "blur"),
        (field: (typeof fields)[number]) => fireEvent.changeText(field, "AB"),
        (field: (typeof fields)[number]) => fireEvent.changeText(field, "ab"),
      ];

      for (const [index, step] of steps.entries()) {
        for (const field of fields) await step(field);

        await waitFor(() => {
          const { errors } = lastPayload(onChange);
          expect({
            holder: errors.name !== undefined,
            field: errors.fields?.postcode !== undefined,
          }).toEqual({ holder: shown[index], field: shown[index] });
        });
      }
    });
  });
});
