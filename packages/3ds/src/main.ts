import "./styles.css";

const searchParams = new URLSearchParams(window.location.search);
const team = searchParams.get("team");
const app = searchParams.get("app");
const session = searchParams.get("session");

const ev = new Evervault(team, app, {
  urls: {
    keysUrl: import.meta.env.VITE_KEYS_URL as string,
    apiUrl: import.meta.env.VITE_API_URL as string,
    componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL as string,
  },
});

const tds = ev.ui.threeDSecure(session, {
  size: { height: window.innerHeight, width: window.innerWidth },
});

tds.on("success", () => {
  document.getElementById("spinner")?.classList.add("visible");
});

tds.on("failure", () => {
  document.getElementById("spinner")?.classList.add("visible");
});

tds.on("error", (e) => {
  document.getElementById("spinner")?.classList.add("visible");
});

tds.mount("#frame");

