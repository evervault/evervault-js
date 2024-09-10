import Evervault from "./lib/main";

(async () => {
  const evervault = new Evervault(
    import.meta.env.VITE_EV_TEAM_UUID,
    import.meta.env.VITE_EV_APP_UUID,
    {
      urls: {
        keysUrl: import.meta.env.VITE_KEYS_URL,
        apiUrl: import.meta.env.VITE_API_URL,
        componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL,
      },
    }
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
