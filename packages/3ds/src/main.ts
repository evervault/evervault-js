import "./styles.css";

const searchParams = new URLSearchParams(window.location.search);
const team = searchParams.get("team");
const app = searchParams.get("app");
const session = searchParams.get("session");

const ev = new Evervault(team, app);

console.log(team, app, session);
const tds = ev.ui.threeDSecure(session, {
  size: { height: window.innerHeight, width: window.innerWidth },
});

console.log(tds)

tds.on("success", () => {
  console.log("3DS Success");
  document.getElementById("spinner")?.classList.add("visible");
});

tds.on("failure", () => {
  console.log("3DS failure");
  document.getElementById("spinner")?.classList.add("visible");
});

tds.on("error", (e) => {
  console.log("3DS error", e);
  document.getElementById("spinner")?.classList.add("visible");
});

tds.mount("#frame");
