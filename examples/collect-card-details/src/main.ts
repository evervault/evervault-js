import { loadEvervault } from "@evervault/js";
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

const card = evervault.ui.card({
  icons: true,
  theme: evervault.ui.themes.clean(),
  autoProgress: true,
});

card.on("change", (values) => {
  console.log("Change", values);
});

card.mount("#form");

const btn = document.getElementById("purchase");
const output = document.getElementById("output");

btn?.addEventListener("click", () => {
  if (!output) return;
  output.innerText = "";
  card.validate();

  if (card.values.isComplete) {
    console.log("Valid!", card.values);
    const { number, expiry, cvc } = card.values.card;
    output.innerHTML += "Thank you for your purchase! <br /><br />";
    output.innerHTML += `Your card number is ${number} <br /><br />`;
    output.innerHTML += `Your card expiry is ${expiry.month}/${expiry.year} <br /><br />`;
    output.innerHTML += `Your card cvc is ${cvc}`;
  } else {
    console.log("Invalid!", card.values);
    output.innerText = "Please enter valid card details";
  }
});
