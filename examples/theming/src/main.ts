import { loadEvervault, clean, cssVar } from "@evervault/js";
import "./style.css";

const evervault = await loadEvervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID,
  {
    urls: {
      keysUrl: import.meta.env.VITE_KEYS_URL!,
      apiUrl: import.meta.env.VITE_API_URL!,
      componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL!,
    },
  }
);

evervault.ui
  .card({
    theme: clean(undefined, {
      primary: cssVar("--brand-color"),
      selectors: {
        label: {
          display: "block",
          marginBottom: 8,
          fontWeight: 600,
          color: cssVar("--brand-color"),
        },
      },
    }),
  })
  .mount("#card-1");
