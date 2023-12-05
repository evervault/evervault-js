import "./style.css";

const evervault = new window.Evervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID
);

const card = evervault.ui.cardDetails({
  theme: evervault.ui.themes.clean(),
});

card.on("change", (values) => {
  console.log("change", values);
});

card.on("swipe", (values) => {
  console.log("swipe", values);
});

card.mount("#form");

const btn = document.getElementById("purchase");
const output = document.getElementById("output");

btn?.addEventListener("click", () => {
  if (!output) return;
  output.innerText = "";
  card.validate();

  if (card.values?.isValid) {
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
