import Evervault from "./lib/main";

(async () => {
  const evervault = new Evervault(
    "team_197bf4c38e3c",
    "app_43740bff0824"
  );

  await evervault.enableFormEncryption();

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
