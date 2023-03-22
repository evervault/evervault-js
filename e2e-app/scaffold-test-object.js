const searchParams = new URLSearchParams(window.location.search);

const EV_TEAM_UUID = searchParams.get("team");
const EV_APP_UUID = searchParams.get("app");

const ev = new window.Evervault(EV_TEAM_UUID, EV_APP_UUID);

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
  document.getElementById("ev-encrypt-output").innerHTML = JSON.stringify(
    encryptedValue,
    null,
    2
  );
});
