import Evervault from "@evervault/browser";

const searchParams = new URLSearchParams(window.location.search);

const EV_TEAM_UUID = searchParams.get("team");
const EV_APP_UUID = searchParams.get("app");

const ev = new Evervault(EV_TEAM_UUID, EV_APP_UUID);

const encryptForm = document.getElementById("ev-encrypt-form");
encryptForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(encryptForm);

  const value = formData.get("ev-encrypt-input");
  const encryptedValue = await ev.encrypt(value);

  const tokenPayload = {
    data: encryptedValue
  };

  const fnPlayload = {
    encrypted: encryptedValue,
    unencrypted: value,
  };

  const result = await fetch("/api/test_decryption", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fnPlayload),
  });

  const resultToken = await fetch("/api/create-decrypt-token", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tokenPayload),
  });

  const decryptTokenResponse = await ev.decrypt(resultToken, tokenPayload);

  if (result.ok && decryptTokenResponse.data === value) {
    const data = await result.json();
    if (data.success) {
      document.getElementById("ev-encrypt-output").innerHTML = encryptedValue;
      document.getElementById("ev-encrypt-success").innerHTML = "Success!";
    }
  }
});
