import Evervault from "./lib/main";

(async () => {
  const evervault = new Evervault(
    import.meta.env.VITE_EV_TEAM_UUID,
    import.meta.env.VITE_EV_APP_UUID
  );
  console.log(await evervault.encrypt("hello evervault"));

  const inputs = evervault.inputs("ev-inputs");

  inputs.on("change", (encryptedCardData) => {
    console.log(encryptedCardData);
  });

  const isLoaded = await inputs.isInputsLoaded;
  if (isLoaded) {
    console.log("Inputs loaded");
  }
})().catch(console.error);
