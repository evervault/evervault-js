const evervault = new window.Evervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID,
  {
    urls: {
      keysUrl: import.meta.env.VITE_KEYS_URL as string,
      apiUrl: import.meta.env.VITE_API_URL as string,
      componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL as string,
    },
  }
);

const form = evervault.ui.form({
  theme: evervault.ui.themes.clean(),
  formUuid: import.meta.env.VITE_FORM_UUID,
  formSubmissionUrl: import.meta.env.VITE_FORM_SUBMISSION_URL,
});

form.on("error", () => {
  console.error("error submitting form");
});

form.on("submitted", () => {
  console.log("form has been submitted");
});

form.mount("#form");
