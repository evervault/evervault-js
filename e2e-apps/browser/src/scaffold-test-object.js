import Evervault from "@evervault/browser";

const searchParams = new URLSearchParams(window.location.search);

const EV_TEAM_UUID = searchParams.get("team");
const EV_APP_UUID = searchParams.get("app");

const ev = new Evervault(EV_TEAM_UUID, EV_APP_UUID);

const encryptForm = document.getElementById("ev-encrypt-form");
encryptForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(encryptForm);

  const objectToEncrypt = {
    name: formData.get("ev-name-input"),
    employer: {
      name: formData.get("ev-employer-name-input"),
      location: formData.get("ev-employer-location-input"),
      current: formData.get("ev-employer-current-input"),
    },
    yearOfBirth: formData.get("ev-year-of-birth-input"),
  };

  const encryptedValue = await ev.encrypt(objectToEncrypt);

  const fnPlayload = {
    encrypted: encryptedValue,
    unencrypted: objectToEncrypt,
  };

  const result = await fetch("http://localhost:3010/api/test_decryption", {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fnPlayload),
  });

  if (result.ok) {
    const data = await result.json();
    if (data.success) {
      document.getElementById("ev-encrypt-output").innerHTML = JSON.stringify(
        encryptedValue,
        null,
        2
      );
      document.getElementById("ev-encrypt-success").innerHTML = "Success!";
    }
  }
});
