import { CardPayload } from "@evervault/browser";
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

// First we mount a card UI Component to safely collect the users
// payment details.
const theme = evervault.ui.themes.clean();
const card = evervault.ui.card({ theme });
card.mount("#form");

// Handle the purchase button click event
const btn = document.getElementById("purchase");
btn?.addEventListener("click", () => {
  void handleSubmit();
});

async function handleSubmit() {
  // Validate the card details are correct before proceeding
  card.validate();
  if (!card.values?.isValid) return;

  // Next we need to make a request to the server to initiate a 3D Secure session
  const response = await fetch("http://localhost:3010/three-d-secure", {
    method: "POST",
    body: JSON.stringify({
      number: card.values.card.number,
      expiry: card.values.card.expiry,
    }),
  });

  if (!response.ok) {
    throw new Error(
      "Failed to initiate 3D Secure Session, Please ensure you are using an API key that has the correct permissions to create 3DS sessions."
    );
  }

  const { session } = (await response.json()) as { session: string };

  // Once a 3DS session has be initiated we can use the session ID to create
  // a 3DS UI Component to handle the 3DS process.
  const tds = evervault.ui.threeDSecure(session);

  // The 'complete' event is emitted when the 3DS process has finished successfully
  tds.on("success", () => {
    // At this point you should submit the payment details along with the 3DS
    // session ID to your server to complete the payment. You can use the Evervault
    // API to retrieve the cryptogram for the 3DS session to authorize the payment.
    void finalizePayment(session, card.values?.card);
  });

  // Mount the 3DS UI Component to begin the 3DS process
  // Calling mount without providing a target will render the 3DS flow inside
  // of a modal window on top of the page.
  tds.mount();
}

async function finalizePayment(
  session: string,
  cardDetails: CardPayload["card"]
) {
  await fetch("http://localhost:3010/checkout", {
    method: "POST",
    body: JSON.stringify({
      session,
      card: cardDetails,
    }),
  });

  document.getElementById("payment").style.display = "none";
  document.getElementById("success").style.display = "block";
}
