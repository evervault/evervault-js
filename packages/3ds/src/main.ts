import "./styles.css";

const searchParams = new URLSearchParams(window.location.search);
const team = searchParams.get("team");
const app = searchParams.get("app");
const session = searchParams.get("session");

const ev = new Evervault(team, app);

const tds = ev.ui.threeDSecure(session, {
  size: { height: window.innerHeight, width: window.innerWidth },
});
tds.mount("#frame");
