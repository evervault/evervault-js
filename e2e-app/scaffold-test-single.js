const searchParams = new URLSearchParams(window.location.search);

const EV_TEAM_UUID = searchParams.get("team");
const EV_APP_UUID = searchParams.get("app");

const ev = new window.Evervault(
  EV_TEAM_UUID,
  EV_APP_UUID,
)

const encryptForm = document.getElementById("ev-encrypt-form");
encryptForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log('test')

  const formData = new FormData(encryptForm);

  const value = formData.get("ev-encrypt-input");
  const encryptedValue = await ev.encrypt(value);
  document.getElementById("ev-encrypt-output").innerHTML = encryptedValue;
});
