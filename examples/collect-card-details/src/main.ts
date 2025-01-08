import "./style.css";

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

const card = evervault.ui.card({
  icons: true,
  theme: evervault.ui.themes.clean(),
  redactCVC: true,
});

card.on("change", (values) => {
  console.log("change", values);
});

card.on("swipe", (values) => {
  console.log("swipe", values);
});

card.on("validate", (values) => {
  console.log("validate", values);
});

card.on("blur", (field) => {
  console.log("blur", field);
});

card.on("focus", (field) => {
  console.log("focus", field);
});

card.on("keyup", (field) => {
  console.log("keyup", field);
});

card.on("keydown", (field) => {
  console.log("keydown", field);
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
