import {
  act,
  fireEvent,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { renderCard } from "../../test/helpers/card";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryHalf";

// Focus leaving one input for another, as the device reports it: both events
// together, before anything else runs.
async function moveFocus(
  from: Parameters<typeof fireEvent>[0],
  to: Parameters<typeof fireEvent>[0]
) {
  await act(async () => {
    await Promise.all([fireEvent(from, "blur"), fireEvent(to, "focus")]);
  });
}

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

describe("split expiry", () => {
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
    await fireEvent(year, "blur");

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: { expiry: "Invalid expiry" } })
      );
    });
  });

  it("reports no expiry error when the month is left for the year", async () => {
    const { onChange, month, year } = await renderSplit();

    const user = userEvent.setup();
    await user.type(month, "12", { skipBlur: true });
    await moveFocus(month, year);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: {} })
      );
    });
  });

  it("checks the expiry when the month is left for anywhere but the year", async () => {
    const { onChange, month } = await renderSplit();

    const user = userEvent.setup();
    await user.type(month, "12");

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: { expiry: "Invalid expiry" } })
      );
    });
  });

  it("checks the expiry when the month is left for a year already typed", async () => {
    const { onChange, month, year } = await renderSplit();

    const user = userEvent.setup();
    await user.type(year, "2");
    await user.type(month, "12", { skipBlur: true });
    await moveFocus(month, year);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: { expiry: "Invalid expiry" } })
      );
    });
  });

  it("does not check the expiry while the year is being typed", async () => {
    const { onChange, month, year } = await renderSplit();

    const user = userEvent.setup();
    await user.type(month, "12", { skipBlur: true });
    await moveFocus(month, year);
    await user.type(year, "3", { skipBlur: true });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ errors: {} })
    );
  });

  it("reports no expiry error when the year is left for an empty month", async () => {
    const { onChange, month, year } = await renderSplit();

    const user = userEvent.setup();
    await user.type(year, "34", { skipBlur: true });
    await moveFocus(year, month);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: {} })
      );
    });
  });

  it("checks the expiry when the year is left for a month already typed", async () => {
    const { onChange, month, year } = await renderSplit();

    const user = userEvent.setup();
    await user.type(month, "12");
    await user.type(year, "20", { skipBlur: true });
    await moveFocus(year, month);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: { expiry: "Invalid expiry" } })
      );
    });
  });

  it("clears the expiry error once the date is valid", async () => {
    const { onChange, month, year } = await renderSplit();

    const user = userEvent.setup();
    await user.type(month, "12");
    await user.type(year, "20");
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: { expiry: "Invalid expiry" } })
      );
    });

    await user.clear(year);
    await user.type(year, "35");

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ errors: {} })
      );
    });
  });

  it("pads a month typed as a single digit above 1", async () => {
    const { month } = await renderSplit();

    const user = userEvent.setup();
    await user.type(month, "2");

    expect(month).toHaveDisplayValue("02");
  });

  it("keeps the month between 01 and 12", async () => {
    const { month } = await renderSplit();

    const user = userEvent.setup();
    await user.type(month, "13");
    expect(month).toHaveDisplayValue("1");

    await user.clear(month);
    await user.type(month, "00");
    expect(month).toHaveDisplayValue("0");
  });

  it("cuts a year filled in as four digits to two", async () => {
    const { year } = await renderSplit();

    await fireEvent.changeText(year, "2028");

    expect(year).toHaveDisplayValue("28");
  });

  it("stops a typed year at two digits", async () => {
    const { year } = await renderSplit();

    const user = userEvent.setup();
    await user.type(year, "283");

    expect(year).toHaveDisplayValue("28");
  });

  it("keeps each half's own id when given another", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardExpiryMonth testID="month" id="mine" />
        <CardExpiryYear testID="year" id="theirs" />
      </>
    );

    expect(getByTestId("month")).toHaveProp("id", "expiry-month");
    expect(getByTestId("year")).toHaveProp("id", "expiry-year");
  });

  it("gives each half an id of its own", async () => {
    const { month, year } = await renderSplit();

    expect(month).toHaveProp("id", "expiry-month");
    expect(year).toHaveProp("id", "expiry-year");
  });
});
