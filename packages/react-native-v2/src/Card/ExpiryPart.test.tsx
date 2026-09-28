import { fireEvent, userEvent, waitFor } from "@testing-library/react-native";
import { renderCard } from "../../test/helpers/card";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryPart";

async function renderSplit() {
  const { onChange, ...screen } = await renderCard(
    <>
      <CardExpiryMonth testID="month" />
      <CardExpiryYear testID="year" />
    </>
  );

  return {
    onChange,
    month: screen.getByTestId("month"),
    year: screen.getByTestId("year"),
  };
}

it("writes the two halves as one expiry", async () => {
  const { onChange, month, year } = await renderSplit();

  const user = userEvent.setup();
  await user.type(month, "12");
  await user.type(year, "34");

  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      card: expect.objectContaining({ expiry: { month: "12", year: "34" } }),
      isComplete: true,
    })
  );
});

it("shows each half only its own digits", async () => {
  const { month, year } = await renderSplit();

  const user = userEvent.setup();
  await user.type(year, "34");
  await user.type(month, "1");

  expect(month).toHaveProp("value", "1");
  expect(year).toHaveProp("value", "34");
});

it("takes two digits in each half", async () => {
  const { month, year } = await renderSplit();

  const user = userEvent.setup();
  await user.type(month, "123");
  await user.type(year, "3456");

  expect(month).toHaveProp("value", "12");
  expect(year).toHaveProp("value", "34");
});

it("reports no expiry until both halves make a date", async () => {
  const { onChange, month } = await renderSplit();

  const user = userEvent.setup();
  await user.type(month, "12");

  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      card: expect.objectContaining({ expiry: null }),
      isComplete: false,
    })
  );
});

it("reports an invalid date as the expiry's error", async () => {
  const { onChange, month, year } = await renderSplit();

  const user = userEvent.setup();
  await user.type(month, "13");
  await user.type(year, "34");
  fireEvent(year, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ errors: { expiry: "Invalid expiry" } })
    );
  });
});

it("reports no expiry error when the month is left for the year", async () => {
  const { onChange, month } = await renderSplit();

  const user = userEvent.setup();
  await user.type(month, "12");
  fireEvent(month, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ errors: {} })
    );
  });
});

it("does not check the expiry while the year is being typed", async () => {
  const { onChange, month, year } = await renderSplit();

  const user = userEvent.setup();
  await user.type(month, "12");
  fireEvent(month, "blur");
  await user.type(year, "3", { skipBlur: true });

  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ errors: {} })
  );
});

it("gives each half an id of its own", async () => {
  const { month, year } = await renderSplit();

  expect(month).toHaveProp("id", "expiry-month");
  expect(year).toHaveProp("id", "expiry-year");
});
