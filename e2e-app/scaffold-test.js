const ev = new window.Evervault(
    'team_8eba95118afb',
    'app_d9a6d46b70ab'
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
