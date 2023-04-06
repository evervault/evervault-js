import Evervault from "@evervault/browser";

const EV_TEAM_UUID = searchParams.get("team");
const EV_APP_UUID = searchParams.get("app");

const evervault = new Evervault(EV_TEAM_UUID, EV_APP_UUID, {
  inputsUrl: "http://localhost:3002",
});

const inputs = evervault.inputs("ev-inputs");

const hook = inputs.on("change", async (encryptedCardDetails) => {
  // TODO - send encryptedCardDetails to your backend
});
